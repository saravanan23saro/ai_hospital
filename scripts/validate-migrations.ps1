param(
    [string]$MigrationDirectory = "./apps/api/src/main/resources/db/migration",
    [string]$CatalogDirectory = "./db/migrations"
)
$ErrorActionPreference = "Stop"

$migrations = @(Get-ChildItem -LiteralPath $MigrationDirectory -File -Filter "V*__*.sql" | Sort-Object Name)
if ($migrations.Count -eq 0) { throw "No executable Flyway migrations were found in '$MigrationDirectory'." }

$versions = @()
foreach ($migration in $migrations) {
    if ($migration.Name -notmatch '^V([0-9]+)__[a-z0-9_]+\.sql$') {
        throw "Migration '$($migration.Name)' does not use the required V<number>__lower_snake_case.sql format."
    }
    $version = [int]$Matches[1]
    if ($versions -contains $version) { throw "Duplicate Flyway version V$version was found." }
    if ($migration.Length -eq 0) { throw "Migration '$($migration.Name)' is empty." }
    if (-not (Test-Path -LiteralPath (Join-Path $CatalogDirectory $migration.Name))) {
        throw "Migration '$($migration.Name)' is missing from the root migration catalog."
    }
    $versions += $version
}

for ($expected = 1; $expected -le $versions.Count; $expected++) {
    if ($versions -notcontains $expected) { throw "Flyway migration sequence is missing V$expected." }
}

Write-Host "Migration integrity OK: $($migrations.Count) contiguous executable migrations (V1-V$($versions.Count))."
