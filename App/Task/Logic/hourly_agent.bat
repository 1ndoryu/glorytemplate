@echo off
cd /d "%~dp0"

:: Agente Logic Horario - Se ejecuta cada hora usando Cursor CLI
:: Requiere: cursor-agent instalado y API key configurada

echo [%DATE% %TIME%] Iniciando agente Logic horario...

:: Verificar si cursor-agent está disponible
where cursor-agent >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: cursor-agent no está instalado o no está en PATH
    echo Instala desde: https://cursor.com/install
    exit /b 1
)

:: Configurar variables de entorno (si no están ya configuradas)
if "%CURSOR_API_KEY%"=="" (
    echo Error: CURSOR_API_KEY no está configurada
    echo Configura tu API key de Cursor
    exit /b 1
)

:: Ejecutar agente usando Cursor CLI con modelo grok-code
echo Ejecutando análisis del estado Logic...
cursor-agent -p --force --model grok-code --output-format text "
Eres el agente Logic automatizado. Tu tarea es ejecutar el agente Logic cada hora siguiendo las reglas del sistema.

INSTRUCCIONES:
1. Lee el estado actual de Logic usando la API
2. Aplica el Árbol de Decisión Lógica definido en los contextos
3. Toma acciones apropiadas según los protocolos
4. Documenta tus acciones en un nuevo contexto

REGLAS DEL SISTEMA (de los contextos pinned):
- Máximo 5 pasos activos
- Prioridad: Trabajo cliente > Salud > Proyectos personales
- En fase baja: Modo mínimo viable, descanso prioritario
- Protocolo ejercicio: Si >48h sin ejercicio, crear paso de cardio de 11 min

ACCIONES PERMITIDAS:
- Consultar estado (/state)
- Crear/pausar/resumir pasos (/steps)
- Crear mensajes de ayuda (/help-message)
- Agregar contextos (/contexts)
- Gestionar hábitos (/habits)

API CONFIGURACIÓN:
- URL: http://glorybuilder.local/wp-json/glory-logic/v1
- API Key: HLasrn5gAagnjbNxVvfrljLeayQQdjWL
- User ID: 1

ANALIZA el estado y ACTÚA apropiadamente. Si no hay problemas, no hagas nada.
Documenta tus acciones en un contexto nuevo.
"

if %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Agente Logic completado exitosamente
) else (
    echo [%DATE% %TIME%] Error en ejecución del agente Logic
    exit /b 1
)

echo [%DATE% %TIME%] Fin del agente horario
pause



