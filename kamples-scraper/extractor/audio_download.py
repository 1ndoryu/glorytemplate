"""
Descarga de audio desde YouTube via yt-dlp.

NO pasa por proxy — las descargas de YouTube van directo.
Descarga audio en mejor calidad y convierte a WAV temporal.
"""

import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)


def descargar_audio(youtube_id: str, output_dir: str | None = None) -> str | None:
    """
    Descargar audio de YouTube y convertir a WAV.

    Args:
        youtube_id: ID del video de YouTube (ej: '81VrSMrS5F8')
        output_dir: directorio para el archivo temporal (default: tempdir del sistema)

    Returns:
        Ruta al archivo WAV temporal, o None si falla.
    """
    if not youtube_id or len(youtube_id) > 20:
        logger.error("YouTube ID invalido: %s", youtube_id)
        return None

    if output_dir is None:
        output_dir = os.getenv("AUDIO_TMP_DIR", tempfile.gettempdir())

    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"{youtube_id}.wav")

    # Si ya existe (cache local), retornar directamente
    if os.path.exists(output_path):
        logger.debug("Audio ya en cache: %s", output_path)
        return output_path

    url = f"https://www.youtube.com/watch?v={youtube_id}"

    try:
        # yt-dlp: descargar mejor audio y convertir a WAV
        cmd = [
            "yt-dlp",
            "--no-playlist",
            "--extract-audio",
            "--audio-format", "wav",
            "--audio-quality", "0",
            "--output", output_path.replace(".wav", ".%(ext)s"),
            "--quiet",
            "--no-warnings",
            url,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode != 0:
            logger.error("yt-dlp fallo para %s: %s", youtube_id, result.stderr[:500])
            return None

        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            logger.info("Audio descargado: %s (%.1f MB)", youtube_id, size_mb)
            return output_path
        else:
            logger.error("Archivo WAV no encontrado tras descarga: %s", output_path)
            return None

    except subprocess.TimeoutExpired:
        logger.error("Timeout descargando audio: %s", youtube_id)
        return None
    except FileNotFoundError:
        logger.error("yt-dlp no encontrado. Instalar: pip install yt-dlp")
        return None
    except Exception:
        logger.exception("Error inesperado descargando %s", youtube_id)
        return None


def limpiar_audio(path: str) -> None:
    """Eliminar archivo de audio temporal."""
    try:
        if path and os.path.exists(path):
            os.unlink(path)
            logger.debug("Audio temporal eliminado: %s", path)
    except OSError:
        logger.warning("No se pudo eliminar %s", path)
