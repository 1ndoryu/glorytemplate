"""
Runner cross-platform para los cron del pipeline de extraccion.

Uso en Windows (Task Scheduler) o Linux (cron):
    python scripts/cron_runner.py daily           -- scraping diario
    python scripts/cron_runner.py extraction       -- extraccion de audio
    python scripts/cron_runner.py extraction --limit 50

Lock file previene ejecuciones concurrentes del mismo tipo.

[223A-3] Soporte para batch reporting via KAMPLES_BATCH_ID env var.
"""

import argparse
import json
import logging
import os
import subprocess
import sys
import time
import urllib.request
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


def ejecutar_extraction(limit: int = int(os.environ.get('KAMPLES_BATCH_LIMIT', '100'))) -> int:
    """Ejecutar pipeline de extraccion de audio."""
    LOGS_DIR.mkdir(exist_ok=True)

    cmd = [
        sys.executable, "-m", "extractor.pipeline",
        "--limit", str(limit),
    ]

    logger.info("Ejecutando: %s", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(PROJECT_DIR), timeout=7200)
    return result.returncode


def contar_stats_scraper(desde: datetime) -> dict:
    """
    [223A-3] Cuenta items insertados por el scraper desde una fecha.
    Consulta directamente PostgreSQL para obtener stats del lote.
    """
    try:
        sys.path.insert(0, str(PROJECT_DIR))
        from kamples_scraper.utils.db import get_connection
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) FROM canciones WHERE created_at >= %s",
                    (desde,),
                )
                canciones = cur.fetchone()[0]

                cur.execute(
                    "SELECT COUNT(*) FROM relaciones_sample WHERE created_at >= %s",
                    (desde,),
                )
                sampleos = cur.fetchone()[0]

                return {
                    "canciones_nuevas": canciones,
                    "sampleos_nuevos": sampleos,
                    "exitosos": canciones + sampleos,
                    "fallidos": 0,
                }
        finally:
            conn.close()
    except Exception:
        logger.exception("Error contando stats del scraper")
        return {"canciones_nuevas": 0, "sampleos_nuevos": 0, "exitosos": 0, "fallidos": 0}


def reportar_lote_scraper(stats: dict) -> None:
    """
    [223A-3] Reporta resultados del lote scraper al endpoint PHP.
    Solo reporta si hay KAMPLES_BATCH_ID en env (lote automatico).
    """
    batch_id = os.environ.get("KAMPLES_BATCH_ID", "").strip()
    if not batch_id:
        return

    site_url = (
        os.environ.get("KAMPLES_INTERNAL_URL", "").rstrip("/")
        or os.environ.get("KAMPLES_SITE_URL", "").rstrip("/")
    )
    secret = os.environ.get("KAMPLES_CRON_SECRET", "")

    if not site_url or not secret:
        logger.warning("No se puede reportar lote scraper — URL/secret no configurados")
        return

    payload = json.dumps({
        "batch_id": int(batch_id),
        "exitosos": stats.get("exitosos", 0),
        "fallidos": stats.get("fallidos", 0),
        "canciones_nuevas": stats.get("canciones_nuevas", 0),
        "sampleos_nuevos": stats.get("sampleos_nuevos", 0),
    }).encode("utf-8")

    endpoint = f"{site_url}/wp-json/kamples/v1/admin/automatizacion/reporte-lote"
    try:
        req = urllib.request.Request(endpoint, method="POST", data=payload)
        req.add_header("Content-Type", "application/json")
        req.add_header("X-Kamples-Secret", secret)
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            logger.info("Reporte lote scraper [HTTP %s]: %s", resp.status, body[:200])
    except Exception as e:
        logger.warning("No se pudo reportar lote scraper batch_id=%s: %s", batch_id, e)


def main():
    parser = argparse.ArgumentParser(description="Cron runner para pipeline Kamples")
    parser.add_argument("tarea", choices=["daily", "extraction"], help="Tipo de tarea")
    parser.add_argument("--limit", type=int, default=int(os.environ.get('KAMPLES_BATCH_LIMIT', '100')), help="Limite de items (solo extraction)")
    args = parser.parse_args()

    lock = adquirir_lock(args.tarea)
    if lock is None:
        logger.info("Tarea '%s' ya en ejecucion. Abortando.", args.tarea)
        return

    try:
        logger.info("=== Iniciando tarea: %s ===", args.tarea)

        if args.tarea == "daily":
            inicio_lote = datetime.utcnow()
            code = ejecutar_daily()
            # [223A-3] Reportar stats del scraper al finalizar
            stats = contar_stats_scraper(inicio_lote)
            if code != 0:
                stats["fallidos"] = max(stats["fallidos"], 1)
            reportar_lote_scraper(stats)
        else:
            code = ejecutar_extraction(args.limit)
            # Extraction reports its own batch via pipeline.py

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
