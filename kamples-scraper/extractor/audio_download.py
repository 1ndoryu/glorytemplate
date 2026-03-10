"""
Descarga de audio desde YouTube (yt-dlp) o Spotify (spotdl).

Prioridad: YouTube > Spotify > error.
Descarga audio en mejor calidad y convierte a WAV temporal para análisis BPM.
"""

import logging
import os
import re
import subprocess
import tempfile

logger = logging.getLogger(__name__)

# Patrón de validación para Spotify IDs (alfanumérico, 10-30 chars)
_SPOTIFY_ID_RE = re.compile(r"^[A-Za-z0-9]{10,30}$")


def descargar_audio(
    youtube_id: str | None,
    output_dir: str | None = None,
    spotify_id: str | None = None,
) -> str | None:
    """
    Descargar audio priorizando YouTube, fallback a Spotify.

    Args:
        youtube_id: ID del video de YouTube (ej: '81VrSMrS5F8')
        output_dir: directorio para el archivo temporal (default: tempdir del sistema)
        spotify_id: ID del track de Spotify como fallback

    Returns:
        Ruta al archivo WAV temporal, o None si falla.
    """
    if output_dir is None:
        output_dir = os.getenv("AUDIO_TMP_DIR", tempfile.gettempdir())
    os.makedirs(output_dir, exist_ok=True)

    if youtube_id and len(youtube_id) <= 20:
        resultado = _descargar_youtube(youtube_id, output_dir)
        if resultado:
            return resultado
        logger.warning("YouTube falló para %s, intentando Spotify fallback", youtube_id)

    if spotify_id and _SPOTIFY_ID_RE.match(spotify_id):
        return _descargar_spotify(spotify_id, output_dir)

    logger.error("Sin fuente de audio: youtube_id=%s, spotify_id=%s", youtube_id, spotify_id)
    return None


def _descargar_youtube(youtube_id: str, output_dir: str) -> str | None:
    """Descargar audio de YouTube y convertir a WAV."""
    output_path = os.path.join(output_dir, f"{youtube_id}.wav")

    if os.path.exists(output_path):
        logger.debug("Audio ya en cache: %s", output_path)
        return output_path

    url = f"https://www.youtube.com/watch?v={youtube_id}"

    try:
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
            cmd, capture_output=True, text=True, timeout=300,
        )

        if result.returncode != 0:
            logger.error("yt-dlp falló para %s: %s", youtube_id, result.stderr[:500])
            return None

        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            logger.info("Audio descargado (YouTube): %s (%.1f MB)", youtube_id, size_mb)
            return output_path

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


def _descargar_spotify(spotify_id: str, output_dir: str) -> str | None:
    """Descargar audio desde Spotify via spotdl (busca match en YouTube Music)."""
    output_path = os.path.join(output_dir, f"spotify_{spotify_id}.wav")

    if os.path.exists(output_path):
        logger.debug("Audio Spotify ya en cache: %s", output_path)
        return output_path

    url = f"https://open.spotify.com/track/{spotify_id}"

    try:
        cmd = [
            "spotdl",
            "download", url,
            "--output", output_path.replace(".wav", ""),
            "--format", "wav",
        ]

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120,
        )

        if result.returncode != 0:
            logger.error("spotdl falló para %s: %s", spotify_id, result.stderr[:500])
            return None

        # spotdl puede generar archivos con nombres distintos; buscar el wav descargado
        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            logger.info("Audio descargado (Spotify): %s (%.1f MB)", spotify_id, size_mb)
            return output_path

        # Buscar cualquier wav recién creado en output_dir para este spotify
        for fname in os.listdir(output_dir):
            fpath = os.path.join(output_dir, fname)
            if fname.endswith(".wav") and spotify_id in fname:
                os.rename(fpath, output_path)
                logger.info("Audio Spotify renombrado: %s → %s", fname, output_path)
                return output_path

        logger.error("Archivo WAV no encontrado tras spotdl: %s", spotify_id)
        return None

    except subprocess.TimeoutExpired:
        logger.error("Timeout descargando audio Spotify: %s", spotify_id)
        return None
    except FileNotFoundError:
        logger.error("spotdl no encontrado. Instalar: pip install spotdl")
        return None
    except Exception:
        logger.exception("Error inesperado descargando Spotify %s", spotify_id)
        return None


def limpiar_audio(path: str) -> None:
    """Eliminar archivo de audio temporal."""
    try:
        if path and os.path.exists(path):
            os.unlink(path)
            logger.debug("Audio temporal eliminado: %s", path)
    except OSError:
        logger.warning("No se pudo eliminar %s", path)
