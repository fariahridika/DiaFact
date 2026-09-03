# Prints ca.pem as a single-line value for Render's DB_SSL_CA env var.
# Usage (PowerShell):
#   .\scripts\print-ca-env.ps1
$caPath = Join-Path $PSScriptRoot '..\ca.pem'
if (-not (Test-Path -LiteralPath $caPath)) {
  Write-Error "Missing ca.pem next to the repo root (DiaFact App\ca.pem)."
  exit 1
}
$raw = Get-Content -LiteralPath $caPath -Raw
$oneLine = ($raw -replace "`r`n", "`n" -replace "`n", '\n').TrimEnd('\n')
Write-Output 'Copy everything below into Render → diafact-api → Environment → DB_SSL_CA:'
Write-Output '----------------------------------------------------------------'
Write-Output $oneLine
Write-Output '----------------------------------------------------------------'
