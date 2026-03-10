"""Verificar estado actual de la cola."""
from kamples_scraper.utils.db import get_connection

conn = get_connection()
try:
    cur = conn.cursor()
    cur.execute("SELECT id, relacion_id, lado, estado, intentos, error_mensaje FROM cola_extraccion_samples ORDER BY id")
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    for row in rows:
        print(dict(zip(cols, row)))
    if not rows:
        print("Cola vacia!")
finally:
    conn.close()
