/*
 * TablaRelaciones — Kamples
 * Tabla HTML real para listar relaciones de sampling.
 * Cada fila es clickable y navega al detalle del sampleo.
 * Columnas alineadas entre todas las filas gracias a <table>.
 */

import { useState, useRef, useCallback } from 'react';
import { Music, MoreVertical, Edit3, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useNavigationStore } from '@/core/router';
import type { RelacionSample } from '@app/types/cancion';
import { ETIQUETAS_TIPO_ELEMENTO, construirUrlSampleo } from '@app/types/cancion';
import type { RelacionParaEditar } from '@app/hooks/useEdicionRelacion';
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
    /* 'destino': la fila muestra la cancion fuente (de donde samplea).
     * 'origen': la fila muestra la cancion destino (que la sampleó). */
    direccion: 'origen' | 'destino';
    /* Marca la primera fila como el origen de la extraccion del sample */
    marcarOrigen?: boolean;
    /* Callbacks opcionales para editar/reportar relacion (L6.2 wiring) */
    onEditar?: (relacion: RelacionParaEditar) => void;
    onEliminar?: (relacion: RelacionParaEditar) => void;
    /* Callback admin-only para verificar/desverificar relacion */
    onVerificar?: (relacionId: number, verificada: boolean) => void;
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

interface EstadoMenuFila {
    abierto: boolean;
    x: number;
    y: number;
    relId: number;
}

export const TablaRelaciones = ({ relaciones, direccion, marcarOrigen, onEditar, onEliminar, onVerificar }: TablaRelacionesProps): JSX.Element => {
    const navegar = useNavigationStore((s) => s.navegar);
    const hayAcciones = !!onEditar || !!onEliminar || !!onVerificar;
    const [menuFila, setMenuFila] = useState<EstadoMenuFila>({ abierto: false, x: 0, y: 0, relId: -1 });
    const relacionMenuActual = useRef<RelacionSample | null>(null);

    const abrirMenuFila = useCallback((e: React.MouseEvent, rel: RelacionSample) => {
        e.stopPropagation();
        e.preventDefault();
        relacionMenuActual.current = rel;
        setMenuFila({ abierto: true, x: e.clientX, y: e.clientY, relId: rel.id });
    }, []);

    const cerrarMenuFila = useCallback(() => {
        setMenuFila(prev => ({ ...prev, abierto: false }));
    }, []);

    /* Construye un RelacionParaEditar a partir de un RelacionSample */
    const construirRelacionEditable = (rel: RelacionSample): RelacionParaEditar => ({
        id: rel.id,
        tipoRelacion: rel.tipoRelacion ?? 'sample',
        tipoElemento: rel.tipoElemento ?? 'multiple_elements',
        cancionFuente: rel.fuenteTitulo ?? rel.cancionTitulo ?? '?',
        cancionDestino: rel.destinoTitulo ?? rel.cancionTitulo ?? '?',
        timingsFuente: rel.timingsFuente,
        timingsDestino: rel.timingsDestino,
        verificada: rel.verificada,
    });

    return (
        <>
        <table className="tablaRelaciones">
            <thead>
                <tr>
                    <th className="tablaRelacionesColImagen" aria-label="Portada" />
                    <th className="tablaRelacionesColCancion">Canción</th>
                    <th className="tablaRelacionesColAnio">Año</th>
                    <th className="tablaRelacionesColElemento">Elemento</th>
                    <th className="tablaRelacionesColTiming">Timing</th>
                    {hayAcciones && <th className="tablaRelacionesColAcciones" aria-label="Acciones" />}
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
                            onClick={(e) => {
                                if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                                    navegar(urlSampleo(rel, direccion));
                                }
                            }}
                            /* Middle-click abre en nueva pestana via onAuxClick */
                            onAuxClick={(e) => {
                                if (e.button === 1) {
                                    window.open(urlSampleo(rel, direccion), '_blank');
                                }
                            }}
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
                                {rel.contribuidorUsername && (
                                    <span className="tablaRelacionesContribuidor" title="Contribuidor">
                                        @{rel.contribuidorUsername}
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
                            {hayAcciones && (
                                <td className="tablaRelacionesColAcciones">
                                    <BotonBase
                                        variante="ghost"
                                        tamano="ninguno"
                                        className="tablaRelacionesAccionBtn"
                                        aria-label="Acciones"
                                        onClick={(e) => abrirMenuFila(e, rel)}
                                    >
                                        <MoreVertical size={15} />
                                    </BotonBase>
                                </td>
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {hayAcciones && (
            <MenuContextual
                abierto={menuFila.abierto}
                onCerrar={cerrarMenuFila}
                x={menuFila.x}
                y={menuFila.y}
                alinearDerecha
                items={[
                    ...(onVerificar && relacionMenuActual.current ? [{
                        id: 'verificar',
                        etiqueta: relacionMenuActual.current.verificada ? 'Desverificar sampleo' : 'Verificar sampleo',
                        icono: relacionMenuActual.current.verificada
                            ? <ShieldOff size={14} />
                            : <ShieldCheck size={14} />,
                        separadorDespues: true,
                        onClick: () => {
                            if (relacionMenuActual.current) {
                                onVerificar(relacionMenuActual.current.id, !relacionMenuActual.current.verificada);
                            }
                        },
                    }] : []),
                    ...(onEditar ? [{
                        id: 'editar',
                        etiqueta: 'Sugerir corrección',
                        icono: <Edit3 size={14} />,
                        onClick: () => {
                            if (relacionMenuActual.current) onEditar(construirRelacionEditable(relacionMenuActual.current));
                        },
                    }] : []),
                    ...(onEliminar ? [{
                        id: 'eliminar',
                        etiqueta: 'Reportar incorrecta',
                        icono: <Trash2 size={14} />,
                        peligro: true,
                        onClick: () => {
                            if (relacionMenuActual.current) onEliminar(construirRelacionEditable(relacionMenuActual.current));
                        },
                    }] : []),
                ]}
            />
        )}
        </>
    );
};
