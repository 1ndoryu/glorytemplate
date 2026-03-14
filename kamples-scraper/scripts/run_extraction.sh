#!/bin/bash
# Procesar cola de extraccion de audio.
# Usar en cron: 0 */4 * * * /path/to/run_extraction.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOCK_FILE="$PROJECT_DIR/.lock_extraction"
LOG_DIR="$PROJECT_DIR/logs"

cd "$PROJECT_DIR"
mkdir -p "$LOG_DIR"

# Lock para evitar ejecuciones concurrentes
if [ -f "$LOCK_FILE" ]; then
    echo "[$(date)] Extraccion ya en ejecucion (lock: $LOCK_FILE). Abortando."
    exit 0
fi
trap 'rm -f "$LOCK_FILE"' EXIT
echo $$ > "$LOCK_FILE"

echo "[$(date)] Iniciando extraccion de audio..."

# Activar virtualenv si existe
if [ -f "$PROJECT_DIR/.venv/bin/activate" ]; then
    source "$PROJECT_DIR/.venv/bin/activate"
fi

LIMIT=${KAMPLES_BATCH_LIMIT:-100}
python -m extractor.pipeline --limit "$LIMIT"

echo "[$(date)] Extraccion completada."
