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
import { ETIQUETAS_TIPO_ELEMENTO } from '@app/types/cancion';
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
}

export const TablaRelaciones = ({ relaciones, direccion }: TablaRelacionesProps): JSX.Element => {
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
                {relaciones.map((rel) => {
                    const timings = direccion === 'destino'
                        ? rel.timingsDestino
                        : rel.timingsFuente;

                    return (
                        <tr
                            key={rel.id}
                            className="tablaRelacionesFila"
                            role="button"
                            tabIndex={0}
                            onClick={() => navegar(`/sampleo/${rel.id}`)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    navegar(`/sampleo/${rel.id}`);
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
