/*
 * ModalNotasGuardadas
 * Modal para ver, buscar y seleccionar notas guardadas del Scratchpad
 * Responsabilidad única: listar notas y permitir su selección/eliminación
 */

import {useState, useEffect, useCallback} from 'react';
import {Search, Trash2, Clock, FileText, Loader, AlertCircle} from 'lucide-react';
import {Modal} from '../shared';
import {useNotas} from '../../hooks';
import type {Nota} from '../../hooks';
import {formatearFechaRelativa} from '../../utils/fecha';

interface ModalNotasGuardadasProps {
    abierto: boolean;
    onCerrar: () => void;
    onSeleccionarNota: (nota: Nota) => void;
}

export function ModalNotasGuardadas({abierto, onCerrar, onSeleccionarNota}: ModalNotasGuardadasProps): JSX.Element | null {
    const {estado, cargarNotas, eliminarNota, buscarNotas} = useNotas();
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState<Nota[] | null>(null);
    const [buscando, setBuscando] = useState(false);
    const [notaAEliminar, setNotaAEliminar] = useState<number | null>(null);

    /* Cargar notas cuando se abre el modal */
    useEffect(() => {
        if (abierto) {
            cargarNotas();
            setTerminoBusqueda('');
            setResultadosBusqueda(null);
        }
    }, [abierto, cargarNotas]);

    /* Debounce para búsqueda */
    useEffect(() => {
        if (!terminoBusqueda.trim()) {
            setResultadosBusqueda(null);
            return;
        }

        const timeout = setTimeout(async () => {
            setBuscando(true);
            const resultados = await buscarNotas(terminoBusqueda);
            setResultadosBusqueda(resultados);
            setBuscando(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [terminoBusqueda, buscarNotas]);

    const manejarSeleccionar = useCallback(
        (nota: Nota) => {
            onSeleccionarNota(nota);
            onCerrar();
        },
        [onSeleccionarNota, onCerrar]
    );

    const manejarEliminar = useCallback(
        async (e: React.MouseEvent, notaId: number) => {
            e.stopPropagation();
            setNotaAEliminar(notaId);
            const exito = await eliminarNota(notaId);
            if (exito) {
                setNotaAEliminar(null);
            }
        },
        [eliminarNota]
    );

    const notasMostrar = resultadosBusqueda ?? estado.notas;

    if (!abierto) return null;

    return (
        <Modal estaAbierto={abierto} titulo="Notas Guardadas" onCerrar={onCerrar} claseExtra="modalNotasContenedor">
            <div id="modal-notas-guardadas" className="modalNotasGuardadas">
                {/* Barra de búsqueda */}
                <div className="modalNotasBusqueda">
                    <Search size={14} className="modalNotasBusquedaIcono" />
                    <input type="text" className="modalNotasBusquedaInput" placeholder="Buscar notas..." value={terminoBusqueda} onChange={e => setTerminoBusqueda(e.target.value)} autoFocus />
                    {buscando && <Loader size={14} className="modalNotasBusquedaLoader animacionGirar" />}
                </div>

                {/* Grid de notas */}
                <div className="modalNotasGrid">
                    {estado.cargando && !estado.notas.length ? (
                        <div className="modalNotasVacio">
                            <Loader size={24} className="animacionGirar" />
                            <span>Cargando notas...</span>
                        </div>
                    ) : estado.error ? (
                        <div className="modalNotasError">
                            <AlertCircle size={24} />
                            <span>{estado.error}</span>
                        </div>
                    ) : notasMostrar.length === 0 ? (
                        <div className="modalNotasVacio">
                            <FileText size={32} />
                            <span>{terminoBusqueda ? 'No se encontraron notas' : 'No tienes notas guardadas'}</span>
                            {!terminoBusqueda && <p>Guarda notas desde el Scratchpad usando el botón de guardar</p>}
                        </div>
                    ) : (
                        notasMostrar.map(nota => (
                            <div key={nota.id} className={`modalNotasItem ${notaAEliminar === nota.id ? 'modalNotasItemEliminando' : ''}`} onClick={() => manejarSeleccionar(nota)}>
                                <button className="modalNotasItemEliminar" onClick={e => manejarEliminar(e, nota.id)} title="Eliminar nota" disabled={notaAEliminar === nota.id}>
                                    {notaAEliminar === nota.id ? <Loader size={14} className="animacionGirar" /> : <Trash2 size={14} />}
                                </button>
                                <div className="modalNotasItemContenido">
                                    <div className="modalNotasItemTitulo">{nota.titulo}</div>
                                    <div className="modalNotasItemPreview">
                                        {nota.contenido.slice(0, 150)}
                                        {nota.contenido.length > 150 ? '...' : ''}
                                    </div>
                                    <div className="modalNotasItemFecha">
                                        <Clock size={10} />
                                        <span>{formatearFechaRelativa(nota.fechaModificacion)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer con contador */}
                {notasMostrar.length > 0 && (
                    <div className="modalNotasFooter">
                        <span>{resultadosBusqueda ? `${resultadosBusqueda.length} resultados` : `${estado.total} nota${estado.total !== 1 ? 's' : ''} guardada${estado.total !== 1 ? 's' : ''}`}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
