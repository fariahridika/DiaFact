# Prints ca.pem as a single-line value for Render's DB_SSL_CA env var.
# Usage:  powershell -File .\scripts\print-ca-env.ps1
$caPath = Join-Path $PSScriptRoot "..\ca.pem"
if (-not (Test-Path -LiteralPath $caPath)) {
  Write-Error "Missing ca.pem at DiaFact App\ca.pem"
  exit 1
}
$raw = Get-Content -LiteralPath $caPath -Raw
$oneLine = ($raw -replace "`r`n", "`n" -replace "`n", "\n").Trim()
Write-Host "Copy the next line into Render DB_SSL_CA:"
Write-Host $oneLine
