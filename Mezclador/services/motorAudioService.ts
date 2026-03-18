/*
 * motorAudioService — Singleton AudioContext + caché de buffers
 * Gestiona la reproducción sincronizada de múltiples samples en la timeline.
 * Usa Web Audio API con scheduling preciso (lookahead).
 */

import { CONSTANTES_MEZCLADOR, DECLIC_DURACIONES } from '../types/mezclador';
import type { MixerInsertNodes, Patron } from '../types/mezclador';
import { decodificarAudio } from '../utils/audioBufferUtils';
import { obtenerBufferProcesado, limpiarCachePitch, obtenerBufferInvertido, limpiarCacheInvertidos } from './pitchShiftService';

class MotorAudio {
    private contexto: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private cacheBuffers: Map<string, AudioBuffer> = new Map();
    private nodosActivos: AudioBufferSourceNode[] = [];
    private gainsCanales: Map<string, GainNode> = new Map();
    private iniciado = false;

    /* Mixer: nodos Web Audio por insert */
    private mixerInserts: Map<number, MixerInsertNodes> = new Map();
    private masterAnalyser: AnalyserNode | null = null;

    /* C306: Stereo split para peak meters L/R */
    private splitterEstereo: ChannelSplitterNode | null = null;
    private analyserL: AnalyserNode | null = null;
    private analyserR: AnalyserNode | null = null;

    /* Inicializar AudioContext — requiere gesto de usuario */
    iniciar(): AudioContext {
        if (this.contexto && this.iniciado) return this.contexto;

        try {
            this.contexto = new AudioContext({
                sampleRate: CONSTANTES_MEZCLADOR.SAMPLE_RATE,
            });
        } catch (err) {
            /* Fallback sin sampleRate fijo si el navegador no lo soporta */
            console.error('[MotorAudio] Error creando AudioContext con sampleRate, intentando sin opciones', err);
            this.contexto = new AudioContext();
        }
        this.masterGain = this.contexto.createGain();

        /*
         * C314: Crear masterAnalyser + stereo split desde iniciar(),
         * no solo en inicializarMixer(). El monitor de onda y peak meter
         * necesitan estos nodos aunque el mixer no esté inicializado.
         */
        this.masterAnalyser = this.contexto.createAnalyser();
        this.masterAnalyser.fftSize = 2048;
        this.masterGain.connect(this.masterAnalyser);
        this.masterAnalyser.connect(this.contexto.destination);

        /* Stereo split para peak meters L/R */
        this.splitterEstereo = this.contexto.createChannelSplitter(2);
        this.analyserL = this.contexto.createAnalyser();
        this.analyserL.fftSize = 256;
        this.analyserR = this.contexto.createAnalyser();
        this.analyserR.fftSize = 256;
        this.masterAnalyser.connect(this.splitterEstereo);
        this.splitterEstereo.connect(this.analyserL, 0);
        this.splitterEstereo.connect(this.analyserR, 1);

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
        const duracionSegura = Math.max(0.1, duracion);
        const totalFrames = Math.ceil(duracionSegura * CONSTANTES_MEZCLADOR.SAMPLE_RATE);
        try {
            return new OfflineAudioContext(
                CONSTANTES_MEZCLADOR.CANALES,
                totalFrames,
                CONSTANTES_MEZCLADOR.SAMPLE_RATE
            );
        } catch (err) {
            console.error('[MotorAudio] Error creando OfflineAudioContext', err);
            throw err;
        }
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
        /* Desconectar mixer inserts */
        this.destruirMixerInserts();
        if (this.contexto && this.contexto.state !== 'closed') {
            await this.contexto.close();
        }
        this.contexto = null;
        this.masterGain = null;
        this.masterAnalyser = null;
        this.splitterEstereo = null;
        this.analyserL = null;
        this.analyserR = null;
        this.iniciado = false;
        this.limpiarCache();
    }

