/*
 * ArtistaDetalleIsland — Kamples
 * Página de detalle de un artista: cabecera, canciones, relaciones (sampleado por / samplea a).
 * Lógica extraída a useArtistaDetalle (SRP).
 */

import { AlertCircle, Music, User, ArrowLeft } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Skeleton, SkeletonFeed } from '@app/components/skeletons';
import { TablaRelaciones } from '@app/components/samples/TablaRelaciones';
import { SeccionRelaciones } from '@app/components/ui/SeccionRelaciones';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useArtistaDetalle } from '@app/hooks/useArtistaDetalle';
import type { Cancion } from '@app/types/cancion';
import '../../styles/componentes/artistaDetalle.css';
import '../../styles/componentes/tablaRelaciones.css';
import '../../styles/componentes/seccionRelaciones.css';

const TABS_ARTISTA = [
    { id: 'canciones', etiqueta: 'Canciones' },
    { id: 'sampleadoPor', etiqueta: 'Sampleado por' },
    { id: 'sampleaA', etiqueta: 'Samplea a' },
];

interface ArtistaDetalleProps {
    slug?: string;
}

export const ArtistaDetalleIsland = ({ slug }: ArtistaDetalleProps): JSX.Element => {
    const { datos, cargando, error, irACancion } = useArtistaDetalle({ slug });
    useTabsIsla('ArtistaDetalleIsland', TABS_ARTISTA, 'canciones');
    const tabActiva = useTabsTopBarStore((s) => s.activa) ?? 'canciones';

    if (cargando) {
        return (
            <div className="artistaDetalleContenedor" id="seccionArtistaDetalle">
                <div className="artistaDetalleCabecera">
                    <Skeleton alto={120} ancho={120} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--espacioSm)' }}>
                        <Skeleton alto={28} ancho={250} />
                        <Skeleton alto={16} ancho={180} />
                    </div>
                </div>
                <SkeletonFeed cantidad={4} />
            </div>
        );
    }

    if (error || !datos) {
        return (
            <div className="artistaDetalleContenedor" id="seccionArtistaDetalle">
                <div className="artistaDetalleError">
                    <AlertCircle size={40} />
                    <p>{error || 'Artista no encontrado.'}</p>
                    <BotonBase variante="ghost" className="botonVolver" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} /> Volver
                    </BotonBase>
                </div>
            </div>
        );
    }

    const { artista, canciones, sampleadoPor, sampleaA, estadisticas } = datos;

    /* QQ83: Imagen del artista — fallback a portada de cualquiera de sus canciones */
    const imagenArtista = artista.imagenUrl
        ?? canciones.find((c: Cancion) => c.imagenUrl)?.imagenUrl
        ?? null;

    return (
        <div className="artistaDetalleContenedor" id="seccionArtistaDetalle">
            {/* Cabecera */}
            <div className="artistaDetalleCabecera">
                <div className="artistaDetalleImagen">
                    {imagenArtista ? (
                        <img src={imagenArtista} alt={artista.nombre} loading="lazy" />
                    ) : (
                        <User size={48} color="var(--textoTerciario)" />
                    )}
                </div>
                <div className="artistaDetalleInfo">
                    <h1 className="artistaDetalleNombre">{artista.nombre}</h1>
                    <div className="artistaDetalleStats">
                        <Badge variante="neutro" tamano="sm">
                            {canciones.length} canciones
                        </Badge>
                        {estadisticas.totalSampleadoPor > 0 && (
                            <Badge variante="neutro" tamano="sm">
                                Sampleado {estadisticas.totalSampleadoPor} veces
                            </Badge>
                        )}
                        {estadisticas.totalSampleaA > 0 && (
                            <Badge variante="neutro" tamano="sm">
                                Samplea a {estadisticas.totalSampleaA}
                            </Badge>
                        )}
                    </div>
                    {estadisticas.generos.length > 0 && (
                        <div className="artistaDetalleGeneros">
                            {estadisticas.generos.map((g) => (
                                <Badge key={g} variante="neutro" tamano="sm">{g}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab: Canciones — tabla estilo TablaRelaciones */}
            {tabActiva === 'canciones' && (
                <div className="artistaDetalleCanciones">
                    {canciones.length === 0 ? (
                        <p className="artistaDetalleSinDatos">Sin canciones registradas.</p>
                    ) : (
                        <table className="tablaRelaciones">
                            <thead>
                                <tr>
                                    <th className="tablaRelacionesColImagen" aria-label="Portada" />
                                    <th className="tablaRelacionesColCancion">Canción</th>
                                    <th className="tablaRelacionesColAnio">Año</th>
                                    <th className="tablaRelacionesColElemento">Género</th>
                                </tr>
                            </thead>
                            <tbody>
                                {canciones.map((c: Cancion) => (
                                    <tr
                                        key={c.id}
                                        className="tablaRelacionesFila"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => irACancion(c.slug)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                irACancion(c.slug);
                                            }
                                        }}
                                    >
                                        <td className="tablaRelacionesColImagen">
                                            {c.imagenUrl ? (
                                                <img
                                                    src={c.imagenUrl}
                                                    alt=""
                                                    className="tablaRelacionesImagen"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="tablaRelacionesImagenVacia">
                                                    <Music size={18} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="tablaRelacionesColCancion">
                                            <span className="tablaRelacionesTitulo">{c.titulo}</span>
                                            {c.album && (
                                                <span className="tablaRelacionesArtista">{c.album}</span>
                                            )}
                                        </td>
                                        <td className="tablaRelacionesColAnio">
                                            {c.anio ?? '—'}
                                        </td>
                                        <td className="tablaRelacionesColElemento">
                                            {c.genero ? (
                                                <Badge variante="neutro" tamano="xs">{c.genero}</Badge>
                                            ) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Tab: Sampleado por */}
            {tabActiva === 'sampleadoPor' && (
                <div className="artistaDetalleRelaciones">
                    {sampleadoPor.length === 0 ? (
                        <p className="artistaDetalleSinDatos">Nadie ha sampleado a este artista (aún).</p>
                    ) : (
                        <SeccionRelaciones
                            titulo={`${artista.nombre} fue sampleado por`}
                            contador={sampleadoPor.length}
                        >
                            <TablaRelaciones relaciones={sampleadoPor} direccion="origen" />
                        </SeccionRelaciones>
                    )}
                </div>
            )}

            {/* Tab: Samplea a */}
            {tabActiva === 'sampleaA' && (
                <div className="artistaDetalleRelaciones">
                    {sampleaA.length === 0 ? (
                        <p className="artistaDetalleSinDatos">Este artista no ha sampleado a otros (registrado).</p>
                    ) : (
                        <SeccionRelaciones
                            titulo={`${artista.nombre} samplea a`}
                            contador={sampleaA.length}
                        >
                            <TablaRelaciones relaciones={sampleaA} direccion="destino" />
                        </SeccionRelaciones>
                    )}
                </div>
            )}
        </div>
    );
};
