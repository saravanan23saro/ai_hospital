param([string]$PrometheusUrl = "http://localhost:9090")
$ErrorActionPreference = "Stop"

$rules = Invoke-RestMethod -Uri "$PrometheusUrl/api/v1/rules" -TimeoutSec 10
if ($rules.status -ne "success") { throw "Prometheus rules API did not return success." }

$alerts = @($rules.data.groups.rules | Where-Object { $_.type -eq "alerting" })
$expected = @(
    "CareFlowApiUnavailable",
    "CareFlowAiUnavailable",
    "CareFlowApiHighErrorRate",
    "CareFlowApiHighLatency"
)
foreach ($name in $expected) {
    $rule = $alerts | Where-Object { $_.name -eq $name }
    if (-not $rule) { throw "Required alert rule '$name' is not loaded." }
    if ($rule.health -ne "ok") { throw "Alert rule '$name' is unhealthy: $($rule.lastError)" }
}

$targets = Invoke-RestMethod -Uri "$PrometheusUrl/api/v1/targets" -TimeoutSec 10
if ($targets.status -ne "success") { throw "Prometheus targets API did not return success." }
foreach ($job in @("hospital-api", "hospital-ai")) {
    $target = @($targets.data.activeTargets | Where-Object { $_.labels.job -eq $job })
    if (-not $target) { throw "Prometheus target '$job' is missing." }
    if (@($target | Where-Object { $_.health -ne "up" }).Count -gt 0) {
        throw "Prometheus target '$job' is not healthy."
    }
}

Write-Host "Prometheus alert rules and scrape targets OK"
