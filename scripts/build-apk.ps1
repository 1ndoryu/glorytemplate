#!/usr/bin/env pwsh
<#
 Script: build-apk.ps1
 Genera, firma e instala el APK de Kamples en un solo comando.

 Uso:
   .\scripts\build-apk.ps1                    # Build + firmar + instalar
   .\scripts\build-apk.ps1 -SoloFirmar        # Solo firmar APK existente
   .\scripts\build-apk.ps1 -SinInstalar        # Build + firmar, sin instalar
   .\scripts\build-apk.ps1 -Dispositivo "192.168.0.10:5555"  # Instalar en dispositivo especifico
#>
param(
    [switch]$SoloFirmar,
    [switch]$SinInstalar,
    [string]$Dispositivo = "emulator-5554"
)

$ErrorActionPreference = "Stop"

# Rutas del proyecto
$raizTema = Split-Path -Parent $PSScriptRoot
$dirDesktop = Join-Path $raizTema "desktop"
$rutaApk = Join-Path $dirDesktop "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk"
$rutaKeystore = Join-Path $raizTema "kamples.keystore"

# Herramientas
$sdkDir = "$env:LOCALAPPDATA\Android\Sdk"
$apksigner = Join-Path $sdkDir "build-tools\36.1.0\apksigner.bat"
$adb = Join-Path $sdkDir "platform-tools\adb.exe"

# Verificaciones
if (-not (Test-Path $rutaKeystore)) {
    Write-Error "Keystore no encontrado en: $rutaKeystore"
    exit 1
}
if (-not (Test-Path $apksigner)) {
    Write-Error "apksigner no encontrado. Verifica Android SDK build-tools."
    exit 1
}

# Configurar entorno
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:CARGO_TARGET_DIR = "C:\cargo-target\kamples"

# Paso 1: Build (si no es SoloFirmar)
if (-not $SoloFirmar) {
    Write-Host "`n=== Compilando APK ===" -ForegroundColor Cyan
    Push-Location $dirDesktop
    try {
        npx tauri android build --apk
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build fallido con codigo: $LASTEXITCODE"
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# Verificar que el APK existe
if (-not (Test-Path $rutaApk)) {
    Write-Error "APK no encontrado en: $rutaApk"
    exit 1
}

$tamano = [math]::Round((Get-Item $rutaApk).Length / 1MB, 1)
Write-Host "`nAPK generado: $tamano MB" -ForegroundColor Green

# Paso 2: Firmar
Write-Host "`n=== Firmando APK ===" -ForegroundColor Cyan
& $apksigner sign `
    --ks $rutaKeystore `
    --ks-key-alias "kamples" `
    --ks-pass "pass:BNsVIXWpx9JKn6cD5LZe" `
    $rutaApk

if ($LASTEXITCODE -ne 0) {
    Write-Error "Firma fallida con codigo: $LASTEXITCODE"
    exit 1
}

Write-Host "APK firmado correctamente" -ForegroundColor Green

# Paso 3: Instalar (si no es SinInstalar)
if (-not $SinInstalar) {
    Write-Host "`n=== Instalando APK en $Dispositivo ===" -ForegroundColor Cyan
    & $adb -s $Dispositivo install -r $rutaApk

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Instalacion fallida. Intentando con -t..." -ForegroundColor Yellow
        & $adb -s $Dispositivo install -r -t $rutaApk
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nAPK instalado exitosamente en $Dispositivo" -ForegroundColor Green
    } else {
        Write-Error "No se pudo instalar el APK"
        exit 1
    }
}

# Resumen
Write-Host "`n=== Listo ===" -ForegroundColor Cyan
Write-Host "APK: $rutaApk"
Write-Host "Tamano: $tamano MB"
