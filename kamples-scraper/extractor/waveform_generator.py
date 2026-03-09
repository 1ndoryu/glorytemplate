"""
Generador de waveform peaks compatible con ProcesadorFFmpeg.php.

Genera JSON con formato: {"peaks": [0.0-1.0, ...], "barras": 120}
idéntico al que ProcesadorFFmpeg::generarWaveformPeaks() genera en PHP.

Usa librosa (ya disponible en el pipeline) para leer el audio,
evitando la dependencia de FFmpeg para este paso.
"""

import json
import logging
import os

import numpy as np

logger = logging.getLogger(__name__)

WAVEFORM_BARRAS = 120


def generar_waveform(wav_path: str, output_path: str | None = None) -> str | None:
    """
    Generar JSON de peaks para waveform a partir de un archivo WAV.

    Args:
        wav_path: ruta al archivo WAV (recortado).
        output_path: ruta de salida para el JSON. Si None, usa wav_path + '.json'.

    Returns:
        Ruta al JSON generado, o None si falla.
    """
    if not os.path.exists(wav_path):
        logger.error("Archivo WAV no encontrado: %s", wav_path)
        return None

    if output_path is None:
        output_path = os.path.splitext(wav_path)[0] + "_waveform.json"

    try:
        import librosa

        # Cargar audio mono, sr=8000 (mismo que ProcesadorFFmpeg)
        audio, _ = librosa.load(wav_path, sr=8000, mono=True)
        total_muestras = len(audio)

        if total_muestras < WAVEFORM_BARRAS:
            logger.warning("Audio demasiado corto (%d muestras), peaks parciales", total_muestras)

        muestras_por_barra = max(1, total_muestras // WAVEFORM_BARRAS)
        peaks = []

        for i in range(WAVEFORM_BARRAS):
            inicio = i * muestras_por_barra
            if inicio >= total_muestras:
                break

            fin = min(inicio + muestras_por_barra, total_muestras)
            segmento = np.abs(audio[inicio:fin])
            peak = float(np.max(segmento))
            peaks.append(round(peak, 4))

        datos = {"peaks": peaks, "barras": len(peaks)}
        json_str = json.dumps(datos)

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(json_str)

        logger.info("Waveform generado: %s (%d peaks)", output_path, len(peaks))
        return output_path

    except Exception:
        logger.exception("Error generando waveform para %s", wav_path)
        return None
