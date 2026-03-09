"""
Análisis de BPM y detección de beats con librosa.

Detecta: BPM global, posiciones de cada beat, time signature estimada.
Esencial para el recorte alineado a compás.
"""

import logging
from dataclasses import dataclass

import librosa
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class AnalisisBpm:
    """Resultado del análisis de BPM y beats."""
    bpm: float
    beats: list[float]        # timestamps de cada beat en segundos
    duracion_compas: float    # duración de 1 compás en segundos (asumiendo 4/4)
    confianza: float          # 0.0-1.0 confianza en el BPM detectado
    duracion_total: float     # duración total del audio en segundos
    time_signature: int       # beats por compás (4 = 4/4, 3 = 3/4)


def analizar_bpm(wav_path: str) -> AnalisisBpm | None:
    """
    Analizar BPM y detectar beats de un archivo WAV.

    Args:
        wav_path: Ruta al archivo WAV.

    Returns:
        AnalisisBpm con resultados, o None si falla.
    """
    try:
        # Cargar audio (mono, sr nativo)
        y, sr = librosa.load(wav_path, sr=None, mono=True)
        duracion = librosa.get_duration(y=y, sr=sr)

        # Detección de tempo con onset strength
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo_array = librosa.feature.tempo(
            onset_envelope=onset_env, sr=sr, aggregate=None
        )

        # BPM predominante
        bpm = float(np.median(tempo_array))

        # Detección de beats
        tempo_scalar, beat_frames = librosa.beat.beat_track(
            onset_envelope=onset_env, sr=sr, bpm=bpm
        )
        beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()

        # Estimar time signature (3/4 vs 4/4)
        # Heurística: analizar agrupación de acentos en onset envelope
        time_sig = _estimar_time_signature(onset_env, sr, beat_frames)

        # Duración de 1 compás
        duracion_compas = (60.0 / bpm) * time_sig

        # Confianza: basada en varianza del tempo
        if len(tempo_array) > 1:
            varianza = float(np.std(tempo_array))
            confianza = max(0.0, min(1.0, 1.0 - (varianza / bpm)))
        else:
            confianza = 0.5

        resultado = AnalisisBpm(
            bpm=round(bpm, 1),
            beats=beat_times,
            duracion_compas=round(duracion_compas, 3),
            confianza=round(confianza, 2),
            duracion_total=round(duracion, 2),
            time_signature=time_sig,
        )

        logger.info(
            "BPM analisis: %.1f BPM, %d beats, compas=%.3fs, confianza=%.2f, time_sig=%d/4",
            resultado.bpm,
            len(resultado.beats),
            resultado.duracion_compas,
            resultado.confianza,
            resultado.time_signature,
        )

        return resultado

    except Exception:
        logger.exception("Error analizando BPM de %s", wav_path)
        return None


def _estimar_time_signature(onset_env, sr: int, beat_frames) -> int:
    """
    Estimar time signature (3 o 4 beats por compás).
    Heurística: analizar patrón de acentos en onset envelope.
    Default: 4 (4/4 es lo más común en música popular).
    """
    if len(beat_frames) < 12:
        return 4

    try:
        # Extraer amplitudes en cada beat
        amplitudes = onset_env[beat_frames[beat_frames < len(onset_env)]]

        if len(amplitudes) < 12:
            return 4

        # Calcular autocorrelación de amplitudes
        # Si hay patrón fuerte en 3, es 3/4; si en 4, es 4/4
        acorr = np.correlate(amplitudes - np.mean(amplitudes), amplitudes - np.mean(amplitudes), mode="full")
        acorr = acorr[len(acorr) // 2:]

        if len(acorr) > 4:
            strength_3 = abs(acorr[3]) if len(acorr) > 3 else 0
            strength_4 = abs(acorr[4]) if len(acorr) > 4 else 0

            if strength_3 > strength_4 * 1.3:
                return 3

    except Exception:
        pass

    return 4
