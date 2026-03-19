/*
 * Componente: ModalAdjuntarContenido — Kamples (183A-110-C)
 * Modal de búsqueda para adjuntar samples o colecciones a un artículo.
 * Similar a ResultadosBusquedaRapidaDropdown pero en formato modal.
 * Lógica en useModalAdjuntarContenido (SRP).
 */

import { Disc3, FolderOpen, Check, Loader2 } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { Input } from '@app/components/ui/Input';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useModalAdjuntarContenido } from '@app/hooks/useModalAdjuntarContenido';
import type { AdjuntoArticulo } from '@app/types';
import '@app/styles/componentes/modalArticulo.css';

interface ModalAdjuntarContenidoProps {
    abierto: boolean;
    onCerrar: () => void;
    adjuntosActuales: AdjuntoArticulo[];
    onAdjuntar: (adjunto: AdjuntoArticulo) => void;
}

export const ModalAdjuntarContenido = ({
    abierto,
    onCerrar,
    adjuntosActuales,
    onAdjuntar,
}: ModalAdjuntarContenidoProps): JSX.Element | null => {
    const {
        query, setQuery,
        samples, colecciones,
        cargando, sinResultados,
        estaAdjunto, adjuntarSample, adjuntarColeccion,
    } = useModalAdjuntarContenido({ abierto, adjuntosActuales, onAdjuntar });

    if (!abierto) return null;

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="normal">
            <div className="adjuntarModalBusqueda">
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar samples o colecciones..."
                    autoFocus
                />
            </div>

            <div className="adjuntarModalResultados">
                {cargando && (
                    <div className="adjuntarModalCargando">
                        <Loader2 size={20} className="adjuntarModalSpinner" />
                    </div>
                )}

                {sinResultados && (
                    <div className="adjuntarModalVacio">Sin resultados</div>
                )}

                {samples.map(s => {
                    const yaAdjunto = estaAdjunto('sample', s.id);
                    return (
                        <BotonBase
                            key={`s-${s.id}`}
                            variante="ghost"
                            tamano="ninguno"
                            className="adjuntarModalItem"
                            onClick={() => !yaAdjunto && adjuntarSample(s)}
                            type="button"
                            disabled={yaAdjunto}
                        >
                            {s.imagenUrl ? (
                                <img className="adjuntarModalItemImg" src={s.imagenUrl} alt={s.titulo} loading="lazy" />
                            ) : (
                                <div className="adjuntarModalItemIcono"><Disc3 size={16} /></div>
                            )}
                            <div className="adjuntarModalItemInfo">
                                <span className="adjuntarModalItemTitulo">{s.titulo}</span>
                                <span className="adjuntarModalItemSub">por {s.creador.nombreVisible}</span>
                            </div>
                            {yaAdjunto && <Check size={16} className="adjuntarModalItemCheck" />}
                        </BotonBase>
                    );
                })}

                {colecciones.map(c => {
                    const yaAdjunto = estaAdjunto('coleccion', c.id);
                    return (
                        <BotonBase
                            key={`c-${c.id}`}
                            variante="ghost"
                            tamano="ninguno"
                            className="adjuntarModalItem"
                            onClick={() => !yaAdjunto && adjuntarColeccion(c)}
                            type="button"
                            disabled={yaAdjunto}
                        >
                            {c.portadaUrl ? (
                                <img className="adjuntarModalItemImg" src={c.portadaUrl} alt={c.nombre} loading="lazy" />
                            ) : (
                                <div className="adjuntarModalItemIcono"><FolderOpen size={16} /></div>
                            )}
                            <div className="adjuntarModalItemInfo">
                                <span className="adjuntarModalItemTitulo">{c.nombre}</span>
                                <span className="adjuntarModalItemSub">{c.creador} · {c.totalSamples} samples</span>
                            </div>
                            {yaAdjunto && <Check size={16} className="adjuntarModalItemCheck" />}
                        </BotonBase>
                    );
                })}
            </div>
        </Modal>
    );
};

export default ModalAdjuntarContenido;
