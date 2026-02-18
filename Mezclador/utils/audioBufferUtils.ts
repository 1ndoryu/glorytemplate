/*
 * audioBufferUtils — Utilidades para AudioBuffer
 * Decodificación, extracción de peaks, encoding WAV
 */

/* Decodificar un ArrayBuffer de audio en un AudioBuffer */
export const decodificarAudio = async (
    contexto: AudioContext | OfflineAudioContext,
    arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> => {
    return contexto.decodeAudioData(arrayBuffer);
};

/*
 * Extraer peaks de un AudioBuffer para mini waveform.
 * C273: Precisión mejorada — usa rango exacto de muestras para cada peak,
 * evitando pérdida de muestras por truncamiento. Soporta offset y duración
 * para generar peaks solo del rango visible (recorteInicio → recorteFin).
 */
export const extraerPeaks = (
    buffer: AudioBuffer,
    numeroPeaks: number,
    offsetSegundos = 0,
    duracionSegundos?: number
): number[] => {
    const datos = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const inicioMuestra = Math.round(offsetSegundos * sampleRate);
    const finMuestra = duracionSegundos !== undefined
        ? Math.min(datos.length, Math.round((offsetSegundos + duracionSegundos) * sampleRate))
        : datos.length;

    const totalMuestras = finMuestra - inicioMuestra;
    if (totalMuestras <= 0 || numeroPeaks <= 0) return [];

    const peaks: number[] = [];

    for (let i = 0; i < numeroPeaks; i++) {
        /* Rango exacto proporcional para cada peak — sin pérdida por Math.floor */
        const inicio = inicioMuestra + Math.round((i / numeroPeaks) * totalMuestras);
        const fin = inicioMuestra + Math.round(((i + 1) / numeroPeaks) * totalMuestras);

        let max = 0;
        for (let j = inicio; j < fin; j++) {
            const abs = Math.abs(datos[j]);
            if (abs > max) max = abs;
        }
        peaks.push(max);
    }

    return peaks;
};

/* Codificar un AudioBuffer a WAV (PCM 16-bit, 44.1kHz) */
export const codificarWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numCanales = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const tamanoData = buffer.length * numCanales * bytesPerSample;
    const tamanoArchivo = 44 + tamanoData;

    const arrayBuffer = new ArrayBuffer(tamanoArchivo);
    const vista = new DataView(arrayBuffer);

    /* Header RIFF */
    escribirString(vista, 0, 'RIFF');
    vista.setUint32(4, tamanoArchivo - 8, true);
    escribirString(vista, 8, 'WAVE');

    /* Sub-chunk fmt */
    escribirString(vista, 12, 'fmt ');
    vista.setUint32(16, 16, true);
    vista.setUint16(20, 1, true);
    vista.setUint16(22, numCanales, true);
    vista.setUint32(24, sampleRate, true);
    vista.setUint32(28, sampleRate * numCanales * bytesPerSample, true);
    vista.setUint16(32, numCanales * bytesPerSample, true);
    vista.setUint16(34, bitsPerSample, true);

    /* Sub-chunk data */
    escribirString(vista, 36, 'data');
    vista.setUint32(40, tamanoData, true);

    /* Intercalar canales y escribir samples */
    const canales: Float32Array[] = [];
    for (let c = 0; c < numCanales; c++) {
        canales.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let c = 0; c < numCanales; c++) {
            const sample = Math.max(-1, Math.min(1, canales[c][i]));
            const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            vista.setInt16(offset, int16, true);
            offset += 2;
        }
    }

    return arrayBuffer;
};

/* Escribir string ASCII en DataView */
const escribirString = (vista: DataView, offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) {
        vista.setUint8(offset + i, str.charCodeAt(i));
    }
};

/* Crear un ID único para bloques */
export const generarIdBloque = (): string => {
    return `bloque_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

/* Crear un ID único para pistas */
export const generarIdPista = (): string => {
    return `pista_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

/*
 * C215: Invertir un AudioBuffer (reproducción inversa).
 * Crea un buffer nuevo con las muestras en orden inverso.
 */
export const invertirBuffer = (
    contexto: AudioContext | OfflineAudioContext,
    buffer: AudioBuffer
): AudioBuffer => {
    const nuevoBuffer = contexto.createBuffer(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
    );

    for (let canal = 0; canal < buffer.numberOfChannels; canal++) {
        const datosOrigen = buffer.getChannelData(canal);
        const datosDestino = nuevoBuffer.getChannelData(canal);
        for (let i = 0; i < datosOrigen.length; i++) {
            datosDestino[i] = datosOrigen[datosOrigen.length - 1 - i];
        }
    }

    return nuevoBuffer;
};

/*
 * C215: Normalizar un AudioBuffer (escalar a pico 1.0).
 * Crea un buffer nuevo con las muestras normalizadas.
 */
export const normalizarBuffer = (
    contexto: AudioContext | OfflineAudioContext,
    buffer: AudioBuffer
): AudioBuffer => {
    /* Encontrar el pico máximo en todos los canales */
    let picoMax = 0;
    for (let canal = 0; canal < buffer.numberOfChannels; canal++) {
        const datos = buffer.getChannelData(canal);
        for (let i = 0; i < datos.length; i++) {
            const abs = Math.abs(datos[i]);
            if (abs > picoMax) picoMax = abs;
        }
    }

    /* Si ya está normalizado o es silencio, devolver copia sin cambios */
    if (picoMax <= 0 || picoMax >= 0.999) {
        return buffer;
    }

    const factor = 1.0 / picoMax;
    const nuevoBuffer = contexto.createBuffer(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
    );

    for (let canal = 0; canal < buffer.numberOfChannels; canal++) {
        const datosOrigen = buffer.getChannelData(canal);
        const datosDestino = nuevoBuffer.getChannelData(canal);
        for (let i = 0; i < datosOrigen.length; i++) {
            datosDestino[i] = datosOrigen[i] * factor;
        }
    }

    return nuevoBuffer;
};
