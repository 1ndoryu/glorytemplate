#!/bin/bash

# Agente Logic Horario con IA real usando Cursor CLI
# Se ejecuta cada 6 horas con análisis inteligente completo y de forma autónoma

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/hourly_agent_wsl_ai.log"
API_URL="http://glorybuilder.local/wp-json/glory-logic/v1"
# API de Logic (clave separada de CURSOR_API_KEY)
LOGIC_API_KEY="${LOGIC_API_KEY:-HLasrn5gAagnjbNxVvfrljLeayQQdjWL}"
USER_ID=1
# Modelo de IA usado por cursor-agent (configurable por entorno)
MODEL="${LOGIC_AGENT_MODEL:-gpt-5}"

# Asegurar que ~/.local/bin esté en PATH (para entornos no interactivos)
export PATH="$HOME/.local/bin:$PATH"

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
    log "DEBUG" "PATH actual: $PATH"

    # Resolver binario de cursor-agent (por PATH o ruta absoluta conocida)
    if command -v cursor-agent &> /dev/null; then
        CURSOR_AGENT_BIN="$(command -v cursor-agent)"
    elif [[ -x "$HOME/.local/bin/cursor-agent" ]]; then
        CURSOR_AGENT_BIN="$HOME/.local/bin/cursor-agent"
    else
        log "ERROR" "cursor-agent no está instalado o no está en PATH"
        log "ERROR" "Instala desde: https://cursor.com/install"
        return 1
    fi
    log "INFO" "cursor-agent resuelto en: $CURSOR_AGENT_BIN"

    # Verificar API key de Cursor (para la IA remota)
    if [[ -z "${CURSOR_API_KEY}" ]]; then
        log "ERROR" "CURSOR_API_KEY no está configurada"
        return 1
    fi

    # Log sintético de la API (sin exponer la key completa)
    local apiKeyPreview="${CURSOR_API_KEY:0:12}..."
    log "DEBUG" "API_URL: $API_URL, USER_ID: $USER_ID, CURSOR_API_KEY: $apiKeyPreview"

    # Verificar dependencias de CLI locales
    if ! command -v curl &> /dev/null; then
        log "ERROR" "curl no está instalado"
        return 1
    fi

    if ! command -v jq &> /dev/null; then
        log "ERROR" "jq no está instalado"
        return 1
    fi

    log "INFO" "Dependencias verificadas correctamente"
    return 0
}

# Función para consultar los datos de Logic desde el host (sin usar la red del sandbox de IA)
get_logic_data() {
    log "INFO" "Consultando datos actuales de Logic (state, history, steps, habits)..."

    local headers=(-s -H "X-Glory-Logic-Key: $LOGIC_API_KEY" -H "Content-Type: application/json")

    local state history steps habits

    if ! state=$(curl "${headers[@]}" "$API_URL/state?userId=$USER_ID&historyLimit=30" 2>/dev/null); then
        log "ERROR" "No se pudo obtener /state"
        return 1
    fi

    if ! echo "$state" | jq . >/dev/null 2>&1; then
        log "ERROR" "Respuesta inválida de /state"
        return 1
    fi

    if ! history=$(curl "${headers[@]}" "$API_URL/history?userId=$USER_ID&limit=50" 2>/dev/null); then
        log "ERROR" "No se pudo obtener /history"
        return 1
    fi

    if ! echo "$history" | jq . >/dev/null 2>&1; then
        log "ERROR" "Respuesta inválida de /history"
        return 1
    fi

    if ! steps=$(curl "${headers[@]}" "$API_URL/steps?userId=$USER_ID" 2>/dev/null); then
        log "ERROR" "No se pudo obtener /steps"
        return 1
    fi

    if ! echo "$steps" | jq . >/dev/null 2>&1; then
        log "ERROR" "Respuesta inválida de /steps"
        return 1
    fi

    if ! habits=$(curl "${headers[@]}" "$API_URL/habits?userId=$USER_ID" 2>/dev/null); then
        log "ERROR" "No se pudo obtener /habits"
        return 1
    fi

    if ! echo "$habits" | jq . >/dev/null 2>&1; then
        log "ERROR" "Respuesta inválida de /habits"
        return 1
    fi

    # Empaquetar todo en un solo JSON que la IA pueda leer
    local logic_json
    if ! logic_json=$(jq -n \
        --argjson state "$state" \
        --argjson history "$history" \
        --argjson steps "$steps" \
        --argjson habits "$habits" \
        '{state:$state, history:$history, steps:$steps, habits:$habits}'); then
        log "ERROR" "No se pudo empaquetar JSON de Logic"
        return 1
    fi

    echo "$logic_json"
    return 0
}

