/*
 * Hook: useMotorAudio
 * Motor de audio global — unico HTMLAudioElement persistente.
 * Se monta una vez en LayoutPrincipal. Sincroniza con reproductorStore.
 * Maneja tracking de reproduccion, seek, volumen, ciclo de vida del audio.
 */

import { useEffect } from 'react';
import { useReproductorStore } from '../stores/reproductorStore';
import { enviarTrackingReproduccion } from '../utils/trackingReproduccion';
import { crearLogger } from '../services/logger';

const log = crearLogger('MotorAudio');
const EVENTO_REPRODUCCION_SAMPLE = 'kamples:reproduccion-sample';

export const useMotorAudio = (): void => {
    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'metadata';

        /* Sincronizar volumen inicial */
        const estadoInicial = useReproductorStore.getState();
        audio.volume = estadoInicial.muted ? 0 : estadoInicial.volumen;

        /* Audio events → store */
        const onTimeUpdate = () => {
            if (!audio.duration || !Number.isFinite(audio.duration)) return;
            useReproductorStore.getState().setProgreso(audio.currentTime / audio.duration);
        };

        const onLoadedMetadata = () => {
            if (audio.duration && Number.isFinite(audio.duration)) {
                useReproductorStore.getState().setDuracion(audio.duration);
            }
        };

        const onEnded = () => {
            const state = useReproductorStore.getState();
            if (state.sampleActual) {
                enviarTrackingReproduccion(state.sampleActual.id, audio.duration || 0, true);
            }
            if (state.repetir) {
                audio.currentTime = 0;
                audio.play().catch(() => undefined);
            } else if (state.autoplay) {
                state.siguiente();
            } else {
                /* QL80: Autoplay desactivado — pausar al terminar sin avanzar */
                state.pause();
            }
        };

        const onError = () => {
            log.warn('Error de audio');
            useReproductorStore.getState().pause();
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        /* Store changes → audio */
        const unsub = useReproductorStore.subscribe((state, prevState) => {
            /* Sample cambio — cargar nueva fuente */
            if (state.sampleActual?.id !== prevState.sampleActual?.id) {
                /* Tracking del sample anterior */
                if (prevState.sampleActual && audio.currentTime > 0.5) {
                    enviarTrackingReproduccion(
                        prevState.sampleActual.id,
                        audio.currentTime,
                        false
                    );
                }

                if (state.sampleActual) {
                    const url = state.sampleActual.rutaPreview ?? '';
                    if (url) {
                        audio.src = url;
                        audio.load();
                        log.info('Cargando', state.sampleActual.titulo);

                        /* Broadcast para pausar audio local en tarjetas/previews */
                        window.dispatchEvent(
                            new CustomEvent(EVENTO_REPRODUCCION_SAMPLE, {
                                detail: { sampleId: state.sampleActual.id },
                            })
                        );

                        /*
                         * QQ62: Si el estado es reproduciendo, iniciar play inmediatamente.
                         * Necesario porque siguiente/anterior/reproducir setean reproduciendo=true
                         * pero si ya era true, el bloque de play/pause no se dispara.
                         */
                        if (state.reproduciendo) {
                            audio.play().catch(() => {
                                useReproductorStore.getState().pause();
                            });
                        }
                    }
                } else {
                    audio.pause();
                    audio.src = '';
                }
            }

            /* Play/Pause */
            if (state.reproduciendo !== prevState.reproduciendo) {
                if (state.reproduciendo && state.sampleActual) {
                    audio.play().catch(() => {
                        useReproductorStore.getState().pause();
                    });
                } else {
                    if (prevState.sampleActual && audio.currentTime > 0.5) {
                        enviarTrackingReproduccion(
                            prevState.sampleActual.id,
                            audio.currentTime,
                            false
                        );
                    }
                    audio.pause();
                }
            }

            /* Volumen / mute */
            if (state.volumen !== prevState.volumen || state.muted !== prevState.muted) {
                audio.volume = state.muted ? 0 : state.volumen;
            }

            /* Seek pendiente */
            if (state.pendingSeek !== null && state.pendingSeek !== prevState.pendingSeek) {
                if (audio.duration && Number.isFinite(audio.duration)) {
                    audio.currentTime = state.pendingSeek * audio.duration;
                }
                useReproductorStore.getState().clearSeek();
            }
        });

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            unsub();
            /* Tracking final antes de desmontar */
            const state = useReproductorStore.getState();
            if (state.sampleActual && audio.currentTime > 0.5) {
                enviarTrackingReproduccion(state.sampleActual.id, audio.currentTime, false);
            }
            audio.pause();
            audio.src = '';
        };
    }, []);
};
