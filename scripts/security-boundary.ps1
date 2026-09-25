param(
    [string]$ApiUrl = "http://localhost:8180",
    [string]$WebOrigin = "http://localhost:3200"
)
$ErrorActionPreference = "Stop"

function Invoke-AllowHttpError {
    param([string]$Uri, [string]$Method = "Get", [hashtable]$Headers = @{})
    try {
        return Invoke-WebRequest -UseBasicParsing -Uri $Uri -Method $Method -Headers $Headers -TimeoutSec 10
    } catch {
        if ($_.Exception.Response) { return $_.Exception.Response }
        throw
    }
}

foreach ($path in @(
    "/api/v1/patients/me",
    "/api/v1/operations/dashboard",
    "/api/v1/admin/doctor-applications",
    "/api/v1/intelligence/rank"
)) {
    $response = Invoke-AllowHttpError "$ApiUrl$path"
    if ([int]$response.StatusCode -notin @(401, 403)) { throw "Protected endpoint '$path' returned $([int]$response.StatusCode) without authentication." }
}
Write-Host "Protected API boundaries OK"

$public = Invoke-WebRequest -UseBasicParsing -Uri "$ApiUrl/api/v1/system/info" -TimeoutSec 10
if ($public.Headers["Content-Security-Policy"] -notmatch "default-src 'none'") { throw "API content security policy is missing." }
if ($public.Headers["X-Frame-Options"] -ne "DENY") { throw "API frame protection is missing." }
if ($public.Headers["X-Content-Type-Options"] -ne "nosniff") { throw "API content-type protection is missing." }
if (-not $public.Headers["X-Request-ID"]) { throw "Request correlation header is missing." }
Write-Host "API security headers OK"

$allowed = Invoke-AllowHttpError -Uri "$ApiUrl/api/v1/system/info" -Method "Options" -Headers @{
    Origin = $WebOrigin
    "Access-Control-Request-Method" = "GET"
}
if ($allowed.Headers["Access-Control-Allow-Origin"] -ne $WebOrigin) { throw "Configured web origin was not allowed by CORS." }

$denied = Invoke-AllowHttpError -Uri "$ApiUrl/api/v1/system/info" -Method "Options" -Headers @{
    Origin = "https://attacker.invalid"
    "Access-Control-Request-Method" = "GET"
}
if ($denied.Headers["Access-Control-Allow-Origin"]) { throw "Untrusted origin was allowed by CORS." }
Write-Host "CORS allowlist boundary OK"
