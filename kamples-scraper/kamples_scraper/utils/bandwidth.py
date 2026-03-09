"""
Tracking de consumo de ancho de banda del proxy.

Registra bytes descargados y consulta el total acumulado.
"""

import logging
from kamples_scraper.utils.db import get_connection

logger = logging.getLogger(__name__)


def total_bytes_consumidos() -> int:
    """Total de bytes consumidos registrados en scraping_log."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COALESCE(SUM(bytes_descargados), 0) FROM scraping_log"
            )
            row = cur.fetchone()
            return int(row[0]) if row else 0
    finally:
        conn.close()


def presupuesto_restante_mb(budget_bytes: int) -> float:
    """Megabytes restantes del presupuesto de proxy."""
    usado = total_bytes_consumidos()
    restante = max(0, budget_bytes - usado)
    return restante / (1024 * 1024)


def log_estadisticas(budget_bytes: int) -> None:
    """Loguear estadísticas de bandwidth."""
    usado = total_bytes_consumidos()
    pct = (usado / budget_bytes * 100) if budget_bytes > 0 else 0
    restante_mb = max(0, budget_bytes - usado) / (1024 * 1024)

    logger.info(
        "Bandwidth: %.2f MB usado (%.1f%%), %.2f MB restante",
        usado / (1024 * 1024),
        pct,
        restante_mb,
    )