# Función para invocar acciones en Logic API (mutaciones)
invoke_logic_action() {
    local endpoint="$1"
    local method="${2:-POST}"
    local body="$3"
    local url="$API_URL$endpoint"

    # En modo prueba solo logueamos la acción
    if [[ "${TEST_MODE:-}" == "true" ]]; then
        log "INFO" "[TEST_MODE] Simularía llamada $method $url con body: $body"
        echo '{"ok":true,"testMode":true}'
        return 0
    fi

    local curl_args=(-s -X "$method" -H "X-Glory-Logic-Key: $LOGIC_API_KEY" -H "Content-Type: application/json")

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

# Aplicar las acciones propuestas por la IA (formato JSON estructurado)
apply_ai_actions() {
    local actions_json="$1"

    # Validar JSON
    if ! echo "$actions_json" | jq . >/dev/null 2>&1; then
        log "ERROR" "Salida de IA no es JSON válido, no se aplican acciones"
        return 1
    fi

    local actions_count
    actions_count=$(echo "$actions_json" | jq '.acciones | length' 2>/dev/null || echo 0)
    log "INFO" "IA propuso $actions_count acciones"

    # Recorrer acciones
    echo "$actions_json" | jq -c '.acciones[]' 2>/dev/null | while read -r action; do
        local tipo
        tipo=$(echo "$action" | jq -r '.tipo // empty')

        case "$tipo" in
            "pausarStep")
                local step_id
                step_id=$(echo "$action" | jq -r '.stepId // empty')
                if [[ -n "$step_id" ]]; then
                    log "INFO" "Pausando step $step_id según IA"
                    invoke_logic_action "/steps/$step_id/pause" "POST" "{\"userId\":$USER_ID}" >/dev/null || true
                fi
                ;;
            "crearHelpMessage")
                local texto duracion texto_json
                texto=$(echo "$action" | jq -r '.texto // ""')
                duracion=$(echo "$action" | jq -r '.duracion // 7200')
                # Serializar texto de forma segura como string JSON
                texto_json=$(printf '%s' "$texto" | jq -Rs '.') || texto_json="\"\""
                log "INFO" "Creando help-message según IA (duración $duracion segundos)"
                invoke_logic_action "/help-message" "POST" "{\"userId\":$USER_ID,\"mensaje\":$texto_json,\"duracion\":$duracion}" >/dev/null || true
                ;;
            "crearContexto")
                local texto texto_json
                texto=$(echo "$action" | jq -r '.texto // ""')
                texto_json=$(printf '%s' "$texto" | jq -Rs '.') || texto_json="\"\""
                log "INFO" "Creando contexto según IA"
                invoke_logic_action "/contexts" "POST" "{\"userId\":$USER_ID,\"texto\":$texto_json}" >/dev/null || true
                ;;
            *)
                log "INFO" "Tipo de acción desconocido o vacío en salida de IA: '$tipo'"
                ;;
        esac
    done
}

