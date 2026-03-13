"""
Registra resultado de extraccion en la cola (no inserta en samples).

Flujo unificado: Python extrae audio y marca la cola como extraido.
PHP (DevController::publicarExtracciones) lee los items extraido y los
publica a traves del mismo PipelineAudio que usa el upload web/sync.

Esto garantiza que todos los samples -- subidos, sync o extraidos -- pasan
por el mismo procesamiento: waveform FFmpeg, MP3 optimizado, preview,
hash SHA-256, analisis IA, embedding, deduplicacion.
"""

import json
import logging
import os

from kamples_scraper.utils.db import get_connection
from extractor.sample_cutter import ResultadoRecorte

logger = logging.getLogger(__name__)


def registrar_extraccion(
    cola_id: int,
    relacion_id: int,
    recorte: ResultadoRecorte,
    audio_path: str,
    metadata_cancion: dict,
    lado: str = "fuente",
    ruta_audio_completo: str | None = None,
) -> bool:
    """
    Marca un item de la cola como extraido con la ruta del audio y metadata.
    PHP se encarga de publicar el sample a traves del flujo estandar.
    """
    if not os.path.exists(audio_path):
        logger.error("Audio extraido no encontrado: %s", audio_path)
        return False

    metadata_extraccion = {
        "relacion_id": relacion_id,
        "lado": lado,
        "fuente_titulo": metadata_cancion.get("fuente_titulo", ""),
        "fuente_artista": metadata_cancion.get("fuente_artista", ""),
        "destino_titulo": metadata_cancion.get("destino_titulo", ""),
        "destino_artista": metadata_cancion.get("destino_artista", ""),
        "tipo_elemento": metadata_cancion.get("tipo_elemento", ""),
        "votos_total": metadata_cancion.get("votos_total", 0),
        "cancion_fuente_id": metadata_cancion.get("cancion_fuente_id"),
        "cancion_destino_id": metadata_cancion.get("cancion_destino_id"),
        "bpm_detectado": recorte.bpm,
        "duracion": recorte.duracion,
        "compas_inicio_seg": recorte.inicio,
        "compas_fin_seg": recorte.fin,
        "recorte_por_compas": recorte.recorte_por_compas,
        "duracion_compas": recorte.duracion_compas,
        "tamano_bytes": os.path.getsize(audio_path),
        "formato": "mp3" if audio_path.lower().endswith(".mp3") else "wav",
        "descarga_metodo": metadata_cancion.get("descarga_metodo"),
        "descarga_fuente_url": metadata_cancion.get("descarga_fuente_url"),
        "descarga_fuente_titulo": metadata_cancion.get("descarga_fuente_titulo"),
        "descarga_fuente_artista": metadata_cancion.get("descarga_fuente_artista"),
    }

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE cola_extraccion_samples "
                "SET estado = %s, "
                "    ruta_audio_extraido = %s, "
                "    ruta_audio_completo = %s, "
                "    metadata_extraccion = %s, "
                "    bpm_detectado = %s, "
                "    duracion_compas_seg = %s, "
                "    compas_inicio_seg = %s, "
                "    compas_fin_seg = %s "
                "WHERE id = %s",
                (
                    "extraido",
                    audio_path,
                    ruta_audio_completo,
                    json.dumps(metadata_extraccion),
                    int(recorte.bpm) if recorte.bpm else None,
                    recorte.duracion_compas,
                    recorte.inicio,
                    recorte.fin,
                    cola_id,
                ),
            )
            conn.commit()

            logger.info(
                "Extraccion registrada: cola=%d lado=%s ruta=%s (%.0f KB)",
                cola_id, lado, audio_path,
                os.path.getsize(audio_path) / 1024,
            )
            return True

    except Exception:
        conn.rollback()
        logger.exception("Error registrando extraccion para cola %d", cola_id)
        return False
    finally:
        conn.close()
