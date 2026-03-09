"""
Orquestador del pipeline de extracción de audio.

Flujo completo:
1. Leer cola_extraccion_samples (pendientes)
2. Por cada entrada:
   a. Descargar audio de YouTube (yt-dlp)
   b. Analizar BPM y beats (librosa)
   c. Calcular y ejecutar recorte alineado a compás
   d. Insertar sample en BD Kamples
3. Actualizar estado en la cola

Ejecutar: python -m extractor.pipeline --limit 20
"""

import argparse
import logging
import os
import sys
import tempfile

from kamples_scraper.utils.db import get_connection
from extractor.audio_download import descargar_audio, limpiar_audio
from extractor.bpm_analyzer import analizar_bpm
from extractor.sample_cutter import calcular_recorte, recortar_audio
from extractor.kamples_inserter import insertar_sample
from extractor.waveform_generator import generar_waveform

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


def obtener_pendientes(limit: int = 10) -> list[dict]:
    """Obtener elementos pendientes de la cola de extracción."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT ce.id, ce.relacion_id, ce.youtube_id, ce.timing_inicio_seg, "
                "       rs.tipo_relacion, rs.tipo_elemento, "
                "       c_dest.titulo AS destino_titulo, "
                "       a_dest.nombre AS destino_artista, "
                "       c_fuente.titulo AS fuente_titulo, "
                "       a_fuente.nombre AS fuente_artista "
                "FROM cola_extraccion_samples ce "
                "JOIN relaciones_sample rs ON ce.relacion_id = rs.id "
                "JOIN canciones c_dest ON rs.cancion_destino_id = c_dest.id "
                "JOIN artistas_musicales a_dest ON c_dest.artista_id = a_dest.id "
                "JOIN canciones c_fuente ON rs.cancion_fuente_id = c_fuente.id "
                "JOIN artistas_musicales a_fuente ON c_fuente.artista_id = a_fuente.id "
                "WHERE ce.estado = 'pendiente' AND ce.intentos < 3 "
                "ORDER BY ce.created_at ASC "
                "LIMIT %s",
                (limit,),
            )
            columnas = [desc[0] for desc in cur.description]
            return [dict(zip(columnas, row)) for row in cur.fetchall()]
    finally:
        conn.close()


def actualizar_estado_cola(cola_id: int, estado: str, error: str | None = None) -> None:
    """Actualizar estado de un elemento en la cola."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if error:
                cur.execute(
                    "UPDATE cola_extraccion_samples "
                    "SET estado = %s, error_mensaje = %s, intentos = intentos + 1 "
                    "WHERE id = %s",
                    (estado, error[:1000], cola_id),
                )
            else:
                cur.execute(
                    "UPDATE cola_extraccion_samples SET estado = %s WHERE id = %s",
                    (estado, cola_id),
                )
            conn.commit()
    except Exception:
        conn.rollback()
        logger.exception("Error actualizando cola id=%d", cola_id)
    finally:
        conn.close()


def procesar_elemento(item: dict, output_dir: str) -> bool:
    """
    Procesar un elemento de la cola: descargar → analizar → recortar → insertar.
    """
    cola_id = item["id"]
    youtube_id = item["youtube_id"]
    timing = item["timing_inicio_seg"]

    logger.info(
        "Procesando cola_id=%d: %s - %s [timing=%ds] yt=%s",
        cola_id,
        item.get("fuente_artista", ""),
        item.get("fuente_titulo", ""),
        timing,
        youtube_id,
    )

    wav_path = None
    recorte_path = None

    try:
        # 1. Descargar audio
        actualizar_estado_cola(cola_id, "descargando")
        wav_path = descargar_audio(youtube_id, output_dir)
        if not wav_path:
            actualizar_estado_cola(cola_id, "error", "Descarga de YouTube fallida")
            return False

        # 2. Analizar BPM
        actualizar_estado_cola(cola_id, "analizando")
        analisis = analizar_bpm(wav_path)

        # 3. Calcular recorte
        actualizar_estado_cola(cola_id, "recortando")
        recorte = calcular_recorte(timing, analisis)

        # 4. Ejecutar recorte
        recorte_path = os.path.join(output_dir, f"sample_{cola_id}_{youtube_id}.wav")
        exito = recortar_audio(wav_path, recorte, recorte_path)
        if not exito:
            actualizar_estado_cola(cola_id, "error", "Recorte de audio fallido")
            return False

        # 5. Generar waveform (peaks JSON compatibles con ProcesadorFFmpeg.php)
        waveform_path = generar_waveform(recorte_path)

        # 6. Insertar en Kamples
        metadata_cancion = {
            "fuente_titulo": item.get("fuente_titulo", ""),
            "fuente_artista": item.get("fuente_artista", ""),
            "destino_titulo": item.get("destino_titulo", ""),
            "destino_artista": item.get("destino_artista", ""),
            "tipo_elemento": item.get("tipo_elemento", ""),
        }

        sample_id = insertar_sample(
            relacion_id=item["relacion_id"],
            recorte=recorte,
            wav_path=recorte_path,
            metadata_cancion=metadata_cancion,
            waveform_path=waveform_path,
        )

        if sample_id:
            logger.info(
                "Extraccion completada: cola=%d sample=%d (%.1fs, BPM=%.0f, alineado=%s)",
                cola_id, sample_id, recorte.duracion, recorte.bpm, recorte.recorte_por_compas,
            )
            return True
        else:
            actualizar_estado_cola(cola_id, "error", "Insercion en BD fallida")
            return False

    except Exception as e:
        logger.exception("Error procesando cola_id=%d", cola_id)
        actualizar_estado_cola(cola_id, "error", str(e)[:1000])
        return False
    finally:
        # Limpiar WAV completo (no el recortado, ese se guarda)
        if wav_path and wav_path != recorte_path:
            limpiar_audio(wav_path)


def main():
    parser = argparse.ArgumentParser(description="Pipeline de extraccion de audio Kamples")
    parser.add_argument("--limit", type=int, default=10, help="Maximo de items a procesar")
    parser.add_argument("--output-dir", type=str, default=None, help="Directorio de salida")
    args = parser.parse_args()

    output_dir = args.output_dir or os.getenv("AUDIO_TMP_DIR", tempfile.gettempdir())
    os.makedirs(output_dir, exist_ok=True)

    pendientes = obtener_pendientes(args.limit)
    if not pendientes:
        logger.info("No hay elementos pendientes en la cola de extraccion")
        return

    logger.info("Procesando %d elementos de la cola", len(pendientes))

    exitosos = 0
    fallidos = 0

    for item in pendientes:
        if procesar_elemento(item, output_dir):
            exitosos += 1
        else:
            fallidos += 1

    logger.info(
        "Pipeline completado: %d exitosos, %d fallidos de %d total",
        exitosos, fallidos, len(pendientes),
    )


if __name__ == "__main__":
    main()
