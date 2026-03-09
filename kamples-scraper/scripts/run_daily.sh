#!/bin/bash
# Ejecutar scraping diario de hot-samples/covers/remixes.
# Usar en cron: 0 6 * * * /path/to/run_daily.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOCK_FILE="$PROJECT_DIR/.lock_daily"
LOG_DIR="$PROJECT_DIR/logs"

cd "$PROJECT_DIR"
mkdir -p "$LOG_DIR"

# Lock para evitar ejecuciones concurrentes
if [ -f "$LOCK_FILE" ]; then
    echo "[$(date)] Scraping diario ya en ejecucion (lock: $LOCK_FILE). Abortando."
    exit 0
fi
trap 'rm -f "$LOCK_FILE"' EXIT
echo $$ > "$LOCK_FILE"

echo "[$(date)] Iniciando scraping diario..."

# Activar virtualenv si existe
if [ -f "$PROJECT_DIR/.venv/bin/activate" ]; then
    source "$PROJECT_DIR/.venv/bin/activate"
fi

scrapy crawl hot_samples \
    --logfile="$LOG_DIR/hot_samples_$(date +%Y%m%d).log" \
    -s LOG_LEVEL=INFO

echo "[$(date)] Scraping diario completado."
