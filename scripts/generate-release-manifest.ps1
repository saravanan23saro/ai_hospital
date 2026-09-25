param(
    [string]$OutputFile = "./release-evidence.json",
    [string]$CommitSha = $env:GITHUB_SHA
)
$ErrorActionPreference = "Stop"

$images = [ordered]@{
    api = "ai_powered-api:latest"
    web = "ai_powered-web:latest"
    ai = "ai_powered-ai-service:latest"
}
$sboms = [ordered]@{
    api = "./sbom-api.cdx.json"
    web = "./sbom-web.cdx.json"
    ai = "./sbom-ai.cdx.json"
}

$components = [ordered]@{}
foreach ($name in $images.Keys) {
    if (-not (Test-Path -LiteralPath $sboms[$name])) { throw "Missing SBOM '$($sboms[$name])'." }
    $imageId = (& docker image inspect --format '{{.Id}}' $images[$name]).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $imageId) { throw "Unable to inspect image '$($images[$name])'." }
    $components[$name] = [ordered]@{
        image = $images[$name]
        imageId = $imageId
        sbom = Split-Path -Leaf $sboms[$name]
        sbomSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $sboms[$name]).Hash.ToLowerInvariant()
    }
}

$manifest = [ordered]@{
    schemaVersion = 1
    commitSha = if ($CommitSha) { $CommitSha } else { "local" }
    generatedAtUtc = [DateTime]::UtcNow.ToString("o")
    components = $components
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $OutputFile -Encoding utf8
Write-Host "Release evidence manifest written to $OutputFile"
