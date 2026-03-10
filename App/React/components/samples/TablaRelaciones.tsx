/*
 * TablaRelaciones — Kamples
 * Tabla HTML real para listar relaciones de sampling.
 * Cada fila es clickable y navega al detalle del sampleo.
 * Columnas alineadas entre todas las filas gracias a <table>.
 */

import { Music } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { useNavigationStore } from '@/core/router';
import type { RelacionSample } from '@app/types/cancion';
import { ETIQUETAS_TIPO_ELEMENTO, construirUrlSampleo } from '@app/types/cancion';
import '../../styles/componentes/tablaRelaciones.css';

const formatearTimings = (timings: number[]): string => {
    if (!timings || timings.length === 0) return '—';
    return timings
        .map((t) => {
            const min = Math.floor(t / 60);
            const seg = t % 60;
            return `${min}:${String(seg).padStart(2, '0')}`;
        })
        .join(', ');
};

interface TablaRelacionesProps {
    relaciones: RelacionSample[];
    /* 'destino': la fila muestra la canción fuente (de donde samplea).
     * 'origen': la fila muestra la canción destino (que la sampleó). */
    direccion: 'origen' | 'destino';
    /* Marca la primera fila como el origen de la extracción del sample */
    marcarOrigen?: boolean;
}

/*
 * Construye URL SEO correcta para un sampleo.
 * Si la relación tiene datos de ambos lados (enriquecida), genera URL completa.
 * Si solo tiene un lado (lista simple), usa el lado disponible según dirección.
 */
const urlSampleo = (rel: RelacionSample, direccion: 'origen' | 'destino'): string => {
    if (rel.destinoArtista || rel.fuenteArtista) {
        return construirUrlSampleo(rel.id, rel.destinoArtista, rel.destinoTitulo, rel.fuenteArtista, rel.fuenteTitulo);
    }
    /* Fallback: datos de un solo lado en la posición correcta */
    if (direccion === 'destino') {
        return construirUrlSampleo(rel.id, undefined, undefined, rel.artistaNombre, rel.cancionTitulo);
    }
    return construirUrlSampleo(rel.id, rel.artistaNombre, rel.cancionTitulo);
};

export const TablaRelaciones = ({ relaciones, direccion, marcarOrigen }: TablaRelacionesProps): JSX.Element => {
    const navegar = useNavigationStore((s) => s.navegar);

    return (
        <table className="tablaRelaciones">
            <thead>
                <tr>
                    <th className="tablaRelacionesColImagen" aria-label="Portada" />
                    <th className="tablaRelacionesColCancion">Canción</th>
                    <th className="tablaRelacionesColAnio">Año</th>
                    <th className="tablaRelacionesColElemento">Elemento</th>
                    <th className="tablaRelacionesColTiming">Timing</th>
                </tr>
            </thead>
            <tbody>
                {relaciones.map((rel, idx) => {
                    const timings = direccion === 'destino'
                        ? rel.timingsDestino
                        : rel.timingsFuente;
                    const esOrigenFila = marcarOrigen && idx === 0;

                    return (
                        <tr
                            key={rel.id}
                            className={`tablaRelacionesFila${esOrigenFila ? ' tablaRelacionesFilaOrigen' : ''}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => navegar(urlSampleo(rel, direccion))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    navegar(urlSampleo(rel, direccion));
                                }
                            }}
                        >
                            <td className="tablaRelacionesColImagen">
                                {rel.cancionImagenUrl ? (
                                    <img
                                        src={rel.cancionImagenUrl}
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
                                <span className="tablaRelacionesTitulo">
                                    {esOrigenFila && (
                                        <span className="tablaRelacionesOrigenMarker" title="Sample extraído de esta canción">●</span>
                                    )}
                                    {rel.cancionTitulo ?? '—'}
                                </span>
                                {rel.artistaNombre && (
                                    <span className="tablaRelacionesArtista">
                                        {rel.artistaNombre}
                                    </span>
                                )}
                            </td>
                            <td className="tablaRelacionesColAnio">
                                {rel.cancionAnio ?? '—'}
                            </td>
                            <td className="tablaRelacionesColElemento">
                                {rel.tipoElemento ? (
                                    <Badge variante="neutro" tamano="xs">
                                        {ETIQUETAS_TIPO_ELEMENTO[rel.tipoElemento]}
                                    </Badge>
                                ) : '—'}
                            </td>
                            <td className="tablaRelacionesColTiming">
                                {formatearTimings(timings)}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
