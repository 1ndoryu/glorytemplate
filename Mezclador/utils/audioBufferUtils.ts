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

/* Extraer peaks de un AudioBuffer para mini waveform */
export const extraerPeaks = (
    buffer: AudioBuffer,
    numeroPeaks: number
): number[] => {
    const datos = buffer.getChannelData(0);
    const tamanoBloque = Math.floor(datos.length / numeroPeaks);
    const peaks: number[] = [];

    for (let i = 0; i < numeroPeaks; i++) {
        let max = 0;
        const inicio = i * tamanoBloque;
        const fin = Math.min(inicio + tamanoBloque, datos.length);

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
