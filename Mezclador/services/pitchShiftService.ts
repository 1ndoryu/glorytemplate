/*
 * pitchShiftService — C271: Pitch-independent time stretch via SoundTouchJS.
 * Permite cambiar pitch sin alterar duración (modo stretch) o viceversa.
 *
 * Modos por bloque:
 * - resample: playbackRate cambia pitch+speed (comportamiento vinilo, por defecto)
 * - stretch: pitch independiente de velocidad via SoundTouch DSP
 *
 * Uso: pre-procesar un AudioBuffer antes de reproducción o export.
 */

import { SoundTouch, SimpleFilter, WebAudioBufferSource } from 'soundtouchjs';

/*
 * Aplica pitch-shift a un AudioBuffer sin cambiar su duración.
 * Devuelve un nuevo AudioBuffer con el pitch desplazado.
 *
 * @param ctx - AudioContext (o OfflineAudioContext)
 * @param buffer - AudioBuffer original
 * @param semitonos - Desplazamiento en semitonos (-12 a +12)
 * @param playbackRate - Tasa de reproducción (1 = velocidad original)
 * @returns AudioBuffer procesado
 */
export const aplicarPitchShift = (
    ctx: BaseAudioContext,
    buffer: AudioBuffer,
    semitonos: number,
    playbackRate = 1
): AudioBuffer => {
    if (semitonos === 0 && playbackRate === 1) return buffer;

    /* Guard div/0: playbackRate <= 0 produciria Infinity en muestrasEsperadas */
    if (playbackRate <= 0) playbackRate = 0.01;

    const st = new SoundTouch();

    /*
     * En modo stretch: pitch cambia independientemente de la velocidad.
     * SoundTouch usa:
     * - pitch: ratio multiplicativo (2^(semitonos/12))
     * - tempo: ratio de velocidad (1 = normal, 2 = doble velocidad)
     */
    st.pitch = Math.pow(2, semitonos / 12);
    st.tempo = playbackRate;

    const fuente = new WebAudioBufferSource(buffer);
    const filtro = new SimpleFilter(fuente, st);

    /*
     * Calcular duración esperada del output.
     * El tempo cambia la duración: duracionOriginal / playbackRate
     */
    const muestrasEsperadas = Math.ceil(buffer.length / playbackRate);
    const salidaBuffer = new Float32Array(muestrasEsperadas * buffer.numberOfChannels);

    /* Extraer todas las muestras procesadas */
    let muestrasExtraidas = 0;
    const BLOQUE = 4096;

    while (muestrasExtraidas < muestrasEsperadas) {
        const restante = muestrasEsperadas - muestrasExtraidas;
        const aPedir = Math.min(BLOQUE, restante);
        const temp = new Float32Array(aPedir * buffer.numberOfChannels);
        const leidas = filtro.extract(temp, aPedir);
        if (leidas === 0) break;

        /* Copiar muestras extraídas al buffer de salida */
        const inicio = muestrasExtraidas * buffer.numberOfChannels;
        const fin = inicio + leidas * buffer.numberOfChannels;
        salidaBuffer.set(
            temp.subarray(0, leidas * buffer.numberOfChannels),
            inicio
        );
        muestrasExtraidas += leidas;
        if (fin >= salidaBuffer.length) break;
    }

    /* Crear AudioBuffer de salida */
    const longitudFinal = Math.min(muestrasExtraidas, muestrasEsperadas);
    const resultado = ctx.createBuffer(
        buffer.numberOfChannels,
        longitudFinal || 1,
        buffer.sampleRate
    );

    /*
     * SoundTouch entrelaza los canales (L, R, L, R...).
     * Desentrenzar hacia canales separados.
     */
    for (let c = 0; c < buffer.numberOfChannels; c++) {
        const canalDatos = resultado.getChannelData(c);
        for (let i = 0; i < longitudFinal; i++) {
            canalDatos[i] = salidaBuffer[i * buffer.numberOfChannels + c] || 0;
        }
    }

    return resultado;
};

/*
 * Cache de buffers procesados para evitar re-procesar en cada schedule.
 * Clave: `${bloqueId}:${semitonos}:${playbackRate}`
 */
const cacheProcessed = new Map<string, AudioBuffer>();
const MAX_CACHE_PITCH = 50;

export const obtenerBufferProcesado = (
    ctx: BaseAudioContext,
    bloqueId: string,
    buffer: AudioBuffer,
    semitonos: number,
    playbackRate: number
): AudioBuffer => {
    const clave = `${bloqueId}:${semitonos}:${playbackRate}`;
    const cachedo = cacheProcessed.get(clave);
    if (cachedo) return cachedo;

    const procesado = aplicarPitchShift(ctx, buffer, semitonos, playbackRate);

    /* Evitar crecimiento ilimitado del cache */
    if (cacheProcessed.size >= MAX_CACHE_PITCH) {
        const primeraKey = cacheProcessed.keys().next().value;
        if (primeraKey !== undefined) cacheProcessed.delete(primeraKey);
    }

    cacheProcessed.set(clave, procesado);
    return procesado;
};

/* Limpiar cache para un bloque específico (al cambiar config) */
export const invalidarCacheBloque = (bloqueId: string): void => {
    for (const clave of cacheProcessed.keys()) {
        if (clave.startsWith(`${bloqueId}:`)) {
            cacheProcessed.delete(clave);
        }
    }
};

/* Limpiar todo el cache */
export const limpiarCachePitch = (): void => {
    cacheProcessed.clear();
};

/*
 * Cache de buffers invertidos — evita recrear en cada schedule.
 * Clave: `inv:${bloqueId}:${bufferId}`
 */
const cacheInvertidos = new Map<string, AudioBuffer>();

export const obtenerBufferInvertido = (
    ctx: BaseAudioContext,
    bloqueId: string,
    buffer: AudioBuffer
): AudioBuffer => {
    const clave = `inv:${bloqueId}`;
    const cachedo = cacheInvertidos.get(clave);
    if (cachedo && cachedo.length === buffer.length) return cachedo;

    const invertido = ctx.createBuffer(
        buffer.numberOfChannels,
        buffer.length,
        buffer.sampleRate
    );
    for (let c = 0; c < buffer.numberOfChannels; c++) {
        const orig = buffer.getChannelData(c);
        const dest = invertido.getChannelData(c);
        for (let i = 0; i < orig.length; i++) {
            dest[i] = orig[orig.length - 1 - i];
        }
    }

    if (cacheInvertidos.size >= MAX_CACHE_PITCH) {
        const primeraKey = cacheInvertidos.keys().next().value;
        if (primeraKey !== undefined) cacheInvertidos.delete(primeraKey);
    }

    cacheInvertidos.set(clave, invertido);
    return invertido;
};

export const limpiarCacheInvertidos = (): void => {
    cacheInvertidos.clear();
};
