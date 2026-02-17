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

    /* Programar un buffer para reproducirse en un momento específico */
    programarReproduccion(
        buffer: AudioBuffer,
        pistaId: string,
        cuando: number,
        offset: number,
        duracion: number,
        playbackRate: number,
        volumen: number
    ): AudioBufferSourceNode {
        const ctx = this.obtenerContexto();
        const fuente = ctx.createBufferSource();
        fuente.buffer = buffer;
        fuente.playbackRate.value = playbackRate;

        const gainNodo = ctx.createGain();
        gainNodo.gain.value = volumen;
        fuente.connect(gainNodo);

        const gainPista = this.obtenerGainPista(pistaId);
        gainNodo.connect(gainPista);

        fuente.start(cuando, offset, duracion);
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
        }>,
        duracionTotal: number
    ): Promise<AudioBuffer> {
        const offlineCtx = this.crearContextoOffline(duracionTotal);
        const masterGain = offlineCtx.createGain();
        masterGain.connect(offlineCtx.destination);

        for (const bloque of bloques) {
            const fuente = offlineCtx.createBufferSource();
            fuente.buffer = bloque.buffer;
            fuente.playbackRate.value = bloque.playbackRate;

            const gainNodo = offlineCtx.createGain();
            gainNodo.gain.value = bloque.volumen;
            fuente.connect(gainNodo);
            gainNodo.connect(masterGain);

            fuente.start(bloque.cuando, bloque.offset, bloque.duracion);
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
