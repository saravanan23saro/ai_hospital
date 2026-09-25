param([string]$OutputDirectory = "./backups")
$ErrorActionPreference = "Stop"
$resolved = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputDirectory))
$workspace = [System.IO.Path]::GetFullPath((Get-Location).Path)
if (-not $resolved.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Backup output must remain inside the workspace." }
New-Item -ItemType Directory -Force -Path $resolved | Out-Null
$container = (docker compose ps -q postgres).Trim()
if (-not $container) { throw "The postgres Compose service is not running." }
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$inside = "/tmp/careflow-$stamp.dump"
docker compose exec -T postgres sh -c "pg_dump -Fc -U `$POSTGRES_USER -d `$POSTGRES_DB -f $inside"
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
$destination = Join-Path $resolved "careflow-$stamp.dump"
docker cp "${container}:$inside" $destination
docker compose exec -T postgres rm -f $inside
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $destination)) { throw "Backup copy failed." }
Get-FileHash -Algorithm SHA256 $destination | Format-List
Write-Host "Backup created: $destination"
