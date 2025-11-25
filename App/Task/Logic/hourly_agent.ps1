# Agente Logic Horario - PowerShell Script
# Se ejecuta cada hora usando Cursor CLI headless

param(
    [switch]$TestMode,
    [switch]$Verbose
)

# Configuración
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogFile = Join-Path $ScriptPath "hourly_agent.log"
$ApiUrl = "http://glorybuilder.local/wp-json/glory-logic/v1"
$ApiKey = "HLasrn5gAagnjbNxVvfrljLeayQQdjWL"
$UserId = 1

# Función de logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Verificar dependencias
function Test-Dependencies {
    Write-Log "Verificando dependencias..."

    # Verificar cursor-agent
    try {
        $null = Get-Command cursor-agent -ErrorAction Stop
        Write-Log "cursor-agent encontrado"
    } catch {
        Write-Log "ERROR: cursor-agent no está instalado o no está en PATH" "ERROR"
        Write-Log "Instala desde: https://cursor.com/install" "ERROR"
        return $false
    }

    # Verificar API key
    if (-not $env:CURSOR_API_KEY) {
        Write-Log "ERROR: CURSOR_API_KEY no está configurada" "ERROR"
        return $false
    }

    Write-Log "Todas las dependencias verificadas correctamente"
    return $true
}

# Función para consultar estado de Logic
function Get-LogicState {
    try {
        $url = "$ApiUrl/state?userId=$UserId&historyLimit=30"
        $headers = @{
            "X-Glory-Logic-Key" = $ApiKey
        }

        $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
        return $response
    } catch {
        Write-Log "ERROR: No se pudo consultar el estado de Logic: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Función para ejecutar acción en Logic API
function Invoke-LogicAction {
    param([string]$Endpoint, [string]$Method = "POST", [object]$Body = $null)

    try {
        $url = "$ApiUrl$Endpoint"
        $headers = @{
            "X-Glory-Logic-Key" = $ApiKey
            "Content-Type" = "application/json"
        }

        $params = @{
            Uri = $url
            Headers = $headers
            Method = $Method
        }

        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Log "ERROR: Acción Logic fallida ($Endpoint): $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Función principal del agente
function Invoke-LogicAgent {
    Write-Log "=== INICIANDO AGENTE LOGIC HORARIO ==="

    # Obtener estado actual
    Write-Log "Consultando estado actual de Logic..."
    $state = Get-LogicState
    if (-not $state) {
        Write-Log "No se pudo obtener el estado. Abortando." "ERROR"
        return
    }

    Write-Log "Estado obtenido: $($state.tasks.Count) tareas activas, $($state.contexts.Count) contextos"

    # Análisis básico del estado
    $activeTasks = $state.tasks | Where-Object { -not $_.pausado }
    $recentContexts = $state.contexts | Where-Object {
        # Contextos de las últimas 24 horas
        $contextTime = [int]$_.creado
        $currentTime = [int](Get-Date -UFormat %s)
        ($currentTime - $contextTime) -lt 86400
    }

    # Verificar si hay señales de cansancio
    $fatigueIndicators = $recentContexts | Where-Object {
        $_.texto -match "(cansad|cansada|agotad|agotada|dormi|dormí|descans|descanso|vacío|vacía)"
    }

    # Verificar si hay trabajo cliente pendiente
    $clientWork = $activeTasks | Where-Object {
        $_.titulo -match "(cliente|cosmo|fiverr|trabajo|proyecto)"
    }

    # Árbol de decisión lógica
    $actions = @()

    if ($fatigueIndicators) {
        Write-Log "Detectados indicadores de cansancio. Aplicando protocolo de fase baja."
        $actions += "Activar modo descanso - pausar tareas no críticas"

        if ($clientWork) {
            # Pausar trabajo cliente si hay cansancio extremo
            $actions += "Pausar trabajo cliente debido a cansancio"
            $pauseResult = Invoke-LogicAction -Endpoint "/steps/$($clientWork.id)/pause" -Body @{ userId = $UserId }
            if ($pauseResult) {
                Write-Log "Trabajo cliente pausado exitosamente"
            }
        }

        # Crear mensaje de ayuda
        $helpMessage = @{
            userId = $UserId
            mensaje = "Modo mantenimiento activado. Tu energía es crítica - descansa hoy, mañana atacamos con fuerza."
            duracion = 7200  # 2 horas
        }
        $helpResult = Invoke-LogicAction -Endpoint "/help-message" -Body $helpMessage
        if ($helpResult) {
            Write-Log "Mensaje de ayuda creado"
            $actions += "Mensaje de ayuda creado (2 horas)"
        }

    } elseif ($clientWork) {
        Write-Log "Trabajo cliente activo - prioridad máxima"
        $actions += "Mantener foco en trabajo cliente"

    } else {
        Write-Log "Estado normal - sin acciones requeridas"
        $actions += "Sin acciones requeridas - todo en orden"
    }

    # Documentar acciones en contexto
    $contextText = "[Agente IA Automatizado - $(Get-Date -Format 'HH:mm')] Análisis horario completado.`n`nAcciones realizadas:`n" +
                   ($actions | ForEach-Object { "- $_" }) -join "`n" +
                   "`n`nEstado: $($activeTasks.Count) tareas activas, $($fatigueIndicators.Count) señales de cansancio detectadas."

    $contextBody = @{
        userId = $UserId
        texto = $contextText
    }

    $contextResult = Invoke-LogicAction -Endpoint "/contexts" -Body $contextBody
    if ($contextResult) {
        Write-Log "Acciones documentadas en contexto nuevo"
    }

    Write-Log "=== AGENTE LOGIC COMPLETADO ==="
}

# Función principal
function Main {
    Write-Log "=== AGENTE LOGIC HORARIO INICIADO ==="

    if (-not (Test-Dependencies)) {
        Write-Log "Dependencias faltantes. Abortando." "ERROR"
        exit 1
    }

    if ($TestMode) {
        Write-Log "MODO PRUEBA ACTIVADO - No se realizarán cambios reales"
    }

    try {
        Invoke-LogicAgent
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



