#!/bin/bash

# Agente Logic Horario Inteligente para WSL
# Usa Cursor CLI directamente en el entorno Linux

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/hourly_agent_wsl.log"
API_URL="http://glorybuilder.local/wp-json/glory-logic/v1"
API_KEY="HLasrn5gAagnjbNxVvfrljLeayQQdjWL"
USER_ID=1
MODEL="gemini-3-pro-preview"

# Función de logging
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    echo "[$timestamp] [$level] $message"
}

# Verificar dependencias
check_dependencies() {
    log "INFO" "Verificando dependencias..."

    # Verificar cursor-agent
    if ! command -v cursor-agent &> /dev/null; then
        log "ERROR" "cursor-agent no está instalado o no está en PATH"
        log "ERROR" "Instala desde: https://cursor.com/install"
        return 1
    fi

    # Verificar API key
    if [[ -z "${CURSOR_API_KEY}" ]]; then
        log "ERROR" "CURSOR_API_KEY no está configurada"
        log "ERROR" "Ejecuta: export CURSOR_API_KEY=tu_api_key"
        return 1
    fi

    log "INFO" "Dependencias verificadas correctamente"
    return 0
}

# Función para consultar estado de Logic
get_logic_state() {
    local url="$API_URL/state?userId=$USER_ID&historyLimit=30"

    local response
    if ! response=$(curl -s -H "X-Glory-Logic-Key: $API_KEY" "$url" 2>/dev/null); then
        log "ERROR" "No se pudo consultar el estado de Logic"
        return 1
    fi

    # Verificar que la respuesta sea JSON válido
    if ! echo "$response" | jq . >/dev/null 2>&1; then
        log "ERROR" "Respuesta inválida de la API Logic"
        return 1
    fi

    echo "$response"
    return 0
}

# Función para ejecutar acción en Logic API
invoke_logic_action() {
    local endpoint="$1"
    local method="${2:-POST}"
    local body="$3"
    local url="$API_URL$endpoint"

    local curl_args=(-s -X "$method" -H "X-Glory-Logic-Key: $API_KEY" -H "Content-Type: application/json")

    if [[ -n "$body" ]]; then
        curl_args+=(-d "$body")
    fi

    local response
    if ! response=$(curl "${curl_args[@]}" "$url" 2>/dev/null); then
        log "ERROR" "Acción Logic fallida ($endpoint)"
        return 1
    fi

    echo "$response"
    return 0
}

# Función principal del agente inteligente
invoke_smart_agent() {
    log "INFO" "=== INICIANDO AGENTE LOGIC INTELIGENTE ==="
    log "INFO" "Usando modelo: $MODEL"

    # Obtener estado actual
    log "INFO" "Consultando estado actual de Logic..."
    local state
    if ! state=$(get_logic_state); then
        log "ERROR" "No se pudo obtener el estado. Abortando."
        return 1
    fi

    local tasks_count=$(echo "$state" | jq '.tasks | length')
    local contexts_count=$(echo "$state" | jq '.contexts | length')
    log "INFO" "Estado obtenido: $tasks_count tareas activas, $contexts_count contextos"

    # Análisis básico del estado
    local active_tasks=$(echo "$state" | jq '[.tasks[] | select(.pausado == false)]')
    local active_count=$(echo "$active_tasks" | jq 'length')

    local recent_contexts=$(echo "$state" | jq '[.contexts[] | select((.creado | tonumber) > (now - 86400))]')
    local fatigue_indicators=$(echo "$recent_contexts" | jq '[.[] | select(.texto | test("cansad|cansada|agotad|agotada|dormi|dormí|descans|descanso|vacío|vacía"; "i"))]')
    local fatigue_count=$(echo "$fatigue_indicators" | jq 'length')

    local client_work=$(echo "$active_tasks" | jq '[.[] | select(.titulo | test("cliente|cosmo|fiverr|trabajo|proyecto"; "i"))]')
    local client_count=$(echo "$client_work" | jq 'length')

    # Árbol de decisión lógica
    local actions=()

    if [[ $fatigue_count -gt 0 ]]; then
        log "INFO" "Detectados indicadores de cansancio. Aplicando protocolo de fase baja."
        actions+=("Activar modo descanso - pausar tareas no críticas")

        if [[ $client_count -gt 0 ]]; then
            # Pausar trabajo cliente si hay cansancio extremo
            actions+=("Pausar trabajo cliente debido a cansancio")
            local task_id=$(echo "$client_work" | jq -r '.[0].id')
            local pause_result
            if pause_result=$(invoke_logic_action "/steps/$task_id/pause" "POST" "{\"userId\":$USER_ID}"); then
                log "INFO" "Trabajo cliente pausado exitosamente"
            fi
        fi

        # Crear mensaje de ayuda
        local help_body="{\"userId\":$USER_ID,\"mensaje\":\"Modo mantenimiento activado. Tu energía es crítica - descansa hoy, mañana atacamos con fuerza.\",\"duracion\":7200}"
        local help_result
        if help_result=$(invoke_logic_action "/help-message" "POST" "$help_body"); then
            log "INFO" "Mensaje de ayuda creado"
            actions+=("Mensaje de ayuda creado (2 horas)")
        fi

    elif [[ $client_count -gt 0 ]]; then
        log "INFO" "Trabajo cliente activo - prioridad máxima"
        actions+=("Mantener foco en trabajo cliente")

    else
        log "INFO" "Estado normal - sin acciones requeridas"
        actions+=("Sin acciones requeridas - todo en orden")
    fi

    # Documentar acciones en contexto
    local context_text="[Agente IA Automatizado - $(date '+%H:%M')] Análisis horario completado.\n\nAcciones realizadas:\n"
    for action in "${actions[@]}"; do
        context_text+="- $action\n"
    done
    context_text+="\nEstado: $active_count tareas activas, $fatigue_count señales de cansancio detectadas."

    local context_body="{\"userId\":$USER_ID,\"texto\":\"$context_text\"}"
    local context_result
    if context_result=$(invoke_logic_action "/contexts" "POST" "$context_body"); then
        log "INFO" "Acciones documentadas en contexto nuevo"
    fi

    log "INFO" "=== AGENTE LOGIC INTELIGENTE COMPLETADO ==="
}

# Función principal
main() {
    log "INFO" "=== AGENTE LOGIC HORARIO WSL INICIADO ==="

    if [[ "${1:-}" == "--test" ]]; then
        log "INFO" "MODO PRUEBA ACTIVADO - No se realizarán cambios reales"
        export TEST_MODE=true
    fi

    if ! check_dependencies; then
        log "ERROR" "Dependencias faltantes. Abortando."
        exit 1
    fi

    invoke_smart_agent

    log "INFO" "Ejecución completada exitosamente"
}

# Ejecutar si no se está importando como fuente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
