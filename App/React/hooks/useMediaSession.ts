/*
 * Hook: useMediaSession — Kamples (QL17)
 * Integra navigator.mediaSession con reproductorStore.
 * Muestra metadatos (titulo, artista, portada) en la notificacion de
 * Android / controles de lock screen / picture-in-picture del sistema.
 * Similar a como Spotify muestra el "now playing" en la barra de notificaciones.
 *
 * Se monta una vez en LayoutPrincipal junto a useMotorAudio.
 */

import { useEffect } from 'react';
import { useReproductorStore } from '@app/stores/reproductorStore';

/* Verificar soporte de MediaSession (no disponible en SSR ni todos los navegadores) */
const mediaSessionDisponible = (): boolean =>
    typeof navigator !== 'undefined' && 'mediaSession' in navigator;

export const useMediaSession = (): void => {
    useEffect(() => {
        if (!mediaSessionDisponible()) return;

        const session = navigator.mediaSession;

        /* Registrar action handlers — controles de la notificacion del sistema */
        session.setActionHandler('play', () => {
            useReproductorStore.getState().play();
        });
        session.setActionHandler('pause', () => {
            useReproductorStore.getState().pause();
        });
        session.setActionHandler('previoustrack', () => {
            useReproductorStore.getState().anterior();
        });
        session.setActionHandler('nexttrack', () => {
            useReproductorStore.getState().siguiente();
        });

        /* Suscribirse a cambios del store para actualizar metadatos */
        const unsub = useReproductorStore.subscribe((state, prevState) => {
            /* Actualizar playbackState cuando cambia reproduccion */
            if (state.reproduciendo !== prevState.reproduciendo) {
                session.playbackState = state.reproduciendo ? 'playing' : 'paused';
            }

            /* Actualizar metadata cuando cambia el sample */
            if (state.sampleActual?.id !== prevState.sampleActual?.id) {
                if (!state.sampleActual) {
                    session.metadata = null;
                    session.playbackState = 'none';
                    return;
                }

                const { titulo, imagenUrl, creador } = state.sampleActual;
                const artista = creador?.username ?? 'Kamples';

                /* Construir artwork array. MediaSession acepta multiples tamanos. */
                const artwork: MediaImage[] = [];
                if (imagenUrl) {
                    artwork.push(
                        { src: imagenUrl, sizes: '96x96', type: 'image/jpeg' },
                        { src: imagenUrl, sizes: '128x128', type: 'image/jpeg' },
                        { src: imagenUrl, sizes: '256x256', type: 'image/jpeg' },
                        { src: imagenUrl, sizes: '512x512', type: 'image/jpeg' },
                    );
                }

                session.metadata = new MediaMetadata({
                    title: titulo,
                    artist: artista,
                    album: 'Kamples',
                    artwork,
                });

                session.playbackState = state.reproduciendo ? 'playing' : 'paused';
            }
        });

        /* Estado inicial por si ya habia algo reproduciendose */
        const estadoInicial = useReproductorStore.getState();
        if (estadoInicial.sampleActual) {
            const { titulo, imagenUrl, creador } = estadoInicial.sampleActual;
            const artwork: MediaImage[] = [];
            if (imagenUrl) {
                artwork.push(
                    { src: imagenUrl, sizes: '96x96', type: 'image/jpeg' },
                    { src: imagenUrl, sizes: '256x256', type: 'image/jpeg' },
                    { src: imagenUrl, sizes: '512x512', type: 'image/jpeg' },
                );
            }
            session.metadata = new MediaMetadata({
                title: titulo,
                artist: creador?.username ?? 'Kamples',
                album: 'Kamples',
                artwork,
            });
            session.playbackState = estadoInicial.reproduciendo ? 'playing' : 'paused';
        }

        return () => {
            unsub();
            session.setActionHandler('play', null);
            session.setActionHandler('pause', null);
            session.setActionHandler('previoustrack', null);
            session.setActionHandler('nexttrack', null);
        };
    }, []);
};
