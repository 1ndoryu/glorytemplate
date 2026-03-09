/*
 * ExplorarCancionesIsland — Kamples
 * Página de exploración de canciones: recientes, top sampleadas, búsqueda.
 * Lógica extraída a useExplorarCanciones (SRP).
 */

import { useState, useCallback } from 'react';
import { Search, Music, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { SkeletonFeed } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useExplorarCanciones } from '@app/hooks/useExplorarCanciones';
import type { TabExplorar } from '@app/hooks/useExplorarCanciones';
import type { CancionResumen } from '@app/types/cancion';
import '../../styles/componentes/explorarCanciones.css';

const TABS_EXPLORAR = [{ id: 'canciones', etiqueta: 'Canciones' }];

const TABS_INTERNAS: { id: TabExplorar; etiqueta: string; icono: JSX.Element }[] = [
    { id: 'recientes', etiqueta: 'Recientes', icono: <Clock size={14} /> },
    { id: 'top', etiqueta: 'Más sampleadas', icono: <TrendingUp size={14} /> },
    { id: 'buscar', etiqueta: 'Buscar', icono: <Search size={14} /> },
];

/* Tarjeta compacta de canción para el grid */
const TarjetaCancionGrid = ({
    cancion,
    onClick,
}: {
    cancion: CancionResumen;
    onClick: () => void;
}): JSX.Element => (
    <div
        className="tarjetaCancion"
        role="article"
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
        tabIndex={0}
    >
        <div className="tarjetaCancionImagen">
            {cancion.imagenUrl ? (
                <img src={cancion.imagenUrl} alt={cancion.titulo} loading="lazy" />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Music size={32} color="var(--textoTerciario)" />
                </div>
            )}
        </div>
        <div className="tarjetaCancionCuerpo">
            <h3 className="tarjetaCancionTitulo">{cancion.titulo}</h3>
            {cancion.artistaNombre && (
                <p className="tarjetaCancionArtista">{cancion.artistaNombre}</p>
            )}
            {cancion.anio && (
                <span className="tarjetaCancionAnio">{cancion.anio}</span>
            )}
        </div>
        <div className="tarjetaCancionBadges">
            {cancion.totalSampleada > 0 && (
                <Badge variante="acento" tamano="xs">
                    {cancion.totalSampleada} sample{cancion.totalSampleada !== 1 ? 's' : ''}
                </Badge>
            )}
            {cancion.genero && (
                <Badge variante="neutro" tamano="xs">{cancion.genero}</Badge>
            )}
        </div>
    </div>
);

export const ExplorarCancionesIsland = (): JSX.Element => {
    const {
        tabActiva,
        canciones,
        estadisticas,
        cargando,
        error,
        queryBusqueda,
        cambiarTab,
        ejecutarBusqueda,
        irACancion,
    } = useExplorarCanciones();

    const [inputBusqueda, setInputBusqueda] = useState(queryBusqueda);

    useTabsIsla('ExplorarCancionesIsland', TABS_EXPLORAR, 'canciones');

    const handleBuscar = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        ejecutarBusqueda(inputBusqueda);
    }, [inputBusqueda, ejecutarBusqueda]);

    return (
        <div className="explorarCancionesContenedor" id="seccionExplorarCanciones">

            {/* Estadísticas resumen */}
            {estadisticas && Array.isArray(estadisticas.relacionesPorTipo) && estadisticas.relacionesPorTipo.length > 0 && (
                <div className="explorarCancionesEstadisticas">
                    {estadisticas.relacionesPorTipo.map((stat) => (
                        <div key={stat.tipoRelacion} className="explorarCancionesEstadistica">
                            <span className="explorarCancionesEstadisticaValor">{stat.total}</span>
                            <span className="explorarCancionesEstadisticaEtiqueta">{stat.tipoRelacion}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Barra de búsqueda */}
            <form className="explorarCancionesBusqueda" onSubmit={handleBuscar}>
                <CampoTexto
                    variante="desnudo"
                    className="explorarCancionesBusquedaCampo"
                    type="text"
                    placeholder="Buscar canción o artista..."
                    value={inputBusqueda}
                    onChange={(e) => setInputBusqueda(e.target.value as unknown as string)}
                />
                <BotonBase type="submit" variante="ghost" tamano="ninguno" style={{ display: 'none' }} aria-hidden="true" />
            </form>

            {/* Tabs internas */}
            <div className="explorarCancionesTabs">
                {TABS_INTERNAS.map((tab) => (
                    <BotonBase
                        key={tab.id}
                        variante="ghost"
                        tamano="ninguno"
                        className={`explorarCancionesTab ${tabActiva === tab.id ? 'explorarCancionesTabActiva' : ''}`}
                        onClick={() => cambiarTab(tab.id)}
                    >
                        {tab.icono} {tab.etiqueta}
                    </BotonBase>
                ))}
            </div>

            {/* Contenido */}
            {cargando ? (
                <SkeletonFeed cantidad={6} />
            ) : error ? (
                <div className="explorarCancionesVacio">
                    <p>{error}</p>
                </div>
            ) : canciones.length === 0 ? (
                <div className="explorarCancionesVacio">
                    <Music size={40} />
                    <p>
                        {tabActiva === 'buscar' && queryBusqueda
                            ? `Sin resultados para "${queryBusqueda}"`
                            : 'No hay canciones para mostrar'
                        }
                    </p>
                </div>
            ) : (
                <div className="explorarCancionesGrid">
                    {canciones.map((cancion) => (
                        <TarjetaCancionGrid
                            key={cancion.id}
                            cancion={cancion}
                            onClick={() => irACancion(cancion.slug)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
