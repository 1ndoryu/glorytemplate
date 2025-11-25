# Agente Logic Horario Inteligente - Usa Cursor CLI con modelo grok-code
# Se ejecuta cada hora con análisis completo por IA

param(
    [switch]$TestMode,
    [switch]$Verbose,
    [string]$Model = "gpt-5"
)

# Configuración
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $ScriptPath "hourly_agent_smart.log"
$CursorAgent = "wsl.exe"

# Función de logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"

    if ($Verbose) {
        Write-Host $LogEntry
    }

    Add-Content -Path $LogFile -Value $LogEntry
}

# Verificar dependencias
function Test-Dependencies {
    Write-Log "Verificando dependencias..."

    # Verificar cursor-agent
    try {
        $null = Get-Command $CursorAgent -ErrorAction Stop
        Write-Log "cursor-agent encontrado"
    } catch {
        Write-Log "ERROR: $CursorAgent no está instalado o no está en PATH" "ERROR"
        Write-Log "Instala desde: https://cursor.com/install" "ERROR"
        return $false
    }

    # Verificar API key (configurarla si no existe)
    if (-not $env:CURSOR_API_KEY) {
        $env:CURSOR_API_KEY = "key_4095045be046747d9378724f412aecfd1f71a871cc2ef3b089136b30885dc1c3"
        Write-Log "API key configurada desde script"
    }

    Write-Log "Dependencias verificadas correctamente"
    return $true
}

# Función para ejecutar el agente Cursor
function Invoke-CursorAgent {
    param([string]$Prompt)

    if ($TestMode) {
        Write-Log "MODO PRUEBA: Simulando ejecución de cursor-agent con prompt: $Prompt"
        return "Ejecución simulada - sin cambios reales"
    }

    Write-Log "Ejecutando cursor-agent con modelo $Model..."

    # Usar un comando directo con wsl.exe
    $bashCommand = @"
/home/wan/.local/bin/cursor-agent -p --force --model $Model --output-format text "$($Prompt -replace '"', '""')"
"@

    try {
        $process = Start-Process -FilePath "wsl.exe" -ArgumentList "bash", "-c", $bashCommand -NoNewWindow -Wait -PassThru -RedirectStandardOutput "cursor_output.txt" -RedirectStandardError "cursor_error.txt"

        $output = Get-Content "cursor_output.txt" -Raw
        $errorOutput = Get-Content "cursor_error.txt" -Raw

        if ($process.ExitCode -eq 0) {
            Write-Log "Cursor agent ejecutado exitosamente"
            return $output
        } else {
            Write-Log "ERROR: Cursor agent falló (ExitCode: $($process.ExitCode))" "ERROR"
            if ($errorOutput) {
                Write-Log "Error output: $errorOutput" "ERROR"
            }
            return $null
        }
    } catch {
        Write-Log "ERROR: Excepción ejecutando cursor-agent: $($_.Exception.Message)" "ERROR"
        return $null
    } finally {
        # Limpiar archivos temporales
        Remove-Item "cursor_output.txt" -ErrorAction SilentlyContinue
        Remove-Item "cursor_error.txt" -ErrorAction SilentlyContinue
    }
}

# Función principal del agente inteligente
function Invoke-SmartLogicAgent {
    Write-Log "=== INICIANDO AGENTE LOGIC INTELIGENTE ==="
    Write-Log "Usando modelo: $Model"

    # Prompt inteligente para el agente Cursor
    $agentPrompt = @"
Eres el Agente Logic Automatizado. Te ejecuto cada hora para gestionar el sistema Logic de manera inteligente.

OBJETIVO:
Analizar el estado actual del sistema Logic y tomar decisiones óptimas según las reglas del sistema.

CONTEXTO DEL SISTEMA:
- Máximo 5 pasos activos
- Jerarquía de prioridades: Trabajo cliente > Salud > Proyectos personales
- Ciclo Entrar/Salir: En fatiga extrema, activar Modo Mínimo Viable
- Protocolo ejercicio: Si >48h sin ejercicio, paso "11 min cardio"
- Economía de guerra: Trabajo cliente tiene prioridad absoluta

TU TAREA:
1. Consultar el estado actual usando la API de Logic
2. Analizar según el Árbol de Decisión Lógica
3. Tomar acciones apropiadas (crear pasos, pausar, mensajes de ayuda, contextos)
4. Documentar todo en un contexto nuevo

API CONFIGURACIÓN:
- URL Base: http://glorybuilder.local/wp-json/glory-logic/v1
- API Key: HLasrn5gAagnjbNxVvfrljLeayQQdjWL
- User ID: 1

ENDPOINTS DISPONIBLES:
/state - Estado completo
/history - Historial
/steps - Gestionar pasos
/help-message - Mensajes de ayuda
/contexts - Gestionar contextos
/habits - Gestionar hábitos

INSTRUCCIONES ESPECÍFICAS:
- Si detectas cansancio extremo: Crear mensaje de ayuda compasivo, pausar tareas no críticas
- Si hay trabajo cliente pendiente: Mantener prioridad máxima
- Si todo está bien: No hacer nada
- Siempre documentar acciones en contexto nuevo
- Usar PowerShell para llamadas API cuando sea necesario

ANALIZA Y ACTÚA. Escribe un contexto documentando tu análisis y acciones tomadas.
"@

    # Ejecutar el agente inteligente
    $result = Invoke-CursorAgent -Prompt $agentPrompt

    if ($result) {
        Write-Log "Agente inteligente ejecutado exitosamente"
        Write-Log "Resultado: $($result.Substring(0, [Math]::Min(200, $result.Length)))..."

        # Guardar resultado completo en log detallado
        $resultLog = Join-Path $ScriptPath "agent_results.log"
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        Add-Content -Path $resultLog -Value "=== $timestamp ==="
        Add-Content -Path $resultLog -Value $result
        Add-Content -Path $resultLog -Value ""

    } else {
        Write-Log "Fallo en ejecución del agente inteligente" "ERROR"
    }

    Write-Log "=== AGENTE LOGIC INTELIGENTE COMPLETADO ==="
}

# Función principal
function Main {
    Write-Log "=== AGENTE LOGIC HORARIO INTELIGENTE INICIADO ==="

    if (-not (Test-Dependencies)) {
        Write-Log "Dependencias faltantes. Abortando." "ERROR"
        exit 1
    }

    if ($TestMode) {
        Write-Log "MODO PRUEBA ACTIVADO - No se realizarán cambios reales"
    }

    try {
        Invoke-SmartLogicAgent
        Write-Log "Ejecución completada exitosamente"
    } catch {
        Write-Log "ERROR FATAL: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Ejecutar si no se está importando como módulo
if ($MyInvocation.InvocationName -ne '.') {
    Main
}



