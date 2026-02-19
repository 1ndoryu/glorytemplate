/*
 * motorAudioService — Singleton AudioContext + caché de buffers
 * Gestiona la reproducción sincronizada de múltiples samples en la timeline.
 * Usa Web Audio API con scheduling preciso (lookahead).
 */

import { CONSTANTES_MEZCLADOR, DECLIC_DURACIONES } from '../types/mezclador';
import { decodificarAudio } from '../utils/audioBufferUtils';
import { obtenerBufferProcesado, limpiarCachePitch, obtenerBufferInvertido, limpiarCacheInvertidos } from './pitchShiftService';

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
     * C271: Soporta modo stretch (pitch independiente de velocidad).
     * C287: Soporta pan estéreo y declicking automático.
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
        detune = 0,
        /* C271: Modo tonal — resample (vinilo) o stretch (SoundTouch) */
        modoTonalidad: 'resample' | 'stretch' = 'resample',
        /* C271: ID del bloque para cache SoundTouch */
        bloqueId = '',
        /* C287: Balance estéreo (-1 a 1) */
        pan = 0,
        /* C287: Modo declicking (micro-fade anti-click) */
        modoDeclic: 'none' | 'corto' | 'medio' | 'largo' = 'none'
    ): AudioBufferSourceNode {
        const ctx = this.obtenerContexto();
        const fuente = ctx.createBufferSource();

        /*
         * C271: En modo stretch, pre-procesar el buffer con SoundTouch.
         * El pitch se controla via DSP, no via detune nativo.
         * playbackRate se mantiene en 1 porque SoundTouch ya lo aplica.
         */
        let bufferFinal: AudioBuffer;
        let rateParaFuente: number;
        let detuneParaFuente: number;

        if (modoTonalidad === 'stretch' && (detune !== 0 || playbackRate !== 1)) {
            /* SoundTouch procesa tanto pitch como tempo */
            bufferFinal = obtenerBufferProcesado(
                ctx, bloqueId, buffer, detune, playbackRate
            );
            rateParaFuente = 1;
            detuneParaFuente = 0;
        } else {
            bufferFinal = buffer;
            rateParaFuente = playbackRate;
            detuneParaFuente = detune;
        }

        /*
         * C215: Si el bloque está invertido, usar buffer invertido cacheado.
         */
        if (invertido) {
            const bufferInvertido = obtenerBufferInvertido(ctx, bloqueId, bufferFinal);
            fuente.buffer = bufferInvertido;
            offset = Math.max(0, bufferFinal.duration - offset - (duracion * rateParaFuente));
        } else {
            fuente.buffer = bufferFinal;
        }

        fuente.playbackRate.value = rateParaFuente;

        /*
         * C258 fix: Detune puro sin compensación de playbackRate.
         * Solo aplica en modo resample (vinilo).
         * En modo stretch, detune ya fue procesado por SoundTouch.
         */
        if (detuneParaFuente !== 0) {
            fuente.detune.value = detuneParaFuente * 100;
        }

        const gainNodo = ctx.createGain();
        fuente.connect(gainNodo);

        /*
         * C287: StereoPannerNode para balance L/R.
         * pan=0 → centro, -1 → izquierda, 1 → derecha.
         */
        const gainPista = this.obtenerGainPista(pistaId);
        if (pan !== 0) {
            const panNodo = ctx.createStereoPanner();
            panNodo.pan.value = Math.max(-1, Math.min(1, pan));
            gainNodo.connect(panNodo);
            panNodo.connect(gainPista);
        } else {
            gainNodo.connect(gainPista);
        }

        /*
         * C287: Declicking — micro-fade al inicio/fin para evitar clicks digitales.
         * Se aplica ADEMÁS de los fades visibles del usuario.
         */
        const declicDur = DECLIC_DURACIONES[modoDeclic] ?? 0;

        /*
         * C215: Aplicar fade in/out vía rampas de ganancia.
         * C287: Si hay declicking, el fade mínimo es el declicking duration.
         */
        const fadeInEfectivo = Math.max(fadeIn, declicDur);
        if (fadeInEfectivo > 0 && fadeInEfectivo < duracion) {
            gainNodo.gain.setValueAtTime(0, cuando);
            gainNodo.gain.linearRampToValueAtTime(volumen, cuando + fadeInEfectivo);
        } else {
            gainNodo.gain.setValueAtTime(volumen, cuando);
        }

        const fadeOutEfectivo = Math.max(fadeOut, declicDur);
        if (fadeOutEfectivo > 0 && fadeOutEfectivo < duracion) {
            const inicioFadeOut = cuando + duracion - fadeOutEfectivo;
            if (inicioFadeOut > cuando + fadeInEfectivo) {
                gainNodo.gain.setValueAtTime(volumen, inicioFadeOut);
                gainNodo.gain.linearRampToValueAtTime(0, cuando + duracion);
            }
        }

        /*
         * C222+C258: duration en buffer-time.
         * En modo stretch, rate=1 y detune=0 → tasaEfectiva=1 (duración no cambia).
         * En modo resample, la tasa efectiva incluye detune nativo.
         */
        const tasaEfectiva = rateParaFuente * Math.pow(2, (detuneParaFuente * 100) / 1200);
        fuente.start(cuando, offset, duracion * tasaEfectiva);
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

    /* Silenciar/des-silenciar pista. volumenReal restaura el gain correcto al des-silenciar */
    setSilenciarPista(pistaId: string, silenciada: boolean, volumenReal = 1): void {
        const gain = this.gainsCanales.get(pistaId);
        if (gain) gain.gain.value = silenciada ? 0 : volumenReal;
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
            /* C271: Modo tonal */
            modoTonalidad?: 'resample' | 'stretch';
            bloqueId?: string;
        }>,
        duracionTotal: number
    ): Promise<AudioBuffer> {
        const offlineCtx = this.crearContextoOffline(duracionTotal);
        const masterGain = offlineCtx.createGain();
        masterGain.connect(offlineCtx.destination);

        for (const bloque of bloques) {
            const fuente = offlineCtx.createBufferSource();
            const detuneVal = bloque.detune ?? 0;
            const modo = bloque.modoTonalidad ?? 'resample';

            /*
             * C271: En modo stretch, pre-procesar buffer con SoundTouch.
             * rate=1 y detune=0 para la fuente — ya aplicados por DSP.
             */
            let bufferParaFuente: AudioBuffer;
            let rateParaFuente: number;
            let detuneParaFuente: number;

            if (modo === 'stretch' && (detuneVal !== 0 || bloque.playbackRate !== 1)) {
                bufferParaFuente = obtenerBufferProcesado(
                    offlineCtx,
                    bloque.bloqueId ?? '',
                    bloque.buffer,
                    detuneVal,
                    bloque.playbackRate
                );
                rateParaFuente = 1;
                detuneParaFuente = 0;
            } else {
                bufferParaFuente = bloque.buffer;
                rateParaFuente = bloque.playbackRate;
                detuneParaFuente = detuneVal;
            }

            /* C215: Invertir buffer si es necesario (cacheado) */
            if (bloque.invertido) {
                fuente.buffer = obtenerBufferInvertido(
                    offlineCtx, bloque.bloqueId ?? '', bufferParaFuente
                );
            } else {
                fuente.buffer = bufferParaFuente;
            }

            fuente.playbackRate.value = rateParaFuente;

            if (detuneParaFuente !== 0) {
                fuente.detune.value = detuneParaFuente * 100;
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
                ? Math.max(0, bufferParaFuente.duration - bloque.offset - (bloque.duracion * rateParaFuente))
                : bloque.offset;

            const tasaEfectivaOffline = rateParaFuente * Math.pow(2, (detuneParaFuente * 100) / 1200);
            fuente.start(bloque.cuando, offset, bloque.duracion * tasaEfectivaOffline);
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
        /* Liberar caches de buffers al destruir */
        this.limpiarCache();
    }

    /* Limpiar caché de buffers (liberar memoria) */
    limpiarCache(): void {
        this.cacheBuffers.clear();
        /* C271: Limpiar cache de buffers SoundTouch procesados */
        limpiarCachePitch();
        /* Limpiar cache de buffers invertidos */
        limpiarCacheInvertidos();
    }
}

/* Singleton global */
export const motorAudio = new MotorAudio();
