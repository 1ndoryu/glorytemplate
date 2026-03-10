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
import time

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
    """Obtener elementos pendientes de la cola de extracción (bilateral)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT ce.id, ce.relacion_id, ce.youtube_id, ce.spotify_id, "
                "       ce.timing_inicio_seg, ce.lado, "
                "       rs.tipo_relacion, rs.tipo_elemento, "
                "       rs.cancion_destino_id, rs.cancion_fuente_id, "
                "       c_dest.titulo AS destino_titulo, "
                "       a_dest.nombre AS destino_artista, "
                "       c_fuente.titulo AS fuente_titulo, "
                "       a_fuente.nombre AS fuente_artista, "
                "       rs.votos_total "
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
    Procesar un elemento de la cola: descargar -> analizar -> recortar -> insertar.
    Soporta bilateral (fuente/destino) y Spotify como fuente de audio alternativa.
    """
    cola_id = item["id"]
    youtube_id = item.get("youtube_id")
    spotify_id = item.get("spotify_id")
    timing = item["timing_inicio_seg"]
    lado = item.get("lado", "fuente")

    logger.info(
        "Procesando cola_id=%d lado=%s: %s - %s [timing=%ds] yt=%s spotify=%s",
        cola_id, lado,
        item.get("fuente_artista", ""),
        item.get("fuente_titulo", ""),
        timing,
        youtube_id or "N/A",
        spotify_id or "N/A",
    )

    wav_path = None
    recorte_path = None
    t_total = time.monotonic()

    try:
        # 1. Descargar audio (YouTube prioritario, fallback Spotify)
        actualizar_estado_cola(cola_id, "descargando")
        t0 = time.monotonic()
        wav_path = descargar_audio(youtube_id, output_dir, spotify_id=spotify_id)
        if not wav_path:
            actualizar_estado_cola(cola_id, "error", "Descarga de audio fallida (YT + Spotify)")
            return False
        size_mb = os.path.getsize(wav_path) / (1024 * 1024) if os.path.exists(wav_path) else 0
        logger.info(
            "[cola=%d] Paso 1/6 Descarga: %.1fs, archivo=%s (%.1f MB)",
            cola_id, time.monotonic() - t0, wav_path, size_mb,
        )

        # 2. Analizar BPM
        actualizar_estado_cola(cola_id, "analizando")
        t0 = time.monotonic()
        analisis = analizar_bpm(wav_path)
        logger.info(
            "[cola=%d] Paso 2/6 BPM: %.1fs, bpm=%.0f, confianza=%.2f, beats=%d",
            cola_id, time.monotonic() - t0,
            analisis.bpm if analisis else 0,
            analisis.confianza if analisis else 0,
            len(analisis.beats) if analisis else 0,
        )

        # 3. Calcular recorte
        actualizar_estado_cola(cola_id, "recortando")
        t0 = time.monotonic()
        recorte = calcular_recorte(timing, analisis)
        logger.info(
            "[cola=%d] Paso 3/6 Calculo recorte: %.1fs, inicio=%.2f fin=%.2f dur=%.1fs alineado=%s",
            cola_id, time.monotonic() - t0,
            recorte.inicio, recorte.fin, recorte.duracion, recorte.recorte_por_compas,
        )

        # 4. Ejecutar recorte (MP3 320kbps)
        recorte_path = os.path.join(
            output_dir,
            f"sample_{cola_id}_{lado}_{youtube_id or spotify_id or 'unknown'}.mp3",
        )
        t0 = time.monotonic()
        exito = recortar_audio(wav_path, recorte, recorte_path)
        if not exito:
            actualizar_estado_cola(cola_id, "error", "Recorte de audio fallido")
            return False
        size_kb = os.path.getsize(recorte_path) / 1024 if os.path.exists(recorte_path) else 0
        logger.info(
            "[cola=%d] Paso 4/6 Recorte ffmpeg: %.1fs, salida=%s (%.0f KB)",
            cola_id, time.monotonic() - t0, recorte_path, size_kb,
        )

        # 5. Generar waveform (peaks JSON compatibles con ProcesadorFFmpeg.php)
        t0 = time.monotonic()
        waveform_path = generar_waveform(recorte_path)
        logger.info(
            "[cola=%d] Paso 5/6 Waveform: %.1fs, archivo=%s",
            cola_id, time.monotonic() - t0, waveform_path or "FALLO",
        )

        # 6. Insertar en Kamples (con metadata bilateral)
        metadata_cancion = {
            "fuente_titulo": item.get("fuente_titulo", ""),
            "fuente_artista": item.get("fuente_artista", ""),
            "destino_titulo": item.get("destino_titulo", ""),
            "destino_artista": item.get("destino_artista", ""),
            "tipo_elemento": item.get("tipo_elemento", ""),
            "votos_total": item.get("votos_total", 0),
            "cancion_fuente_id": item.get("cancion_fuente_id"),
            "cancion_destino_id": item.get("cancion_destino_id"),
        }

        t0 = time.monotonic()
        sample_id = insertar_sample(
            relacion_id=item["relacion_id"],
            recorte=recorte,
            wav_path=recorte_path,
            metadata_cancion=metadata_cancion,
            waveform_path=waveform_path,
            lado=lado,
        )

        if sample_id:
            elapsed_total = time.monotonic() - t_total
            logger.info(
                "[cola=%d] Paso 6/6 Insert BD: %.1fs, sample_id=%d",
                cola_id, time.monotonic() - t0, sample_id,
            )
            logger.info(
                "COMPLETADO cola=%d lado=%s sample=%d | total=%.1fs | dur=%.1fs BPM=%.0f alineado=%s",
                cola_id, lado, sample_id, elapsed_total,
                recorte.duracion, recorte.bpm, recorte.recorte_por_compas,
            )
            return True
        else:
            actualizar_estado_cola(cola_id, "error", "Insercion en BD fallida")
            return False

    except Exception as e:
        logger.exception("Error procesando cola_id=%d lado=%s", cola_id, lado)
        actualizar_estado_cola(cola_id, "error", str(e)[:1000])
        return False
    finally:
        # Limpiar archivo descargado completo (no el recortado, ese se guarda)
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
