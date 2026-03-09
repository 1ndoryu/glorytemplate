#!/bin/bash
# Ejecutar scraping diario de hot-samples/covers/remixes.
# Usar en cron: 0 6 * * * /path/to/run_daily.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "[$(date)] Iniciando scraping diario..."

# Hot samples, covers y remixes
scrapy crawl hot_samples \
    --logfile="logs/hot_samples_$(date +%Y%m%d).log" \
    -s LOG_LEVEL=INFO

echo "[$(date)] Scraping diario completado."
