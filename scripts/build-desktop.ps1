#!/usr/bin/env pwsh
<#
 Script: build-desktop.ps1
 Genera el instalador Windows (NSIS) de Kamples en un solo comando.

 Uso:
   .\scripts\build-desktop.ps1              # Build completo
   .\scripts\build-desktop.ps1 -Debug       # Build en modo debug (mas rapido, sin optimizar)
   .\scripts\build-desktop.ps1 -SoloFrontend  # Solo compilar el frontend (Vite)
#>
param(
    [switch]$Debug,
    [switch]$SoloFrontend
)

$ErrorActionPreference = "Stop"

/* Rutas del proyecto */
$raizTema = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dirDesktop = Join-Path $raizTema "desktop"

/* CARGO_TARGET_DIR fuera de OneDrive para evitar WDAC */
$env:CARGO_TARGET_DIR = "C:\cargo-target\kamples"

Write-Host "`n=== Build Desktop Kamples ===" -ForegroundColor Cyan

Push-Location $dirDesktop
try {
    if ($SoloFrontend) {
        Write-Host "Compilando solo frontend (Vite)..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build frontend fallido"
            exit 1
        }
        Write-Host "Frontend compilado en desktop/dist/" -ForegroundColor Green
        exit 0
    }

    /* Build completo Tauri */
    if ($Debug) {
        Write-Host "Compilando en modo DEBUG..." -ForegroundColor Yellow
        npx tauri build --debug
    } else {
        Write-Host "Compilando en modo RELEASE..." -ForegroundColor Yellow
        npx tauri build
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build fallido con codigo: $LASTEXITCODE"
        exit 1
    }

    /* Buscar el instalador generado */
    $modo = if ($Debug) { "debug" } else { "release" }
    $dirBundle = Join-Path $env:CARGO_TARGET_DIR "x86_64-pc-windows-msvc\$modo\bundle\nsis"

    if (Test-Path $dirBundle) {
        $instalador = Get-ChildItem $dirBundle -Filter "*.exe" | Select-Object -First 1
        if ($instalador) {
            $tamano = [math]::Round($instalador.Length / 1MB, 1)
            Write-Host "`n=== Listo ===" -ForegroundColor Cyan
            Write-Host "Instalador: $($instalador.FullName)"
            Write-Host "Tamano: $tamano MB"
        }
    } else {
        Write-Host "`nBuild completado. Busca el instalador en:" -ForegroundColor Yellow
        Write-Host "$env:CARGO_TARGET_DIR\x86_64-pc-windows-msvc\$modo\bundle\"
    }
} finally {
    Pop-Location
}
