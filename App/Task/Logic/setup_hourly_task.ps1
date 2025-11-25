# Script para configurar el Agente Logic Horario en el Programador de Tareas de Windows

param(
    [switch]$Uninstall,
    [string]$ScriptToRun = "hourly_agent_smart.ps1",
    [string]$TaskName = "LogicHourlyAgent",
    [string]$Description = "Agente Logic que se ejecuta cada hora usando Cursor CLI"
)

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$FullScriptPath = Join-Path $ScriptPath $ScriptToRun

Write-Host "=== CONFIGURADOR DE AGENTE LOGIC HORARIO ===" -ForegroundColor Cyan

# Verificar que el script existe
if (-not (Test-Path $FullScriptPath)) {
    Write-Host "ERROR: Script no encontrado: $FullScriptPath" -ForegroundColor Red
    exit 1
}

# Verificar permisos de administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ADVERTENCIA: Se requieren permisos de administrador para configurar tareas programadas." -ForegroundColor Yellow
    Write-Host "Ejecuta este script como administrador." -ForegroundColor Yellow
    exit 1
}

if ($Uninstall) {
    Write-Host "Desinstalando tarea programada: $TaskName" -ForegroundColor Yellow

    try {
        schtasks /Delete /TN "$TaskName" /F > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Tarea '$TaskName' eliminada exitosamente" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ La tarea '$TaskName' no existía o ya fue eliminada" -ForegroundColor Blue
        }
    } catch {
        Write-Host "ERROR: No se pudo eliminar la tarea: $($_.Exception.Message)" -ForegroundColor Red
    }

    exit 0
}

Write-Host "Instalando tarea programada: $TaskName" -ForegroundColor Green
Write-Host "Script: $FullScriptPath" -ForegroundColor Gray
Write-Host "Frecuencia: Cada hora" -ForegroundColor Gray
Write-Host "Descripción: $Description" -ForegroundColor Gray
Write-Host ""

# Verificar si ya existe la tarea
$existingTask = schtasks /Query /TN "$TaskName" 2>$null
$taskExists = $LASTEXITCODE -eq 0

if ($taskExists) {
    Write-Host "⚠️ La tarea '$TaskName' ya existe. ¿Deseas reemplazarla? (S/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host

    if ($response -notmatch "^[sS]$|^[yY]$|^[sS][iI]$|^[yY][eE][sS]$") {
        Write-Host "Instalación cancelada." -ForegroundColor Blue
        exit 0
    }

    # Eliminar tarea existente
    schtasks /Delete /TN "$TaskName" /F > $null 2>&1
}

# Crear la tarea programada
# Ejecutar cada hora a partir de la próxima hora en punto
$startTime = (Get-Date).AddHours(1).ToString("HH:mm")

$taskCommand = @"
schtasks /Create /TN "$TaskName" /TR "powershell.exe -ExecutionPolicy Bypass -File '$FullScriptPath'" /SC HOURLY /ST $startTime /RL HIGHEST /RU "$env:USERDOMAIN\$env:USERNAME" /F
"@

Write-Host "Ejecutando: $taskCommand" -ForegroundColor Gray

try {
    Invoke-Expression $taskCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tarea programada '$TaskName' creada exitosamente" -ForegroundColor Green
        Write-Host "📅 Se ejecutará cada hora a partir de las $startTime" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para verificar: schtasks /Query /TN '$TaskName'" -ForegroundColor Cyan
        Write-Host "Para eliminar: schtasks /Delete /TN '$TaskName'" -ForegroundColor Cyan
        Write-Host "Para ejecutar manualmente: .\$ScriptToRun" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error al crear la tarea programada (Código: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error al crear la tarea: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== INSTALACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "El agente Logic se ejecutará automáticamente cada hora." -ForegroundColor White
Write-Host "Revisa los logs en: $ScriptPath\hourly_agent_smart.log" -ForegroundColor White



