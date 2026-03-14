"""Reset entradas fallidas de cola_extraccion_samples a pendiente.
No resetea intentos para preservar historial de reintentos."""
from kamples_scraper.utils.db import get_connection

conn = get_connection()
try:
    cur = conn.cursor()
    cur.execute(
        "UPDATE cola_extraccion_samples "
        "SET estado = 'pendiente', error_mensaje = NULL, proximo_intento_at = NULL "
        "WHERE id IN (1, 2)"
    )
    conn.commit()
    print(f"Reseteo OK, filas afectadas: {cur.rowcount}")
finally:
    conn.close()

