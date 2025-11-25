@echo off
REM Instalador rápido del Agente Logic Horario
REM Requiere permisos de administrador

echo === INSTALADOR AGENTE LOGIC HORARIO ===
echo.

REM Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Permisos de administrador verificados
) else (
    echo ❌ ERROR: Ejecuta este script como administrador
    echo.
    echo Solución: Clic derecho > "Ejecutar como administrador"
    pause
    exit /b 1
)

REM Verificar que estamos en el directorio correcto
if not exist "hourly_agent_smart.ps1" (
    echo ❌ ERROR: Ejecuta este script desde el directorio App\Task\Logic\
    echo.
    echo Ubicación correcta: glory\App\Task\Logic\install_agent.bat
    pause
    exit /b 1
)

echo ✅ Archivos del agente encontrados

REM Verificar PowerShell
powershell -Command "Write-Host '✅ PowerShell disponible'" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERROR: PowerShell no está disponible
    pause
    exit /b 1
)

echo ✅ PowerShell verificado

REM Verificar cursor-agent (opcional - se verifica en runtime)
cursor-agent --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️ ADVERTENCIA: cursor-agent no encontrado
    echo.
    echo Instálalo desde: https://cursor.com/install
    echo El agente se puede instalar de todas formas.
    echo.
    choice /C SN /M "¿Continuar con la instalación? (S/N)"
    if errorlevel 2 exit /b 1
) else (
    echo ✅ Cursor CLI encontrado
)

echo.
echo === CONFIGURANDO TAREA PROGRAMADA ===

REM Crear la tarea programada
REM Ejecutar cada hora a partir de la próxima hora en punto
for /f "tokens=1-2 delims=:" %%a in ("%time%") do set hour=%%a
set /a next_hour=%hour%+1
if %next_hour% equ 24 set next_hour=0
if %next_hour% lss 10 set next_hour=0%next_hour%

set start_time=%next_hour%:00

echo Creando tarea "LogicHourlyAgent"...
echo - Script: %~dp0hourly_agent_smart.ps1
echo - Frecuencia: Cada hora
echo - Inicio: %start_time%
echo - Usuario: %USERNAME%
echo.

schtasks /Create /TN "LogicHourlyAgent" /TR "powershell.exe -ExecutionPolicy Bypass -File '%~dp0hourly_agent_smart.ps1'" /SC HOURLY /ST %start_time% /RL HIGHEST /RU "%USERDOMAIN%\%USERNAME%" /F

if %errorLevel% equ 0 (
    echo.
    echo ✅ ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!
    echo.
    echo 📅 El agente Logic se ejecutará cada hora a partir de las %start_time%
    echo 📊 Revisa los logs en: %~dp0hourly_agent_smart.log
    echo.
    echo 🔧 Comandos útiles:
    echo   - Ver estado: schtasks /Query /TN "LogicHourlyAgent"
    echo   - Probar ahora: hourly_agent_smart.ps1 -TestMode
    echo   - Desinstalar: install_agent.bat uninstall
    echo.
) else (
    echo.
    echo ❌ ERROR: No se pudo crear la tarea programada
    echo.
    echo Posibles soluciones:
    echo 1. Verifica que tengas permisos de administrador
    echo 2. Cierra y vuelve a abrir PowerShell/Command Prompt como admin
    echo 3. Verifica que no haya otra tarea con el mismo nombre
    echo.
    pause
    exit /b 1
)

REM Verificar instalación
echo Verificando instalación...
schtasks /Query /TN "LogicHourlyAgent" >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Tarea programada verificada correctamente
) else (
    echo ⚠️ ADVERTENCIA: No se pudo verificar la tarea (pero puede estar creada)
)

echo.
echo === INSTALACIÓN FINALIZADA ===
echo.
echo El agente Logic está listo para funcionar automáticamente.
echo ¡Que la grandeza te acompañe! 💪
echo.
pause



