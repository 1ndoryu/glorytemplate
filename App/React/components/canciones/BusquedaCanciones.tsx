/*
 * BusquedaCanciones — QK18/QK22
 * Vista de resultados de busqueda de canciones.
 * Extraido de ExplorarCancionesIsland al separar busqueda de secciones.
 * Mantiene el diseno de lista larga con TarjetaCancionFeed.
 */

import { useCallback } from 'react';
import { Music } from 'lucide-react';
import { SkeletonFeed } from '@app/components/skeletons';
import { useFeedCanciones } from '@app/hooks/useFeedCanciones';
import { useMenuContextualCancion } from '@app/hooks/useMenuContextualCancion';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { construirSampleDesdeCancion } from '@app/utils/construirSampleDesdeCancion';
import { TarjetaCancionFeed } from '@app/components/canciones/TarjetaCancionFeed';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import type { Cancion } from '@app/types/cancion';
import '../../styles/componentes/explorarCanciones.css';

interface Props {
    busqueda: string;
}

export const BusquedaCanciones = ({ busqueda }: Props): JSX.Element => {
    const {
        canciones,
        cargando,
        totalReal,
        manejarLike,
        irACancion,
    } = useFeedCanciones('inteligente', busqueda);

    const { estado: menuEstado, items: menuItems, abrirMenu, cerrarMenu } = useMenuContextualCancion();

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

    return (
        <div className="feedCancionesContenedor" id="seccionExplorarCanciones">
            {!cargando && canciones.length > 0 && totalReal !== null && (
                <p className="feedCancionesContador">
                    {totalReal.toLocaleString()} {totalReal === 1 ? 'canción' : 'canciones'}
                    {` para "${busqueda}"`}
                </p>
            )}

            {cargando ? (
                <SkeletonFeed cantidad={6} />
            ) : canciones.length === 0 ? (
                <EstadoVacio
                    icono={<Music size={40} />}
                    mensaje={`Sin resultados para "${busqueda}"`}
                />
            ) : (
                <div className="feedCancionesLista">
                    {canciones.map(cancion => (
                        <TarjetaCancionFeed
                            key={cancion.id}
                            cancion={cancion}
                            onClick={() => irACancion(cancion.slug)}
                            onLike={manejarLike}
                            onMenu={abrirMenu}
                            onPlay={manejarPlay}
                            reproduciendo={
                                !!cancion.sampleAdjunto
                                && sampleActualId === cancion.sampleAdjunto.id
                                && estaReproduciendo
                            }
                        />
                    ))}
                </div>
            )}

            <MenuContextual
                abierto={menuEstado.abierto}
                onCerrar={cerrarMenu}
                items={menuItems}
                x={menuEstado.x}
                y={menuEstado.y}
            />
        </div>
    );
};
