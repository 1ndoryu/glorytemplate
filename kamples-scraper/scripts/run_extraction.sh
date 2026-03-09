#!/bin/bash
# Procesar cola de extracción de audio.
# Usar en cron: 0 */4 * * * /path/to/run_extraction.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "[$(date)] Iniciando extraccion de audio..."

python -m extractor.pipeline --limit 20

echo "[$(date)] Extraccion completada."
