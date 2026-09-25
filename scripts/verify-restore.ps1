param([Parameter(Mandatory=$true)][string]$BackupFile)
$ErrorActionPreference = "Stop"
$backup = (Resolve-Path -LiteralPath $BackupFile).Path
if ([System.IO.Path]::GetExtension($backup) -ne ".dump") { throw "Expected a .dump backup file." }
$container = (docker compose ps -q postgres).Trim()
if (-not $container) { throw "The postgres Compose service is not running." }
$inside = "/tmp/careflow-restore-check.dump"
$checkDatabase = "careflow_restore_check"
docker cp $backup "${container}:$inside"
docker compose exec -T postgres sh -c "dropdb --if-exists -U `$POSTGRES_USER $checkDatabase; createdb -U `$POSTGRES_USER $checkDatabase; pg_restore -U `$POSTGRES_USER -d $checkDatabase $inside; psql -U `$POSTGRES_USER -d $checkDatabase -c 'select count(*) as flyway_migrations from flyway_schema_history'; dropdb -U `$POSTGRES_USER $checkDatabase; rm -f $inside"
if ($LASTEXITCODE -ne 0) { throw "Restore verification failed; inspect the database logs." }
Write-Host "Restore rehearsal passed in isolated database $checkDatabase."
