@echo off
REM Desinstalador del Agente Logic Horario

echo === DESINSTALADOR AGENTE LOGIC HORARIO ===
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

echo Eliminando tarea programada "LogicHourlyAgent"...

schtasks /Delete /TN "LogicHourlyAgent" /F >nul 2>&1

if %errorLevel% equ 0 (
    echo.
    echo ✅ ¡DESINSTALACIÓN COMPLETADA EXITOSAMENTE!
    echo.
    echo La tarea programada "LogicHourlyAgent" ha sido eliminada.
    echo El agente ya no se ejecutará automáticamente.
    echo.
    echo ℹ️ NOTA: Los archivos del agente permanecen en el directorio.
    echo    Puedes eliminarlos manualmente si ya no los necesitas.
    echo.
) else (
    echo.
    echo ⚠️ La tarea "LogicHourlyAgent" no existía o ya fue eliminada.
    echo.
    echo Esto significa que el agente no estaba instalado o ya fue desinstalado.
    echo.
)

REM Verificar si quedan archivos de log
if exist "hourly_agent_smart.log" (
    echo Archivos encontrados:
    if exist "hourly_agent_smart.log" echo   📄 hourly_agent_smart.log
    if exist "agent_results.log" echo   📄 agent_results.log
    echo.
    choice /C SN /M "¿Eliminar archivos de log? (S/N)"
    if errorlevel 1 (
        del "hourly_agent_smart.log" 2>nul
        del "agent_results.log" 2>nul
        echo ✅ Archivos de log eliminados
    ) else (
        echo ℹ️ Archivos de log conservados
    )
)

echo.
echo === DESINSTALACIÓN FINALIZADA ===
echo.
pause



