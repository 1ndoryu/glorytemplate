"""Ejecutar pipeline y capturar log completo."""
import logging
import sys

# Forzar todo logging a archivo antes de importar nada
log_path = "logs/pipeline_run.log"
for h in logging.root.handlers[:]:
    logging.root.removeHandler(h)

handler = logging.FileHandler(log_path, encoding="utf-8", mode="w")
handler.setFormatter(logging.Formatter("%(asctime)s [%(name)s] %(levelname)s: %(message)s"))
handler.setLevel(logging.INFO)
logging.root.addHandler(handler)
logging.root.setLevel(logging.INFO)

# Silenciar librerias de terceros escandalosas (Numba escupe MBs de bytecode en DEBUG)
logging.getLogger('numba').setLevel(logging.WARNING)

# Importar pipeline despues de configurar logging
sys.argv = ["pipeline", "--limit", "2"]
from extractor.pipeline import main
main()

print(f"Log escrito en: {log_path}")
