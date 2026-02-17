/*
 * motorAudioService — Singleton AudioContext + caché de buffers
 * Gestiona la reproducción sincronizada de múltiples samples en la timeline.
 * Usa Web Audio API con scheduling preciso (lookahead).
 */

import { CONSTANTES_MEZCLADOR } from '../types/mezclador';
import { decodificarAudio } from '../utils/audioBufferUtils';

class MotorAudio {
    private contexto: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private cacheBuffers: Map<string, AudioBuffer> = new Map();
    private nodosActivos: AudioBufferSourceNode[] = [];
    private gainsCanales: Map<string, GainNode> = new Map();
    private iniciado = false;

    /* Inicializar AudioContext — requiere gesto de usuario */
    iniciar(): AudioContext {
        if (this.contexto && this.iniciado) return this.contexto;

        this.contexto = new AudioContext({
            sampleRate: CONSTANTES_MEZCLADOR.SAMPLE_RATE,
        });
        this.masterGain = this.contexto.createGain();
        this.masterGain.connect(this.contexto.destination);
        this.iniciado = true;

        return this.contexto;
    }

    /* Obtener o crear el contexto — reinicia si fue cerrado */
    obtenerContexto(): AudioContext {
        if (!this.contexto || !this.iniciado || this.contexto.state === 'closed') {
            return this.iniciar();
        }
        if (this.contexto.state === 'suspended') {
            void this.contexto.resume();
        }
        return this.contexto;
    }

    /* Cargar y cachear un AudioBuffer desde URL */
    async cargarBuffer(url: string, id: string): Promise<AudioBuffer> {
        const cachedo = this.cacheBuffers.get(id);
        if (cachedo) return cachedo;

        const ctx = this.obtenerContexto();
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error(`Error cargando audio: ${respuesta.status}`);
        const arrayBuffer = await respuesta.arrayBuffer();
        const audioBuffer = await decodificarAudio(ctx, arrayBuffer);

        this.cacheBuffers.set(id, audioBuffer);
        return audioBuffer;
    }

    /* Obtener buffer cacheado */
    obtenerBuffer(id: string): AudioBuffer | null {
        return this.cacheBuffers.get(id) ?? null;
    }

    /*
     * C208: Decodificar un ArrayBuffer local (desde archivo subido).
     * Cachea con el id proporcionado.
     */
    async decodificarBufferLocal(arrayBuffer: ArrayBuffer, id: string): Promise<AudioBuffer> {
        const ctx = this.obtenerContexto();
        const audioBuffer = await decodificarAudio(ctx, arrayBuffer);
        this.cacheBuffers.set(id, audioBuffer);
        return audioBuffer;
    }

    /* Crear o reutilizar GainNode para una pista */
    obtenerGainPista(pistaId: string): GainNode {
        const existente = this.gainsCanales.get(pistaId);
        if (existente) return existente;

        const ctx = this.obtenerContexto();
        const gain = ctx.createGain();
        if (!this.masterGain) {
            throw new Error('[MotorAudio] masterGain no inicializado');
        }
        gain.connect(this.masterGain);
        this.gainsCanales.set(pistaId, gain);
        return gain;
    }

