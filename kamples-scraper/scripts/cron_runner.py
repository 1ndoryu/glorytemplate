"""
Runner cross-platform para los cron del pipeline de extraccion.

Uso en Windows (Task Scheduler) o Linux (cron):
    python scripts/cron_runner.py daily           -- scraping diario
    python scripts/cron_runner.py extraction       -- extraccion de audio
    python scripts/cron_runner.py extraction --limit 50

Lock file previene ejecuciones concurrentes del mismo tipo.
"""

import argparse
import logging
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [cron_runner] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

PROJECT_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = PROJECT_DIR / "logs"


def adquirir_lock(nombre: str) -> Path | None:
    """
    Intentar adquirir un lock file. Retorna la ruta del lock si se adquirio, None si ya esta tomado.

    Proteccion adicional: si el lock lleva mas de 6 horas, se considera stale y se elimina.
    """
    lock_path = PROJECT_DIR / f".lock_{nombre}"

    if lock_path.exists():
        edad_seg = time.time() - lock_path.stat().st_mtime
        if edad_seg > 6 * 3600:
            logger.warning("Lock stale detectado (%.0fh), eliminando: %s", edad_seg / 3600, lock_path)
            lock_path.unlink()
        else:
            return None

    lock_path.write_text(str(os.getpid()), encoding="utf-8")
    return lock_path


def liberar_lock(lock_path: Path) -> None:
    """Eliminar lock file."""
    try:
        if lock_path.exists():
            lock_path.unlink()
    except OSError:
        logger.exception("Error eliminando lock %s", lock_path)


def ejecutar_daily() -> int:
    """Ejecutar spider de scraping diario."""
    LOGS_DIR.mkdir(exist_ok=True)
    log_file = LOGS_DIR / f"hot_samples_{datetime.now():%Y%m%d}.log"

    cmd = [
        sys.executable, "-m", "scrapy", "crawl", "hot_samples",
        f"--logfile={log_file}",
        "-s", "LOG_LEVEL=INFO",
    ]

    logger.info("Ejecutando: %s", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(PROJECT_DIR), timeout=3600)
    return result.returncode


def ejecutar_extraction(limit: int = 20) -> int:
    """Ejecutar pipeline de extraccion de audio."""
    LOGS_DIR.mkdir(exist_ok=True)

    cmd = [
        sys.executable, "-m", "extractor.pipeline",
        "--limit", str(limit),
    ]

    logger.info("Ejecutando: %s", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(PROJECT_DIR), timeout=7200)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="Cron runner para pipeline Kamples")
    parser.add_argument("tarea", choices=["daily", "extraction"], help="Tipo de tarea")
    parser.add_argument("--limit", type=int, default=20, help="Limite de items (solo extraction)")
    args = parser.parse_args()

    lock = adquirir_lock(args.tarea)
    if lock is None:
        logger.info("Tarea '%s' ya en ejecucion. Abortando.", args.tarea)
        return

    try:
        logger.info("=== Iniciando tarea: %s ===", args.tarea)

        if args.tarea == "daily":
            code = ejecutar_daily()
        else:
            code = ejecutar_extraction(args.limit)

        if code == 0:
            logger.info("=== Tarea '%s' completada OK ===", args.tarea)
        else:
            logger.error("=== Tarea '%s' fallo con codigo %d ===", args.tarea, code)

    except subprocess.TimeoutExpired:
        logger.error("Tarea '%s' excedio tiempo limite", args.tarea)
    except Exception:
        logger.exception("Error inesperado en tarea '%s'", args.tarea)
    finally:
        liberar_lock(lock)


if __name__ == "__main__":
    main()
