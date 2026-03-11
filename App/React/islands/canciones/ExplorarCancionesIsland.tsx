/*
 * ExplorarCancionesIsland — C812
 * Feed vertical de canciones con 3 modos de ordenamiento:
 * Inteligente (heurístico), Top Sampleados, Hot (likes recientes).
 * Infinite scroll, tarjetas horizontales.
 * Lógica extraída a useFeedCanciones (SRP).
 */

import { Music, Sparkles, TrendingUp, Flame } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { SkeletonFeed } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useFeedCanciones } from '@app/hooks/useFeedCanciones';
import { useAuthStore } from '@app/stores/authStore';
import { PanelDevCanciones } from '@app/components/canciones/PanelDevCanciones';
import { TarjetaCancionFeed } from '@app/components/canciones/TarjetaCancionFeed';
import type { OrdenFeedCanciones } from '@app/services/apiCanciones';
import '../../styles/componentes/explorarCanciones.css';

const TABS_EXPLORAR = [{ id: 'canciones', etiqueta: 'Canciones' }];

const ORDENES: { id: OrdenFeedCanciones; etiqueta: string; icono: JSX.Element }[] = [
    { id: 'inteligente', etiqueta: 'Inteligente', icono: <Sparkles size={14} /> },
    { id: 'top_sampleados', etiqueta: 'Top Sampleados', icono: <TrendingUp size={14} /> },
    { id: 'hot', etiqueta: 'Hot', icono: <Flame size={14} /> },
];

export const ExplorarCancionesIsland = (): JSX.Element => {
    const {
        orden,
        canciones,
        cargando,
        cargandoMas,
        hayMas,
        sentinelaRef,
        cambiarOrden,
        irACancion,
    } = useFeedCanciones();

    const esAdmin = useAuthStore(s => s.usuario?.rol === 'admin');

    useTabsIsla('ExplorarCancionesIsland', TABS_EXPLORAR, 'canciones');

    return (
        <div className="feedCancionesContenedor" id="seccionExplorarCanciones">

            {/* Panel de desarrollo — solo visible para admins */}
            {esAdmin && <PanelDevCanciones />}

            {/* Barra de ordenamiento */}
            <div className="feedCancionesOrdenes">
                {ORDENES.map((o) => (
                    <BotonBase
                        key={o.id}
                        variante="ghost"
                        tamano="ninguno"
                        className={`feedCancionesOrden ${orden === o.id ? 'feedCancionesOrdenActivo' : ''}`}
                        onClick={() => cambiarOrden(o.id)}
                    >
                        {o.icono} {o.etiqueta}
                    </BotonBase>
                ))}
            </div>

            {/* Contenido */}
            {cargando ? (
                <SkeletonFeed cantidad={6} />
            ) : canciones.length === 0 ? (
                <div className="feedCancionesVacio">
                    <Music size={40} />
                    <p>No hay canciones para mostrar</p>
                </div>
            ) : (
                <div className="feedCancionesLista">
                    {canciones.map((cancion) => (
                        <TarjetaCancionFeed
                            key={cancion.id}
                            cancion={cancion}
                            onClick={() => irACancion(cancion.slug)}
                        />
                    ))}
                </div>
            )}

            {/* Centinela de infinite scroll */}
            <div ref={sentinelaRef} className="feedCancionesSentinela" aria-hidden="true">
                {cargandoMas && <p className="feedCancionesCargandoMas">Cargando más canciones…</p>}
                {!hayMas && canciones.length > 0 && (
                    <p className="feedCancionesFin">No hay más canciones</p>
                )}
            </div>
        </div>
    );
};