    /*
     * Programar un buffer para reproducirse en un momento específico.
     * C215: Soporta invertido (reverse), fadeIn y fadeOut via GainNode ramps.
     */
    programarReproduccion(
        buffer: AudioBuffer,
        pistaId: string,
        cuando: number,
        offset: number,
        duracion: number,
        playbackRate: number,
        volumen: number,
        invertido = false,
        fadeIn = 0,
        fadeOut = 0,
        /* C240: Desplazamiento en semitonos (-12 a +12) */
        detune = 0
    ): AudioBufferSourceNode {
        const ctx = this.obtenerContexto();
        const fuente = ctx.createBufferSource();

        /*
         * C215: Si el bloque está invertido, usar un buffer invertido.
         * Crear copia invertida en el momento (cacheado sería mejor pero
         * para simplificar lo hacemos inline; el buffer ya está en memoria).
         */
        if (invertido) {
            const bufferInvertido = ctx.createBuffer(
                buffer.numberOfChannels,
                buffer.length,
                buffer.sampleRate
            );
            for (let c = 0; c < buffer.numberOfChannels; c++) {
                const orig = buffer.getChannelData(c);
                const dest = bufferInvertido.getChannelData(c);
                for (let i = 0; i < orig.length; i++) {
                    dest[i] = orig[orig.length - 1 - i];
                }
            }
            fuente.buffer = bufferInvertido;
            /* Invertir el offset: apuntar al espejo */
            offset = Math.max(0, buffer.duration - offset - (duracion * playbackRate));
        } else {
            fuente.buffer = buffer;
        }

        fuente.playbackRate.value = playbackRate;

        /*
         * C240: Desplazamiento de tonalidad sin cambiar velocidad.
         * detune en semitonos → cents (x100). Compensar playbackRate para que
         * la duración no cambie: rate_compensado = rate / 2^(detune/1200).
         */
        if (detune !== 0) {
            const cents = detune * 100;
            fuente.detune.value = cents;
            fuente.playbackRate.value = playbackRate / Math.pow(2, cents / 1200);
        }

        const gainNodo = ctx.createGain();
        fuente.connect(gainNodo);

        const gainPista = this.obtenerGainPista(pistaId);
        gainNodo.connect(gainPista);

        /*
         * C215: Aplicar fade in/out vía rampas de ganancia.
         * fadeIn/fadeOut son en segundos wall-clock (no buffer-time).
         */
        if (fadeIn > 0 && fadeIn < duracion) {
            gainNodo.gain.setValueAtTime(0, cuando);
            gainNodo.gain.linearRampToValueAtTime(volumen, cuando + fadeIn);
        } else {
            gainNodo.gain.setValueAtTime(volumen, cuando);
        }

        if (fadeOut > 0 && fadeOut < duracion) {
            const inicioFadeOut = cuando + duracion - fadeOut;
            /* Solo aplicar si no se superpone con fadeIn */
            if (inicioFadeOut > cuando + fadeIn) {
                gainNodo.gain.setValueAtTime(volumen, inicioFadeOut);
                gainNodo.gain.linearRampToValueAtTime(0, cuando + duracion);
            }
        }

        /*
         * C222: El parámetro duration de start() es en buffer-time (no wall-clock).
         * La duración wall-clock pasada se convierte multiplicando por playbackRate.
         */
        fuente.start(cuando, offset, duracion * playbackRate);
        this.nodosActivos.push(fuente);

        fuente.onended = () => {
            gainNodo.disconnect();
            this.nodosActivos = this.nodosActivos.filter(n => n !== fuente);
        };

        return fuente;
    }

    /* Detener toda la reproducción */
    detenerTodo(): void {
        for (const nodo of this.nodosActivos) {
            try { nodo.stop(); } catch { /* ya terminó */ }
        }
        this.nodosActivos = [];
    }

    /* Ajustar volumen master */
    setVolumenMaster(volumen: number): void {
        if (this.masterGain) {
            this.masterGain.gain.value = volumen;
        }
    }

    /* Ajustar volumen de una pista */
    setVolumenPista(pistaId: string, volumen: number): void {
        const gain = this.gainsCanales.get(pistaId);
        if (gain) gain.gain.value = volumen;
    }

    /* Silenciar/des-silenciar pista */
    setSilenciarPista(pistaId: string, silenciada: boolean): void {
        const gain = this.gainsCanales.get(pistaId);
        if (gain) gain.gain.value = silenciada ? 0 : 1;
    }

    /* Obtener tiempo actual del contexto */
    obtenerTiempoActual(): number {
        return this.contexto?.currentTime ?? 0;
    }

    /* Crear OfflineAudioContext para exportar */
    crearContextoOffline(duracion: number): OfflineAudioContext {
        return new OfflineAudioContext(
            CONSTANTES_MEZCLADOR.CANALES,
            Math.ceil(duracion * CONSTANTES_MEZCLADOR.SAMPLE_RATE),
            CONSTANTES_MEZCLADOR.SAMPLE_RATE
        );
    }

