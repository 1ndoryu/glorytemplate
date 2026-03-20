/* Utilidades de audio y texto para creación de contenido.
 * Extraído de useCrearContenido para respetar el límite de líneas en hooks. */

import { crearLogger } from '@app/services/logger';

const log = crearLogger('audioUtils');

/* Extraer hashtags del texto */
export const extraerTags = (texto: string): string[] => {
    const regex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = regex.exec(texto)) !== null) {
        tags.push(match[1].toLowerCase());
    }
    return [...new Set(tags)];
};

/* Genera waveform peaks de un archivo de audio via Web Audio API */
export const generarPeaks = async (archivo: File, barras = 60): Promise<number[]> => {
    try {
        const buffer = await archivo.arrayBuffer();
        const contexto = new AudioContext();
        const audioBuffer = await contexto.decodeAudioData(buffer);
        const datos = audioBuffer.getChannelData(0);
        const pasoTamano = Math.floor(datos.length / barras);
        const peaks: number[] = [];
        for (let i = 0; i < barras; i++) {
            let max = 0;
            for (let j = 0; j < pasoTamano; j++) {
                const abs = Math.abs(datos[i * pasoTamano + j] || 0);
                if (abs > max) max = abs;
            }
            peaks.push(max);
        }
        await contexto.close();
        return peaks;
    } catch (error) {
        log.warn('No se pudieron generar peaks del audio, usando fallback', error);
        return Array(barras).fill(0.3);
    }
};
