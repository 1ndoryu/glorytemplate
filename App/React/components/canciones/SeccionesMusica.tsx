/*
 * SeccionesMusica — QK18/QK22
 * Vista principal de la pagina de musica con secciones horizontales estilo Spotify.
 * Renderiza secciones de canciones (TarjetaCancionGrande) y artistas (TarjetaArtista).
 * Logica de reproduccion delegada al reproductor store + utilidad compartida.
 */

import { useCallback } from 'react';
import { useSeccionesCanciones } from '@app/hooks/useSeccionesCanciones';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useNavigationStore } from '@/core/router';
import { construirSampleDesdeCancion } from '@app/utils/construirSampleDesdeCancion';
import { SeccionHorizontal } from './SeccionHorizontal';
import { TarjetaCancionGrande } from './TarjetaCancionGrande';
import { TarjetaArtista } from './TarjetaArtista';
import { SkeletonFeed } from '@app/components/skeletons';
import type { Cancion } from '@app/types/cancion';
import '../../styles/componentes/musicaExplorar.css';
import '../../styles/componentes/tarjetaCancionGrande.css';

export const SeccionesMusica = (): JSX.Element => {
    const { secciones, cargando, manejarLike } = useSeccionesCanciones();
    const navegar = useNavigationStore(s => s.navegar);

    const reproducir = useReproductorStore(s => s.reproducir);
    const togglePlay = useReproductorStore(s => s.togglePlay);
    const sampleActualId = useReproductorStore(s => s.sampleActual?.id ?? null);
    const estaReproduciendo = useReproductorStore(s => s.reproduciendo);

    const manejarPlay = useCallback((cancion: Cancion) => {
        const sample = construirSampleDesdeCancion(cancion);
        if (!sample) return;
        if (sampleActualId === sample.id) { togglePlay(); return; }
        reproducir(sample);
    }, [sampleActualId, togglePlay, reproducir]);

    const irACancion = useCallback((slug: string) => navegar(`/cancion/${slug}`), [navegar]);
    const irAArtista = useCallback((slug: string) => navegar(`/artista/${slug}`), [navegar]);

    if (cargando) return <SkeletonFeed cantidad={6} />;

    return (
        <div className="musicaExplorarContenedor" id="seccionExplorarCanciones">
            {secciones.map((seccion, idx) => (
                <SeccionHorizontal key={`${seccion.tipo}-${idx}`} titulo={seccion.titulo}>
                    {seccion.tipo === 'artistas' && seccion.artistas ? (
                        seccion.artistas.map(artista => (
                            <TarjetaArtista
                                key={artista.id}
                                artista={artista}
                                onClick={() => irAArtista(artista.slug)}
                            />
                        ))
                    ) : seccion.canciones ? (
                        seccion.canciones.map(cancion => (
                            <TarjetaCancionGrande
                                key={cancion.id}
                                cancion={cancion}
                                onClick={() => irACancion(cancion.slug)}
                                onLike={manejarLike}
                                onPlay={manejarPlay}
                                reproduciendo={
                                    !!cancion.sampleAdjunto
                                    && sampleActualId === cancion.sampleAdjunto.id
                                    && estaReproduciendo
                                }
                            />
                        ))
                    ) : null}
                </SeccionHorizontal>
            ))}
        </div>
    );
};
