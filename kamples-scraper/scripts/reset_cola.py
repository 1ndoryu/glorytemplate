"""Reset entradas fallidas de cola_extraccion_samples a pendiente."""
from kamples_scraper.utils.db import get_connection

conn = get_connection()
try:
    cur = conn.cursor()
    cur.execute(
        "UPDATE cola_extraccion_samples "
        "SET estado = 'pendiente', error_mensaje = NULL, intentos = 0 "
        "WHERE id IN (1, 2)"
    )
    conn.commit()
    print(f"Reseteo OK, filas afectadas: {cur.rowcount}")
finally:
    conn.close()