    /* MIXER — Routing por inserts con EQ y AnalyserNode */

    /* Crear BiquadFilterNode para una banda de EQ */
    private crearBandaEQNodo(
        ctx: BaseAudioContext,
        tipo: BiquadFilterType,
        frecuencia: number,
        ganancia: number
    ): BiquadFilterNode {
        const filtro = ctx.createBiquadFilter();
        filtro.type = tipo;
        filtro.frequency.value = frecuencia;
        filtro.gain.value = ganancia;
        filtro.Q.value = 1;
        return filtro;
    }

    /* Crear cadena de nodos para un insert del mixer */
    crearInsertMixer(insertId: number): void {
        const ctx = this.obtenerContexto();

        const inputGain = ctx.createGain();
        const fader = ctx.createGain();
        fader.gain.value = 0.8;
        const panner = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;

        /* EQ: 3 bandas paramétric — lowshelf, peaking, highshelf */
        const eqBandas: BiquadFilterNode[] = [
            this.crearBandaEQNodo(ctx, 'lowshelf', 200, 0),
            this.crearBandaEQNodo(ctx, 'peaking', 1000, 0),
            this.crearBandaEQNodo(ctx, 'highshelf', 8000, 0),
        ];

        /* Chain: input → EQ0 → EQ1 → EQ2 → fader → panner → analyser */
        inputGain.connect(eqBandas[0]);
        eqBandas[0].connect(eqBandas[1]);
        eqBandas[1].connect(eqBandas[2]);
        eqBandas[2].connect(fader);
        fader.connect(panner);
        panner.connect(analyser);

        /* El destino depende de si es master o insert regular */
        if (insertId === 0) {
            /*
             * C314: Si iniciar() ya creó masterAnalyser + stereo split,
             * reconectar la cadena del mixer a través de ellos en vez de
             * crear nodos duplicados. El analyser local del insert queda
             * para metering propio del insert 0.
             */
            if (this.masterAnalyser) {
                /* Desconectar masterGain→masterAnalyser viejo, reconectar
                   masterGain→insert chain→masterAnalyser→destination */
                this.masterGain?.disconnect();
                this.masterGain?.connect(inputGain);
                analyser.connect(this.masterAnalyser);
            } else {
                /* Fallback si iniciar() no corrió primero (no debería pasar) */
                analyser.connect(ctx.destination);
                this.masterAnalyser = analyser;
                this.splitterEstereo = ctx.createChannelSplitter(2);
                this.analyserL = ctx.createAnalyser();
                this.analyserL.fftSize = 256;
                this.analyserR = ctx.createAnalyser();
                this.analyserR.fftSize = 256;
                analyser.connect(this.splitterEstereo);
                this.splitterEstereo.connect(this.analyserL, 0);
                this.splitterEstereo.connect(this.analyserR, 1);
            }
        } else {
            /* Insert → Master inputGain */
            const masterNodes = this.mixerInserts.get(0);
            if (masterNodes) {
                analyser.connect(masterNodes.inputGain);
            } else {
                /* Si el master aún no existe, conectar temporalmente a destination */
                analyser.connect(ctx.destination);
            }
        }

        this.mixerInserts.set(insertId, { inputGain, fader, panner, eqBandas, analyser });
    }

    /* Inicializar todos los inserts del mixer (Master + 16) */
    inicializarMixer(): void {
        if (this.mixerInserts.size > 0) return;
        /* Crear Master primero */
        this.crearInsertMixer(0);
        /* Luego los inserts 1-16 (se conectan al master) */
        for (let i = 1; i <= 16; i++) {
            this.crearInsertMixer(i);
        }
    }

    /* Actualizar parámetros de un insert desde el store */
    actualizarInsertMixer(insertId: number, volumen: number, pan: number, silenciado: boolean): void {
        const nodos = this.mixerInserts.get(insertId);
        if (!nodos) return;
        nodos.fader.gain.value = silenciado ? 0 : volumen;
        nodos.panner.pan.value = pan;
    }