# Función principal del agente con IA
invoke_ai_agent() {
    log "INFO" "=== INICIANDO AGENTE LOGIC CON IA ==="
    log "INFO" "Usando modelo: $MODEL"

    # Consultar datos de Logic desde este script (la IA no tiene red a glorybuilder.local)
    local logic_data
    if ! logic_data=$(get_logic_data); then
        log "ERROR" "No se pudieron obtener datos de Logic. Abortando ejecución de IA."
        return 1
    fi

    # Usar un directorio sandbox vacío para evitar que lea el repo completo
    local SANDBOX_DIR="$HOME/logic-agent-sandbox"
    mkdir -p "$SANDBOX_DIR"
    cd "$SANDBOX_DIR" || cd "$HOME"

    # Prompt completo para Cursor CLI con IA (enfocado en leer JSON y devolver acciones estructuradas)
    local prompt
    prompt=$(cat <<EOF
Eres el Agente Logic Automatizado. Te ejecuto cada 6 horas para gestionar el sistema Logic de manera inteligente.

OBJETIVO:
Analizar el estado actual del sistema Logic y tomar decisiones óptimas según las reglas del sistema.

CONTEXTO DEL SISTEMA:
- Máximo 5 pasos activos
- Jerarquía de prioridades: Trabajo cliente > Salud > Proyectos personales
- Ciclo Entrar/Salir: En fatiga extrema, activar Modo Mínimo Viable
- Protocolo ejercicio: Si >48h sin ejercicio, paso "11 min cardio"
- Economía de guerra: Trabajo cliente tiene prioridad absoluta

DATOS ACTUALES (JSON):
$logic_data

TU TAREA:
1. Leer los datos JSON anteriores (state, history, steps, habits).
2. Analizar según el Árbol de Decisión Lógica.
3. Decidir acciones (crear/pausar pasos, mensajes de ayuda, contextos).
4. Siempre crear al menos un contexto nuevo resumiendo tu análisis, aunque no tomes otras acciones.

FORMATO DE SALIDA (OBLIGATORIO):
Responde ÚNICAMENTE con un objeto JSON válido, sin texto extra, con esta forma:
{
  "acciones": [
    { "tipo": "pausarStep", "stepId": 123, "motivo": "fatiga" },
    { "tipo": "crearHelpMessage", "texto": "mensaje para el usuario", "duracion": 7200 },
    { "tipo": "crearContexto", "texto": "texto completo del contexto a crear" }
  ]
}

REGLAS:
- No intentes hacer llamadas HTTP ni usar curl; ya tienes todos los datos.
- Todas las claves deben estar en español y en camelCase.
- Siempre incluye al menos una acción de tipo "crearContexto" con tu análisis.
- No incluyas comentarios ni explicaciones fuera del JSON.
EOF
)

    # Métricas del prompt
    local promptChars=${#prompt}
    local promptLines
    promptLines=$(printf '%s\n' "$prompt" | wc -l | tr -d ' ')

    log "INFO" "Ejecutando análisis con IA (sandbox, sin tocar archivos del repo)..."
    log "DEBUG" "Sandbox: $SANDBOX_DIR, longitud prompt: ${promptChars} chars, ${promptLines} líneas"

    # Ejecutar cursor-agent con el prompt (sin --force para no modificar archivos)
    local ai_output
    if ! ai_output=$("$CURSOR_AGENT_BIN" -p --model "$MODEL" --output-format text "$prompt" 2>>"$LOG_FILE"); then
        local exit_code=$?
        log "ERROR" "Agente IA falló (Exit code: $exit_code)"
        return 1
    fi

    # Loguear salida cruda para debug
    log "INFO" "Salida bruta de IA:"
    printf '%s\n' "$ai_output" >> "$LOG_FILE"

    # Limpiar posibles fences de markdown (```json ... ```) y texto previo para obtener solo el JSON
    local ai_clean
    ai_clean=$(printf '%s\n' "$ai_output" \
        | sed 's/^[[:space:]]*```[a-zA-Z0-9_-]*[[:space:]]*$//g' \
        | sed -n '/^{/,$p') || ai_clean="$ai_output"

    # Aplicar acciones si la salida es JSON válido
    apply_ai_actions "$ai_clean"

    log "INFO" "=== AGENTE LOGIC CON IA COMPLETADO ==="
}

# Función principal
main() {
    log "INFO" "=== AGENTE LOGIC HORARIO CON IA INICIADO ==="

    if [[ "${1:-}" == "--test" ]]; then
        log "INFO" "MODO PRUEBA ACTIVADO - No se realizarán cambios reales"
        export TEST_MODE=true
    fi

    if ! check_dependencies; then
        log "ERROR" "Dependencias faltantes. Abortando."
        exit 1
    fi

    invoke_ai_agent

    log "INFO" "Ejecución completada exitosamente"
}

# Ejecutar si no se está importando como fuente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