    /* Renderizar mezcla offline */
    async renderizarOffline(
        bloques: Array<{
            buffer: AudioBuffer;
            cuando: number;
            offset: number;
            duracion: number;
            playbackRate: number;
            volumen: number;
            invertido?: boolean;
            fadeIn?: number;
            fadeOut?: number;
            /* C240: Tonalidad en semitonos */
            detune?: number;
        }>,
        duracionTotal: number
    ): Promise<AudioBuffer> {
        const offlineCtx = this.crearContextoOffline(duracionTotal);
        const masterGain = offlineCtx.createGain();
        masterGain.connect(offlineCtx.destination);

        for (const bloque of bloques) {
            const fuente = offlineCtx.createBufferSource();

            /* C215: Invertir buffer si es necesario */
            if (bloque.invertido) {
                const bufInv = offlineCtx.createBuffer(
                    bloque.buffer.numberOfChannels,
                    bloque.buffer.length,
                    bloque.buffer.sampleRate
                );
                for (let c = 0; c < bloque.buffer.numberOfChannels; c++) {
                    const orig = bloque.buffer.getChannelData(c);
                    const dest = bufInv.getChannelData(c);
                    for (let i = 0; i < orig.length; i++) {
                        dest[i] = orig[orig.length - 1 - i];
                    }
                }
                fuente.buffer = bufInv;
            } else {
                fuente.buffer = bloque.buffer;
            }

            fuente.playbackRate.value = bloque.playbackRate;

            /* C240: Aplicar detune con compensación de velocidad en renderizado offline */
            const detuneVal = bloque.detune ?? 0;
            if (detuneVal !== 0) {
                const cents = detuneVal * 100;
                fuente.detune.value = cents;
                fuente.playbackRate.value = bloque.playbackRate / Math.pow(2, cents / 1200);
            }

            const gainNodo = offlineCtx.createGain();
            fuente.connect(gainNodo);
            gainNodo.connect(masterGain);

            /* C215: Aplicar fades */
            const fadeIn = bloque.fadeIn ?? 0;
            const fadeOut = bloque.fadeOut ?? 0;

            if (fadeIn > 0 && fadeIn < bloque.duracion) {
                gainNodo.gain.setValueAtTime(0, bloque.cuando);
                gainNodo.gain.linearRampToValueAtTime(bloque.volumen, bloque.cuando + fadeIn);
            } else {
                gainNodo.gain.setValueAtTime(bloque.volumen, bloque.cuando);
            }

            if (fadeOut > 0 && fadeOut < bloque.duracion) {
                const inicioFade = bloque.cuando + bloque.duracion - fadeOut;
                if (inicioFade > bloque.cuando + fadeIn) {
                    gainNodo.gain.setValueAtTime(bloque.volumen, inicioFade);
                    gainNodo.gain.linearRampToValueAtTime(0, bloque.cuando + bloque.duracion);
                }
            }

            const offset = bloque.invertido
                ? Math.max(0, bloque.buffer.duration - bloque.offset - (bloque.duracion * bloque.playbackRate))
                : bloque.offset;

            /* C222: duration en buffer-time */
            fuente.start(bloque.cuando, offset, bloque.duracion * bloque.playbackRate);
        }

        return offlineCtx.startRendering();
    }

    /* Limpiar todo al cerrar el mezclador — libera AudioContext */
    async destruir(): Promise<void> {
        this.detenerTodo();
        for (const gain of this.gainsCanales.values()) {
            try { gain.disconnect(); } catch { /* ya desconectado */ }
        }
        this.gainsCanales.clear();
        if (this.contexto && this.contexto.state !== 'closed') {
            await this.contexto.close();
        }
        this.contexto = null;
        this.masterGain = null;
        this.iniciado = false;
        /* cacheBuffers se conservan — reutilizables si se reabre */
    }

    /* Limpiar caché de buffers (liberar memoria) */
    limpiarCache(): void {
        this.cacheBuffers.clear();
    }
}

/* Singleton global */
export const motorAudio = new MotorAudio();
