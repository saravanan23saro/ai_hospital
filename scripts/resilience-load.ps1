param(
    [string]$ApiUrl = "http://localhost:8180",
    [string]$AdminEmail = "admin@careflow.local",
    [string]$AdminPassword = "CareFlowAdmin!2026",
    [int]$ConcurrentRequests = 100,
    [int]$MaximumBatchMilliseconds = 5000
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

function Wait-Healthy([string]$Url, [int]$Attempts = 18) {
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
            if ($response.StatusCode -eq 200) { return }
        } catch {
            if ($attempt -eq $Attempts) { throw }
        }
        Start-Sleep -Seconds 2
    }
}

$loginBody = @{ email = $AdminEmail; password = $AdminPassword } | ConvertTo-Json
$tokens = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/v1/auth/login" -ContentType "application/json" -Body $loginBody
if (-not $tokens.accessToken) { throw "Could not obtain an access token for resilience verification." }
$headers = @{ Authorization = "Bearer $($tokens.accessToken)" }
$rankBody = @{
    candidates = @(
        @{ candidateId = "a"; preferenceFit = 0.9; availabilityQuality = 0.8; workloadBalance = 0.7 },
        @{ candidateId = "b"; preferenceFit = 0.5; availabilityQuality = 0.5; workloadBalance = 0.5 }
    )
} | ConvertTo-Json -Depth 4

$normal = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$ApiUrl/api/v1/intelligence/rank" -Headers $headers -ContentType "application/json" -Body $rankBody
if ($normal.Headers["X-AI-Fallback"] -ne "false") { throw "Expected the advisory AI path before the failure exercise." }

try {
    docker compose stop ai-service
    if ($LASTEXITCODE -ne 0) { throw "Could not stop the advisory AI service." }
    $fallback = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$ApiUrl/api/v1/intelligence/rank" -Headers $headers -ContentType "application/json" -Body $rankBody
    $fallbackBody = $fallback.Content | ConvertFrom-Json
    if ($fallback.Headers["X-AI-Fallback"] -ne "true") { throw "API did not declare deterministic fallback mode." }
    if (-not $fallbackBody.fallback -or $fallbackBody.rankings[0].candidateId -ne "a") {
        throw "Fallback ranking contract failed."
    }
    Write-Host "Advisory AI outage fallback OK"
} finally {
    docker compose start ai-service
    if ($LASTEXITCODE -ne 0) { throw "Could not restart the advisory AI service." }
    Wait-Healthy "http://localhost:8000/health"
}

$client = [System.Net.Http.HttpClient]::new()
try {
    $tasks = @()
    $timer = [System.Diagnostics.Stopwatch]::StartNew()
    for ($index = 0; $index -lt $ConcurrentRequests; $index++) {
        $tasks += $client.GetAsync("$ApiUrl/actuator/health/readiness")
    }
    [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$tasks)
    $timer.Stop()
    foreach ($task in $tasks) {
        $response = $task.Result
        if (-not $response.IsSuccessStatusCode) { throw "Readiness request returned $([int]$response.StatusCode)." }
        $response.Dispose()
    }
    $elapsed = [Math]::Round($timer.Elapsed.TotalMilliseconds, 1)
    if ($elapsed -gt $MaximumBatchMilliseconds) { throw "Concurrent batch took ${elapsed}ms, exceeding ${MaximumBatchMilliseconds}ms." }
    Write-Host "$ConcurrentRequests concurrent readiness requests OK (batch ${elapsed}ms)"
} finally {
    $client.Dispose()
}
