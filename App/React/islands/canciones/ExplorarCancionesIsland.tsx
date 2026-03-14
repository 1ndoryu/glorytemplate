/*
 * ExplorarCancionesIsland — C812 + QQ50
 * Feed vertical de canciones con 3 modos de ordenamiento via TopBar tabs:
 * Inteligente (heuristico), Top Sampleados, Hot (likes recientes).
 * Infinite scroll, tarjetas tipo TarjetaSample con like + menu + play.
 * Play solo visible cuando la cancion tiene sample adjunto vinculado.
 * Logica extraida a useFeedCanciones (SRP).
 */

import { useCallback } from 'react';
import { Music } from 'lucide-react';
import { SkeletonFeed } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useFeedCanciones } from '@app/hooks/useFeedCanciones';
import { useMenuContextualCancion } from '@app/hooks/useMenuContextualCancion';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { TarjetaCancionFeed } from '@app/components/canciones/TarjetaCancionFeed';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import type { Cancion } from '@app/types/cancion';
import type { SampleResumen } from '@app/types/sample';
import type { OrdenFeedCanciones } from '@app/services/apiCanciones';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import '../../styles/componentes/explorarCanciones.css';

/* Tabs registradas en la TopBar — text-only, ids coinciden con OrdenFeedCanciones */
const TABS_EXPLORAR = [
    { id: 'inteligente', etiqueta: 'Inteligente' },
    { id: 'top_sampleados', etiqueta: 'Top Sampleados' },
    { id: 'hot', etiqueta: 'Hot' },
];

const ORDENES_VALIDAS = new Set<string>(['inteligente', 'top_sampleados', 'hot']);

export const ExplorarCancionesIsland = (): JSX.Element => {
    /* Registrar tabs en TopBar y leer tab activa */
    useTabsIsla('ExplorarCancionesIsland', TABS_EXPLORAR, 'inteligente');
    const tabActiva = useTabsTopBarStore(s => s.activa);
    const busqueda = useFiltrosStore(s => s.busqueda);

    /* Mapear tab activa a orden válida (defensa contra ids inesperados) */
    const orden: OrdenFeedCanciones = ORDENES_VALIDAS.has(tabActiva)
        ? tabActiva as OrdenFeedCanciones
        : 'inteligente';

    const {
        canciones,
        cargando,
        cargandoMas,
        hayMas,
        totalReal,
        sentinelaRef,
        manejarLike,
        irACancion,
        requiereManual,
        cargarMasManual,
    } = useFeedCanciones(orden, busqueda);

    /* Menu contextual de canciones (QQ50) */
    const { estado: menuEstado, items: menuItems, abrirMenu, cerrarMenu } = useMenuContextualCancion();

    /* Reproductor: play/pause del sample adjunto de la cancion */
    const reproducir = useReproductorStore(s => s.reproducir);
    const togglePlay = useReproductorStore(s => s.togglePlay);
    const sampleActualId = useReproductorStore(s => s.sampleActual?.id ?? null);
    const estaReproduciendo = useReproductorStore(s => s.reproduciendo);

    const manejarPlay = useCallback((cancion: Cancion) => {
        const sa = cancion.sampleAdjunto;
        if (!sa) return;

        /*
         * Si el sample adjunto ya esta cargado en el reproductor, toggle play/pause.
         * Si no, reproducir el sample construyendo un SampleResumen minimo.
         */
        if (sampleActualId === sa.id) {
            togglePlay();
            return;
        }

        const sampleParaReproducir: SampleResumen = {
            id: sa.id,
            titulo: sa.titulo,
            slug: sa.slug,
            rutaPreview: sa.rutaPreview,
            rutaWaveform: '',
            imagenUrl: sa.imagenUrl ?? cancion.imagenUrl,
            duracion: sa.duracion,
            tipo: sa.tipo as SampleResumen['tipo'],
            bpm: null,
            key: null,
            escala: null,
            tags: [],
            esPremium: false,
            precio: null,
            totalDescargas: 0,
            totalLikes: 0,
            totalReproducciones: 0,
            metadata: null,
            creador: { id: sa.creadorId, username: '', nombreVisible: '', avatarUrl: null, verificado: false },
        };

        reproducir(sampleParaReproducir);
    }, [sampleActualId, togglePlay, reproducir]);

    return (
        <div className="feedCancionesContenedor" id="seccionExplorarCanciones">

            {/* Contador de canciones — total real del servidor cuando está disponible */}
            {!cargando && canciones.length > 0 && totalReal !== null && (
                <p className="feedCancionesContador">
                    {totalReal.toLocaleString()} {totalReal === 1 ? 'canción' : 'canciones'}
                    {busqueda.trim() && ` para "${busqueda}"`}
                </p>
            )}

            {/* Contenido */}
            {cargando ? (
                <SkeletonFeed cantidad={6} />
            ) : canciones.length === 0 ? (
                <EstadoVacio
                    icono={<Music size={40} />}
                    mensaje={busqueda.trim() ? `Sin resultados para "${busqueda}"` : 'No hay canciones para mostrar'}
                />
            ) : (
                <div className="feedCancionesLista">
                    {canciones.map((cancion) => (
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

            {/* Centinela de infinite scroll */}
            {!requiereManual && (
                <div ref={sentinelaRef} className="feedCancionesSentinela" aria-hidden="true">
                    {cargandoMas && <p className="feedCancionesCargandoMas">Cargando más canciones…</p>}
                    {!hayMas && canciones.length > 0 && (
                        <p className="feedCancionesFin">No hay más canciones</p>
                    )}
                </div>
            )}

            {/* Botón manual cuando el throttle excede maxAutoCarga */}
            {requiereManual && (
                <div className="feedCancionesBotonManual">
                    <button type="button" className="feedCancionesCargarMas" onClick={cargarMasManual}>
                        Cargar más canciones
                    </button>
                </div>
            )}

            {/* Menu contextual de canciones */}
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