    /* Actualizar una banda EQ de un insert */
    actualizarEQInsert(insertId: number, bandaIdx: number, frecuencia: number, ganancia: number, q: number): void {
        const nodos = this.mixerInserts.get(insertId);
        if (!nodos || !nodos.eqBandas[bandaIdx]) return;
        const banda = nodos.eqBandas[bandaIdx];
        banda.frequency.value = frecuencia;
        banda.gain.value = ganancia;
        banda.Q.value = q;
    }

    /* Obtener peak levels de un insert */
    obtenerPeaks(insertId: number): { peakL: number; peakR: number } {
        const nodos = this.mixerInserts.get(insertId);
        if (!nodos) return { peakL: 0, peakR: 0 };

        const data = new Float32Array(nodos.analyser.frequencyBinCount);
        nodos.analyser.getFloatTimeDomainData(data);

        let max = 0;
        for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i]);
            if (abs > max) max = abs;
        }
        /* Mono simplificado; stereo split requeriría ChannelSplitter */
        return { peakL: max, peakR: max };
    }

    /* Obtener el AnalyserNode del master para visualización */
    obtenerMasterAnalyser(): AnalyserNode | null {
        return this.masterAnalyser;
    }

    /* C306: Obtener analysers estéreo L/R */
    obtenerAnalyserEstereo(): { izquierdo: AnalyserNode | null; derecho: AnalyserNode | null } {
        return { izquierdo: this.analyserL, derecho: this.analyserR };
    }

    /* Programar reproducción de un canal del Channel Rack a un insert del mixer */
    programarReproduccionCanal(
        buffer: AudioBuffer,
        canalId: string,
        mixerInsertId: number,
        cuando: number,
        offset: number,
        duracion: number,
        playbackRate: number,
        volumen: number,
        invertido = false,
        fadeIn = 0,
        fadeOut = 0,
        detune = 0,
        modoTonalidad: 'resample' | 'stretch' = 'resample',
        bloqueId = '',
        pan = 0,
        modoDeclic: 'none' | 'corto' | 'medio' | 'largo' = 'corto'
    ): AudioBufferSourceNode | null {
        const ctx = this.obtenerContexto();

        /* Verificar que el insert del mixer existe */
        const insertNodes = this.mixerInserts.get(mixerInsertId);
        if (!insertNodes) {
            /* Fallback: reproducir por el sistema legacy */
            return this.programarReproduccion(
                buffer, canalId, cuando, offset, duracion,
                playbackRate, volumen, invertido, fadeIn, fadeOut,
                detune, modoTonalidad, bloqueId, pan, modoDeclic
            );
        }

        const fuente = ctx.createBufferSource();

        /* Procesamiento de buffer (stretch/invertido) */
        let bufferFinal: AudioBuffer;
        let rateParaFuente: number;
        let detuneParaFuente: number;

        if (modoTonalidad === 'stretch' && (detune !== 0 || playbackRate !== 1)) {
            bufferFinal = obtenerBufferProcesado(ctx, bloqueId, buffer, detune, playbackRate);
            rateParaFuente = 1;
            detuneParaFuente = 0;
        } else {
            bufferFinal = buffer;
            rateParaFuente = playbackRate;
            detuneParaFuente = detune;
        }

        if (invertido) {
            fuente.buffer = obtenerBufferInvertido(ctx, bloqueId, bufferFinal);
        } else {
            fuente.buffer = bufferFinal;
        }

        fuente.playbackRate.value = rateParaFuente;
        if (detuneParaFuente !== 0) {
            fuente.detune.value = detuneParaFuente * 100;
        }

        /* Gain del canal → conectar al insert del mixer */
        const gainNodo = ctx.createGain();
        fuente.connect(gainNodo);

        /* Pan per-canal antes del mixer */
        if (pan !== 0) {
            const panNodo = ctx.createStereoPanner();
            panNodo.pan.value = Math.max(-1, Math.min(1, pan));
            gainNodo.connect(panNodo);
            panNodo.connect(insertNodes.inputGain);
        } else {
            gainNodo.connect(insertNodes.inputGain);
        }

        /* Declicking + fades */
        const declicDur = DECLIC_DURACIONES[modoDeclic] ?? 0;
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

        const tasaEfectiva = rateParaFuente * Math.pow(2, (detuneParaFuente * 100) / 1200);
        fuente.start(cuando, offset, duracion * tasaEfectiva);
        this.nodosActivos.push(fuente);

        fuente.onended = () => {
            gainNodo.disconnect();
            this.nodosActivos = this.nodosActivos.filter(n => n !== fuente);
        };

        return fuente;
    }

    /* STEP SEQUENCER — Reproducción de patrones */

    /*
     * Programar un patrón completo para reproducción.
     * Cada paso activo produce un trigger de sample.
     * Se usa tanto en modo PAT como en SONG (con offset).
     */
    programarPatron(
        patron: Patron,
        bpm: number,
        desdeSegundo: number,
        mixerInicializado: boolean
    ): void {
        /* Duración de un paso = 1 semicorchea = (60/bpm) / 4 */
        const duracionPasoReal = (60 / bpm) / 4;

        for (const canal of patron.canales) {
            if (canal.silenciado || !canal.audioBuffer) continue;

            /* Si hay algún canal en solo, solo reproducir esos */
            const haySolo = patron.canales.some(c => c.solo);
            if (haySolo && !canal.solo) continue;

            for (let i = 0; i < canal.pasos.length; i++) {
                const paso = canal.pasos[i];
                if (!paso.activo) continue;

                /* Momento en que suena este paso */
                let cuando = desdeSegundo + (i * duracionPasoReal);

                /* Swing: desplazar pasos impares */
                if (patron.swing > 0 && i % 2 === 1) {
                    cuando += duracionPasoReal * patron.swing * 0.5;
                }

                const ctx = this.obtenerContexto();
                const ahora = ctx.currentTime;

                /* Solo programar pasos que están en el futuro */
                if (cuando < ahora - 0.01) continue;

                const volumenFinal = paso.velocity * canal.volumen;
                const duracionSample = canal.audioBuffer.duration;

                if (mixerInicializado) {
                    this.programarReproduccionCanal(
                        canal.audioBuffer,
                        canal.id,
                        canal.mixerInsertId,
                        cuando,
                        0,
                        duracionSample,
                        1,
                        volumenFinal,
                        false,
                        0, 0,
                        paso.pitch,
                        'resample',
                        canal.id,
                        paso.pan !== 0 ? paso.pan : canal.pan,
                        'corto'
                    );
                } else {
                    this.programarReproduccion(
                        canal.audioBuffer,
                        canal.id,
                        cuando,
                        0,
                        duracionSample,
                        1,
                        volumenFinal,
                        false,
                        0, 0,
                        paso.pitch,
                        'resample',
                        canal.id,
                        paso.pan !== 0 ? paso.pan : canal.pan,
                        'corto'
                    );
                }
            }
        }
    }

    /* Destruir todos los nodos del mixer */
    private destruirMixerInserts(): void {
        for (const nodos of this.mixerInserts.values()) {
            try {
                nodos.inputGain.disconnect();
                nodos.fader.disconnect();
                nodos.panner.disconnect();
                nodos.analyser.disconnect();
                for (const banda of nodos.eqBandas) {
                    banda.disconnect();
                }
            } catch { /* nodos ya desconectados */ }
        }
        this.mixerInserts.clear();
        this.masterAnalyser = null;
    }

    /* Verificar si el mixer está inicializado */
    esMixerInicializado(): boolean {
        return this.mixerInserts.size > 0;
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
