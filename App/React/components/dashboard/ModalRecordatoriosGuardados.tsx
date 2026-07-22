/*
 * ModalRecordatoriosGuardados
 * Replica exacta de ModalNotasGuardadas adaptada para recordatorios.
 * Reutiliza los mismos CSS classes: modalNotasContenedor, modalNotasGuardadas,
 * modalNotasGrid, modalNotasItem, etc.
 */

import {useCallback} from 'react';
import {Bell, Trash2, Image} from 'lucide-react';
import {Modal} from '../shared';
import {Boton} from '../ui';
import {useRecordatoriosStore} from '../../stores/recordatoriosStore';
import type {Recordatorio} from '../../types/recordatorios';

interface ModalRecordatoriosGuardadosProps {
    abierto: boolean;
    onCerrar: () => void;
    onSeleccionar?: (recordatorio: Recordatorio) => void;
}

export function ModalRecordatoriosGuardados({abierto, onCerrar, onSeleccionar}: ModalRecordatoriosGuardadosProps): JSX.Element | null {
    const recordatorios = useRecordatoriosStore(s => s.recordatorios);
    const eliminar = useRecordatoriosStore(s => s.eliminar);

    const manejarSeleccionar = useCallback((r: Recordatorio) => {
        onSeleccionar?.(r);
        onCerrar();
    }, [onSeleccionar, onCerrar]);

    const manejarEliminar = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        eliminar(id);
    }, [eliminar]);

    if (!abierto) return null;

    return (
        <Modal estaAbierto={abierto} titulo="Recordatorios guardados" onCerrar={onCerrar} claseExtra="modalNotasContenedor">
            <div className="modalNotasGuardadas">
                {/* Grid de recordatorios - misma estructura que ListaNotasGuardadas modo grid */}
                <div className="modalNotasGrid">
                    {recordatorios.length === 0 ? (
                        <div className="modalNotasVacio">
                            <Bell size={32} />
                            <span>No tienes recordatorios guardados</span>
                            <p>Crea recordatorios desde el panel usando el botón +</p>
                        </div>
                    ) : (
                        recordatorios.map(r => (
                            <div key={r.id} className="modalNotasItem" onClick={() => manejarSeleccionar(r)}>
                                <Boton
                                    claseAdicional="modalNotasItemEliminar"
                                    onClick={e => manejarEliminar(e, r.id)}
                                    title="Eliminar recordatorio"
                                >
                                    <Trash2 size={14} />
                                </Boton>
                                <div className="modalNotasItemContenido">
                                    {/* Imágenes como preview si las hay */}
                                    {r.adjuntos.length > 0 && (
                                        <div className="recordatorioCardImagenes">
                                            {r.adjuntos.slice(0, 3).map((adj, i) => (
                                                <div key={adj.id ?? i} className="recordatorioCardImagen">
                                                    <img src={adj.thumbnailUrl || adj.url} alt={adj.nombre} />
                                                </div>
                                            ))}
                                            {r.adjuntos.length > 3 && (
                                                <div className="recordatorioCardImagenMas">
                                                    +{r.adjuntos.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* Texto o indicador de imagen */}
                                    <div className="modalNotasItemTitulo">
                                        {r.texto || (r.adjuntos.length > 0 ? `${r.adjuntos.length} imagen${r.adjuntos.length > 1 ? 'es' : ''}` : 'Sin contenido')}
                                    </div>
                                    {r.texto && r.adjuntos.length > 0 && (
                                        <div className="modalNotasItemPreview">
                                            <Image size={10} /> {r.adjuntos.length} imagen{r.adjuntos.length > 1 ? 'es' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>


            </div>
        </Modal>
    );
}
