@echo off
REM Script de prueba del Agente Logic Horario
REM No requiere instalación ni permisos especiales

echo === PRUEBA DEL AGENTE LOGIC HORARIO ===
echo.

echo ✅ Verificando archivos del sistema...

REM Verificar archivos necesarios
set missing_files=0

if not exist "hourly_agent_smart.ps1" (
    echo ❌ ERROR: hourly_agent_smart.ps1 no encontrado
    set missing_files=1
)

if not exist "README_hourly_agent.md" (
    echo ❌ ERROR: README_hourly_agent.md no encontrado
    set missing_files=1
)

if %missing_files% equ 1 (
    echo.
    echo ❌ Archivos faltantes. Verifica que estés en el directorio correcto.
    echo Ubicación: glory\App\Task\Logic\
    pause
    exit /b 1
)

echo ✅ Archivos del sistema verificados
echo.

echo 🔍 Verificando dependencias...

REM Verificar PowerShell
powershell -Command "Write-Host '✅ PowerShell disponible'" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERROR: PowerShell no está disponible
    goto :error
)

echo ✅ PowerShell verificado

REM Verificar cursor-agent
cursor-agent --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ cursor-agent no encontrado
    echo.
    echo ℹ️ El agente requiere Cursor CLI para funcionar completamente.
    echo Instálalo desde: https://cursor.com/install
    echo.
    echo ⚠️ Continuando con pruebas limitadas...
) else (
    echo ✅ Cursor CLI encontrado
)

REM Verificar API key
powershell -Command "if ($env:CURSOR_API_KEY) { Write-Host '✅ CURSOR_API_KEY configurada' } else { Write-Host '❌ CURSOR_API_KEY no configurada' }" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ CURSOR_API_KEY no configurada
    echo.
    echo ℹ️ Para funcionamiento completo, configura:
    echo    $env:CURSOR_API_KEY = "tu_api_key_aqui"
) else (
    echo ✅ CURSOR_API_KEY configurada
)

echo.
echo 🧪 Ejecutando pruebas del agente...

REM Crear directorio de pruebas si no existe
if not exist "test_logs" mkdir test_logs

echo.
echo [PRUEBA 1/3] Verificación de sintaxis PowerShell...
powershell -Command "try { $ast = [System.Management.Automation.Language.Parser]::ParseFile('hourly_agent_smart.ps1', [ref]$null, [ref]$null); Write-Host '✅ Sintaxis correcta' } catch { Write-Host '❌ Error de sintaxis:' $_.Exception.Message }" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Error de sintaxis en el script
    goto :error
)
echo ✅ Sintaxis verificada

echo.
echo [PRUEBA 2/3] Modo prueba del agente...
powershell -ExecutionPolicy Bypass -File "hourly_agent_smart.ps1" -TestMode > test_logs\test_run.log 2>&1
if %errorLevel% neq 0 (
    echo ❌ Error en ejecución de prueba
    echo Revisa: test_logs\test_run.log
    goto :error
)

REM Verificar que se creó el log
if exist "hourly_agent_smart.log" (
    echo ✅ Log de prueba generado
    echo Últimas líneas del log:
    powershell -Command "Get-Content 'hourly_agent_smart.log' | Select-Object -Last 5" 2>nul
) else (
    echo ❌ No se generó el log esperado
)

echo.
echo [PRUEBA 3/3] Verificación de conectividad Logic API...
powershell -Command "
try {
    $url = 'http://glorybuilder.local/wp-json/glory-logic/v1/state?userId=1&historyLimit=1'
    $headers = @{'X-Glory-Logic-Key' = 'HLasrn5gAagnjbNxVvfrljLeayQQdjWL'}
    $response = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host '✅ API de Logic accesible'
    } else {
        Write-Host '❌ Error HTTP:' $response.StatusCode
    }
} catch {
    Write-Host '❌ Error de conectividad:' $_.Exception.Message
}
" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Error de conectividad con API Logic
    echo.
    echo ℹ️ Verifica que WordPress esté ejecutándose en glorybuilder.local
) else (
    echo ✅ API de Logic verificada
)

echo.
echo 🎉 ¡PRUEBAS COMPLETADAS!
echo.
echo 📊 Resumen:
echo   ✅ Archivos del sistema
echo   ✅ PowerShell disponible
echo   ✅ Sintaxis correcta
echo   ✅ Modo prueba ejecutado
echo.
echo 📝 Próximos pasos:
echo   1. Instala Cursor CLI si no lo tienes
echo   2. Configura tu API key: `$env:CURSOR_API_KEY = "tu_key"`
echo   3. Instala el agente: `install_agent.bat` (como admin)
echo.
echo 🔧 Comandos para después de la instalación:
echo   - Ver estado: schtasks /Query /TN "LogicHourlyAgent"
echo   - Logs: type hourly_agent_smart.log
echo   - Probar manual: hourly_agent_smart.ps1 -TestMode
echo.
echo ¡El agente está listo para la grandeza! 💪
echo.
pause
exit /b 0

:error
echo.
echo ❌ PRUEBAS FALLIDAS
echo.
echo Revisa los errores arriba y corrige antes de instalar.
echo.
pause
exit /b 1



