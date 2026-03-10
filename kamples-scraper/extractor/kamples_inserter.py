"""
Insertar sample extraído en la BD de Kamples.

Crea el registro en la tabla `samples` con metadata enriquecida
y vincula con la relación original en `relaciones_sample`.
Soporta inserción bilateral: vincula al lado correcto (fuente/destino).
"""

import json
import logging
import os

from kamples_scraper.utils.db import get_connection
from extractor.sample_cutter import ResultadoRecorte

logger = logging.getLogger(__name__)

# Estado inicial de los samples extraídos (ver plan: 'activo' en local, 'en_supervision' en prod)
ESTADO_INICIAL = os.getenv("SAMPLE_ESTADO_INICIAL", "activo")


def insertar_sample(
    relacion_id: int,
    recorte: ResultadoRecorte,
    wav_path: str,
    metadata_cancion: dict,
    waveform_path: str | None = None,
    lado: str = "fuente",
) -> int | None:
    """
    Insertar sample extraído en tabla `samples` y vincular con la relación.

    Args:
        relacion_id: ID de la relación en relaciones_sample.
        recorte: ResultadoRecorte del corte.
        wav_path: ruta al archivo de audio recortado (WAV o MP3).
        metadata_cancion: dict con info de canción fuente/destino.
        waveform_path: ruta al JSON de peaks waveform (opcional).
        lado: 'fuente' o 'destino' — indica qué FK actualizar en la relación.

    Returns:
        ID del sample creado, o None si falla.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            sample_metadata = {
                "fuente_extraccion": "extraccion_cancion",
                "relacion_id": relacion_id,
                "lado": lado,
                "cancion_fuente": metadata_cancion.get("fuente_titulo", ""),
                "artista_fuente": metadata_cancion.get("fuente_artista", ""),
                "cancion_destino": metadata_cancion.get("destino_titulo", ""),
                "artista_destino": metadata_cancion.get("destino_artista", ""),
                "tipo_elemento": metadata_cancion.get("tipo_elemento", ""),
                "bpm_detectado": recorte.bpm,
                "compas_inicio_seg": recorte.inicio,
                "compas_fin_seg": recorte.fin,
                "recorte_por_compas": recorte.recorte_por_compas,
            }

            titulo = _generar_titulo(metadata_cancion, lado)
            descripcion = _generar_descripcion(metadata_cancion, recorte, lado)
            tags = _generar_tags(metadata_cancion, recorte, lado)
            tipo = "loop" if recorte.duracion > 4.0 else "oneshot"
            tamano = os.path.getsize(wav_path) if os.path.exists(wav_path) else 0
            formato = "mp3" if wav_path.lower().endswith(".mp3") else "wav"

            # Determinar cancion_origen_id según el lado
            cancion_origen_id = metadata_cancion.get(
                "cancion_fuente_id" if lado == "fuente" else "cancion_destino_id"
            )

            cur.execute(
                "INSERT INTO samples "
                "(creador_id, titulo, slug, descripcion, bpm, duracion, formato, tamano, "
                "metadata, tags, estado, tipo, licencia_libre, permitir_descarga, "
                "ruta_original, ruta_waveform, verificado, mostrar_en_comunidad, cancion_origen_id) "
                "VALUES (0, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, false, true, %s, %s, false, true, %s) "
                "RETURNING id",
                (
                    titulo[:200],
                    _generar_slug_sample(metadata_cancion, lado)[:250],
                    descripcion[:500],
                    int(recorte.bpm) if recorte.bpm else None,
                    recorte.duracion,
                    formato,
                    tamano,
                    json.dumps(sample_metadata),
                    tags,
                    ESTADO_INICIAL,
                    tipo,
                    wav_path,
                    waveform_path,
                    cancion_origen_id,
                ),
            )

            row = cur.fetchone()
            if not row:
                conn.rollback()
                return None

            sample_id = row[0]

            # Vincular sample al lado correcto de la relación
            if lado == "fuente":
                cur.execute(
                    "UPDATE relaciones_sample SET sample_fuente_id = %s WHERE id = %s",
                    (sample_id, relacion_id),
                )
            else:
                cur.execute(
                    "UPDATE relaciones_sample SET sample_destino_id = %s WHERE id = %s",
                    (sample_id, relacion_id),
                )

            # Compatibilidad: también actualizar sample_id legacy (fuente tiene prioridad)
            if lado == "fuente":
                cur.execute(
                    "UPDATE relaciones_sample SET sample_id = %s WHERE id = %s AND sample_id IS NULL",
                    (sample_id, relacion_id),
                )

            # Actualizar cola de extracción (ahora filtramos por lado también)
            cur.execute(
                "UPDATE cola_extraccion_samples "
                "SET estado = 'completado', sample_id = %s, "
                "bpm_detectado = %s, duracion_compas_seg = %s, "
                "compas_inicio_seg = %s, compas_fin_seg = %s, "
                "procesado_at = NOW() "
                "WHERE relacion_id = %s AND lado = %s",
                (
                    sample_id,
                    int(recorte.bpm) if recorte.bpm else None,
                    recorte.duracion_compas,
                    recorte.inicio,
                    recorte.fin,
                    relacion_id,
                    lado,
                ),
            )

            conn.commit()

            logger.info(
                "Sample insertado: id=%d, relacion=%d, lado=%s, duracion=%.1fs, bpm=%.0f",
                sample_id, relacion_id, lado, recorte.duracion, recorte.bpm,
            )

            return sample_id

    except Exception:
        conn.rollback()
        logger.exception("Error insertando sample para relacion %d lado %s", relacion_id, lado)
        return None
    finally:
        conn.close()


def _generar_titulo(metadata: dict, lado: str) -> str:
    """Generar título del sample según el lado de la relación."""
    tipo_elem = metadata.get("tipo_elemento", "sample")
    if lado == "fuente":
        return (
            f"{metadata.get('fuente_artista', '')} - "
            f"{metadata.get('fuente_titulo', '')} "
            f"[Sample: {tipo_elem}]"
        )
    return (
        f"{metadata.get('destino_artista', '')} - "
        f"{metadata.get('destino_titulo', '')} "
        f"[Samples: {tipo_elem} from {metadata.get('fuente_artista', '')}]"
    )


def _generar_descripcion(metadata: dict, recorte: ResultadoRecorte, lado: str) -> str:
    """Generar descripción automática desde metadata de la relación."""
    fuente = metadata.get("fuente_titulo", "")
    fuente_art = metadata.get("fuente_artista", "")
    destino = metadata.get("destino_titulo", "")
    destino_art = metadata.get("destino_artista", "")
    tipo_elem = metadata.get("tipo_elemento", "sample")
    votos = metadata.get("votos_total", 0)

    if lado == "fuente":
        base = f"Sample extraído de '{fuente}' de {fuente_art}."
        ref = f"Usado en '{destino}' de {destino_art}."
    else:
        base = f"Fragmento de '{destino}' de {destino_art} que samplea a {fuente_art}."
        ref = f"Referencia a '{fuente}' de {fuente_art}."

    stats = f"Tipo: {tipo_elem}."
    if recorte.bpm and recorte.bpm > 0:
        stats += f" BPM: {int(recorte.bpm)}."
    stats += f" Duración: {recorte.duracion:.1f}s."
    if votos:
        stats += f" {votos} votos en WhoSampled."

    return f"{base} {ref} {stats}"


def _generar_tags(metadata: dict, recorte: ResultadoRecorte, lado: str) -> list[str]:
    """Generar tags automáticos desde metadata del sample."""
    tags = []

    tipo_elem = metadata.get("tipo_elemento", "")
    if tipo_elem:
        tags.append(tipo_elem.replace("_", " "))

    if metadata.get("fuente_artista"):
        tags.append(metadata["fuente_artista"])

    if lado == "destino" and metadata.get("destino_artista"):
        tags.append(metadata["destino_artista"])

    if recorte.bpm and recorte.bpm > 0:
        bpm_range = f"{int(recorte.bpm // 10 * 10)}-{int(recorte.bpm // 10 * 10 + 9)} bpm"
        tags.append(bpm_range)

    tags.append("extracted")
    tags.append("whosampled")
    tags.append("original" if lado == "fuente" else "interpolation")

    return tags


def _generar_slug_sample(metadata: dict, lado: str) -> str:
    """Generar slug único para el sample."""
    import re

    if lado == "fuente":
        text = (
            f"{metadata.get('fuente_artista', '')}-"
            f"{metadata.get('fuente_titulo', '')}-"
            f"sample-{metadata.get('tipo_elemento', 'sample')}"
        )
    else:
        text = (
            f"{metadata.get('destino_artista', '')}-"
            f"{metadata.get('destino_titulo', '')}-"
            f"samples-{metadata.get('tipo_elemento', 'sample')}-"
            f"from-{metadata.get('fuente_artista', '')}"
        )

    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")[:250]
