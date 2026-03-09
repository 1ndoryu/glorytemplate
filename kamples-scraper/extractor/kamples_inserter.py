"""
Insertar sample extraído en la BD de Kamples.

Crea el registro en la tabla `samples` con metadata enriquecida
y vincula con la relación original en `relaciones_sample`.
"""

import json
import logging
import os

from kamples_scraper.utils.db import get_connection
from extractor.sample_cutter import ResultadoRecorte

logger = logging.getLogger(__name__)


def insertar_sample(
    relacion_id: int,
    recorte: ResultadoRecorte,
    wav_path: str,
    metadata_cancion: dict,
    waveform_path: str | None = None,
) -> int | None:
    """
    Insertar sample extraído en tabla `samples` e vincular con la relación.

    Args:
        relacion_id: ID de la relación en relaciones_sample.
        recorte: ResultadoRecorte del corte.
        wav_path: ruta al archivo WAV recortado.
        metadata_cancion: dict con info de canción fuente/destino.
        waveform_path: ruta al JSON de peaks waveform (opcional).

    Returns:
        ID del sample creado, o None si falla.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Metadata enriquecida para el campo JSONB
            sample_metadata = {
                "fuente": "extraccion_cancion",
                "relacion_id": relacion_id,
                "cancion_fuente": metadata_cancion.get("fuente_titulo", ""),
                "artista_fuente": metadata_cancion.get("fuente_artista", ""),
                "cancion_destino": metadata_cancion.get("destino_titulo", ""),
                "artista_destino": metadata_cancion.get("destino_artista", ""),
                "tipo_elemento": metadata_cancion.get("tipo_elemento", ""),
                "bpm_detectado": recorte.bpm,
                "compas_inicio_seg": recorte.inicio,
                "compas_fin_seg": recorte.fin,
                "recorte_por_compas": recorte.recorte_por_compas,
                "estado_recorte": "pendiente_revision",
            }

            titulo = (
                f"{metadata_cancion.get('fuente_artista', '')} - "
                f"{metadata_cancion.get('fuente_titulo', '')} "
                f"[Sample: {metadata_cancion.get('tipo_elemento', 'sample')}]"
            )

            # Generar tags desde metadata
            tags = _generar_tags(metadata_cancion, recorte)

            # Determinar tipo (loop vs oneshot) por duración
            tipo = "loop" if recorte.duracion > 4.0 else "oneshot"

            # Tamaño del archivo
            tamano = os.path.getsize(wav_path) if os.path.exists(wav_path) else 0

            # Insertar en samples (creador_id = 0 = sistema bot)
            cur.execute(
                "INSERT INTO samples "
                "(creador_id, titulo, slug, bpm, duracion, formato, tamano, "
                "metadata, tags, estado, tipo, licencia_libre, permitir_descarga, "
                "ruta_original, ruta_waveform, verificado, mostrar_en_comunidad) "
                "VALUES (0, %s, %s, %s, %s, 'wav', %s, %s, %s, "
                "'en_supervision', %s, false, true, %s, %s, false, true) "
                "RETURNING id",
                (
                    titulo[:200],
                    _generar_slug_sample(metadata_cancion)[:250],
                    int(recorte.bpm) if recorte.bpm else None,
                    recorte.duracion,
                    tamano,
                    json.dumps(sample_metadata),
                    tags,
                    tipo,
                    wav_path,
                    waveform_path,
                ),
            )

            row = cur.fetchone()
            if not row:
                conn.rollback()
                return None

            sample_id = row[0]

            # Vincular sample con la relación
            cur.execute(
                "UPDATE relaciones_sample SET sample_id = %s WHERE id = %s",
                (sample_id, relacion_id),
            )

            # Actualizar cola de extracción
            cur.execute(
                "UPDATE cola_extraccion_samples "
                "SET estado = 'completado', sample_id = %s, "
                "bpm_detectado = %s, duracion_compas_seg = %s, "
                "compas_inicio_seg = %s, compas_fin_seg = %s, "
                "procesado_at = NOW() "
                "WHERE relacion_id = %s",
                (
                    sample_id,
                    int(recorte.bpm) if recorte.bpm else None,
                    recorte.duracion_compas,
                    recorte.inicio,
                    recorte.fin,
                    relacion_id,
                ),
            )

            conn.commit()

            logger.info(
                "Sample insertado: id=%d, relacion=%d, duracion=%.1fs, bpm=%.0f",
                sample_id, relacion_id, recorte.duracion, recorte.bpm,
            )

            return sample_id

    except Exception:
        conn.rollback()
        logger.exception("Error insertando sample para relacion %d", relacion_id)
        return None
    finally:
        conn.close()


def _generar_tags(metadata: dict, recorte: ResultadoRecorte) -> list[str]:
    """Generar tags automáticos desde metadata del sample."""
    tags = []

    tipo_elem = metadata.get("tipo_elemento", "")
    if tipo_elem:
        tags.append(tipo_elem.replace("_", " "))

    if metadata.get("fuente_artista"):
        tags.append(metadata["fuente_artista"])

    if recorte.bpm and recorte.bpm > 0:
        # Rango de BPM
        bpm_range = f"{int(recorte.bpm // 10 * 10)}-{int(recorte.bpm // 10 * 10 + 9)} bpm"
        tags.append(bpm_range)

    tags.append("extracted")
    tags.append("whosampled")

    return tags


def _generar_slug_sample(metadata: dict) -> str:
    """Generar slug único para el sample."""
    import re
    from urllib.parse import unquote

    text = (
        f"{metadata.get('fuente_artista', '')}-"
        f"{metadata.get('fuente_titulo', '')}-"
        f"sample-{metadata.get('tipo_elemento', 'sample')}"
    )
    text = unquote(text).lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")[:250]
