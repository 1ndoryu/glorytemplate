"""
Recorte inteligente de samples alineado a compás.

Lógica:
1. Encontrar el beat más cercano al timing indicado por WhoSampled.
2. Retroceder 1 compás completo (margen de seguridad).
3. Avanzar 8 compases desde el inicio (o límite de 30s).
4. Aplicar fade in/out para evitar clicks.
"""

import logging
import os
import subprocess
from dataclasses import dataclass

from extractor.bpm_analyzer import AnalisisBpm

logger = logging.getLogger(__name__)

# Límites de duración del recorte
MAX_DURACION_SEG = 30.0
MIN_DURACION_SEG = 3.0
COMPASES_RECORTE = 8
COMPASES_MARGEN = 1
FADE_MS = 50


@dataclass
class ResultadoRecorte:
    """Resultado del cálculo de recorte."""
    inicio: float
    fin: float
    duracion: float
    bpm: float
    duracion_compas: float
    beat_referencia: float
    recorte_por_compas: bool   # True si alineado a compás, False si fallback simple


def calcular_recorte(
    timing_fuente_seg: int,
    analisis: AnalisisBpm | None,
) -> ResultadoRecorte:
    """
    Calcular puntos de recorte alineados a compás.

    Args:
        timing_fuente_seg: segundo donde WhoSampled indica que empieza el sample.
        analisis: resultado del análisis de BPM (None = fallback simple).

    Returns:
        ResultadoRecorte con inicio/fin/duracion.
    """
    # Fallback simple si no hay análisis de BPM confiable
    if analisis is None or analisis.confianza < 0.3 or len(analisis.beats) < 8:
        inicio = max(0.0, timing_fuente_seg - 5.0)
        fin = min(
            inicio + 25.0,
            analisis.duracion_total if analisis else inicio + 25.0,
        )
        return ResultadoRecorte(
            inicio=round(inicio, 3),
            fin=round(fin, 3),
            duracion=round(fin - inicio, 3),
            bpm=analisis.bpm if analisis else 0,
            duracion_compas=0,
            beat_referencia=float(timing_fuente_seg),
            recorte_por_compas=False,
        )

    beats = analisis.beats
    dur_compas = analisis.duracion_compas
    time_sig = analisis.time_signature

    # Encontrar beat más cercano al timing indicado
    beat_cercano = min(beats, key=lambda b: abs(b - timing_fuente_seg))
    idx_beat = beats.index(beat_cercano)

    # Encontrar downbeat (primer beat del compás)
    idx_downbeat = idx_beat - (idx_beat % time_sig)
    inicio_compas = beats[idx_downbeat] if idx_downbeat < len(beats) else beat_cercano

    # Retroceder COMPASES_MARGEN compases
    if idx_downbeat >= time_sig * COMPASES_MARGEN:
        inicio_recorte = beats[idx_downbeat - time_sig * COMPASES_MARGEN]
    else:
        inicio_recorte = max(0.0, inicio_compas - dur_compas * COMPASES_MARGEN)

    # Avanzar COMPASES_RECORTE compases
    fin_recorte = inicio_recorte + (dur_compas * COMPASES_RECORTE)

    # Limitar duración
    duracion = fin_recorte - inicio_recorte
    if duracion > MAX_DURACION_SEG:
        fin_recorte = inicio_recorte + MAX_DURACION_SEG
    elif duracion < MIN_DURACION_SEG:
        # Extender 2 compases extra
        fin_recorte = inicio_recorte + (dur_compas * (COMPASES_RECORTE + 2))

    # No exceder duración del audio
    if analisis.duracion_total > 0:
        fin_recorte = min(fin_recorte, analisis.duracion_total)

    return ResultadoRecorte(
        inicio=round(max(0, inicio_recorte), 3),
        fin=round(fin_recorte, 3),
        duracion=round(fin_recorte - inicio_recorte, 3),
        bpm=analisis.bpm,
        duracion_compas=dur_compas,
        beat_referencia=beat_cercano,
        recorte_por_compas=True,
    )


def recortar_audio(
    wav_path: str,
    recorte: ResultadoRecorte,
    output_path: str,
) -> bool:
    """
    Recortar audio WAV usando ffmpeg con fade in/out.

    Args:
        wav_path: ruta al WAV original completo.
        recorte: ResultadoRecorte con inicio/fin.
        output_path: ruta para el WAV recortado.

    Returns:
        True si el recorte fue exitoso.
    """
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        fade_seg = FADE_MS / 1000.0
        duracion = recorte.duracion

        cmd = [
            "ffmpeg",
            "-y",
            "-ss", str(recorte.inicio),
            "-t", str(duracion),
            "-i", wav_path,
            "-af", f"afade=t=in:st=0:d={fade_seg},afade=t=out:st={duracion - fade_seg}:d={fade_seg}",
            "-ar", "44100",
            "-ac", "1",
            output_path,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            logger.error("ffmpeg fallo: %s", result.stderr[:500])
            return False

        if os.path.exists(output_path):
            size_kb = os.path.getsize(output_path) / 1024
            logger.info(
                "Recorte exitoso: %.1fs-%.1fs (%.1fs, %.0f KB)",
                recorte.inicio, recorte.fin, duracion, size_kb,
            )
            return True

        logger.error("Archivo recortado no encontrado: %s", output_path)
        return False

    except subprocess.TimeoutExpired:
        logger.error("Timeout en ffmpeg recortando audio")
        return False
    except FileNotFoundError:
        logger.error("ffmpeg no encontrado. Instalar ffmpeg en el sistema")
        return False
    except Exception:
        logger.exception("Error recortando audio")
        return False
