$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$jarCandidates = @(
    (Join-Path $scriptDir "Lavalink.jar"),
    (Join-Path $scriptDir "lavalink.jar")
)

$jarPath = $jarCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $jarPath) {
    Write-Host "[ERRO] Lavalink.jar nao encontrado em $scriptDir" -ForegroundColor Red
    Write-Host "[ERRO] Coloque o arquivo Lavalink.jar dentro da pasta lavalink do projeto." -ForegroundColor Red
    exit 1
}

$configPath = Join-Path $scriptDir "application.yml"
if (-not (Test-Path $configPath)) {
    Write-Host "[ERRO] application.yml nao encontrado em $scriptDir" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Iniciando Lavalink com $jarPath" -ForegroundColor Cyan
Set-Location $scriptDir
java "-Dconfig.location=$configPath" -jar $jarPath
