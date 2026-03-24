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
    stats_file = PROJECT_DIR / ".last_spider_stats.json"

    # [243A-1] Limpiar stats anteriores para no confundir con un run viejo
    if stats_file.exists():
        try:
            stats_file.unlink()
        except OSError:
            pass

    # [243A-1] El spider escribe telemetría (entries found/skipped/new) aquí
    env = os.environ.copy()
    env['SCRAPY_STATS_FILE'] = str(stats_file)

    cmd = [
        sys.executable, "-m", "scrapy", "crawl", "hot_samples",
        f"--logfile={log_file}",
        "-s", "LOG_LEVEL=INFO",
    ]

    logger.info("Ejecutando: %s", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(PROJECT_DIR), timeout=3600, env=env)
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
    [243A-1] Lee también stats del spider (entries found/skipped/new)
    para detectar runs idle (todo deduplicado) y reportar fallidos reales
    en vez de hardcodear 0.
    """
    fallidos = 0
    canciones = 0
    sampleos = 0

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
        finally:
            conn.close()
    except Exception:
        logger.exception("Error contando stats del scraper")

    # [243A-1] Leer telemetría del spider para detectar runs idle
    spider_stats = _leer_spider_stats()
    entries_total = spider_stats.get('entries_total', 0)
    entries_new = spider_stats.get('entries_new', 0)
    entries_skipped = spider_stats.get('entries_skipped', 0)

    exitosos = canciones + sampleos

    if exitosos == 0:
        if entries_total > 0 and entries_new == 0:
            # Todo dedup’d — run idle, contar como fallo para auto-stop
            fallidos = 1
            logger.info(
                "Run idle: %d entries revisados, todos ya procesados",
                entries_total,
            )
        elif entries_total == 0:
            # Spider no encontró entries — posible cambio de selectores o bloqueo
            fallidos = 1
            logger.warning(
                "Spider no encontró ningún entry en las páginas de listas"
            )

    return {
        "canciones_nuevas": canciones,
        "sampleos_nuevos": sampleos,
        "exitosos": exitosos,
        "fallidos": fallidos,
        "entries_total": entries_total,
        "entries_skipped": entries_skipped,
        "entries_new": entries_new,
    }


def _leer_spider_stats() -> dict:
    """[243A-1] Lee el JSON de telemetría escrito por el spider."""
    stats_file = PROJECT_DIR / ".last_spider_stats.json"
    if not stats_file.exists():
        return {}
    try:
        return json.loads(stats_file.read_text(encoding='utf-8'))
    except (json.JSONDecodeError, OSError):
        logger.exception("Error leyendo spider stats de %s", stats_file)
        return {}


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
