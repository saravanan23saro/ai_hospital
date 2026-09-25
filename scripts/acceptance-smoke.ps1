param(
    [string]$ApiUrl = "http://localhost:8180",
    [string]$AiUrl = "http://localhost:8000",
    [string]$WebUrl = "http://localhost:3200",
    [int]$Attempts = 12,
    [int]$RetryDelaySeconds = 5
)
$ErrorActionPreference = "Stop"
function Assert-Up([string]$Name, [string]$Url) {
    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "$Name OK"
                return
            }
        } catch {
            if ($attempt -eq $Attempts) { throw }
        }
        if ($attempt -lt $Attempts) { Start-Sleep -Seconds $RetryDelaySeconds }
    }
    throw "$Name did not become ready after $Attempts attempts."
}
Assert-Up "API readiness" "$ApiUrl/actuator/health/readiness"
Assert-Up "AI health" "$AiUrl/health"
Assert-Up "Web portal" $WebUrl
$payload='{"candidates":[{"candidate_id":"a","preference_fit":0.9,"availability_quality":0.8,"workload_balance":0.7},{"candidate_id":"b","preference_fit":0.5,"availability_quality":0.5,"workload_balance":0.5}]}'
$rank=Invoke-RestMethod -Method Post -Uri "$AiUrl/v1/rank" -ContentType "application/json" -Body $payload
if ($rank.rankings[0].candidateId -ne "a") { throw "AI deterministic ranking acceptance check failed." }
Write-Host "Deterministic ranking OK"
