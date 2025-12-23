/*
 * ModalCompartir
 * Modal para compartir un elemento (tarea, proyecto o hábito)
 * con miembros del equipo
 */

import {useState, useCallback, useEffect} from 'react';
import {Share2, AlertTriangle, UserPlus, Users, Loader2} from 'lucide-react';
import {Modal} from '../shared/Modal';
import {SelectorCompaneros} from './SelectorCompaneros';
import {ListaParticipantes} from './ListaParticipantes';
import type {TipoElementoCompartido, RolCompartido, CompaneroEquipo, Participante} from '../../types/dashboard';

interface ModalCompartirProps {
    visible: boolean;
    onCerrar: () => void;
    tipo: TipoElementoCompartido;
    elementoId: number;
    elementoNombre: string;
    companeros: CompaneroEquipo[];
    participantes: Participante[];
    cifradoActivo?: boolean;
    onCompartir: (usuarioId: number, rol: RolCompartido) => Promise<boolean>;
    onCambiarRol: (compartidoId: number, nuevoRol: RolCompartido) => Promise<boolean>;
    onDejarDeCompartir: (compartidoId: number) => Promise<boolean>;
    cargandoParticipantes?: boolean;
}

export function ModalCompartir({visible, onCerrar, tipo, elementoId, elementoNombre, companeros, participantes, cifradoActivo = false, onCompartir, onCambiarRol, onDejarDeCompartir, cargandoParticipantes = false}: ModalCompartirProps): JSX.Element | null {
    const [companeroSeleccionado, setCompaneroSeleccionado] = useState<number | null>(null);
    const [rolSeleccionado, setRolSeleccionado] = useState<RolCompartido>('colaborador');
    const [compartiendo, setCompartiendo] = useState(false);
    const [mostroAdvertencia, setMostroAdvertencia] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Obtener texto del tipo */
    const tipoTexto = tipo === 'tarea' ? 'tarea' : tipo === 'proyecto' ? 'proyecto' : 'hábito';
    const tipoTextoMayus = tipo === 'tarea' ? 'Tarea' : tipo === 'proyecto' ? 'Proyecto' : 'Hábito';

    /* Filtrar compañeros que ya tienen acceso */
    const companerosDisponibles = companeros.filter(c => !participantes.some(p => p.usuarioId === c.companeroId));

    /* Determinar si soy el propietario */
    const esPropietario = participantes.some(p => p.esPropietario && p.usuarioId === participantes[0]?.usuarioId);

    /* Limpiar estado al cerrar */
    useEffect(() => {
        if (!visible) {
            setCompaneroSeleccionado(null);
            setRolSeleccionado('colaborador');
            setMostroAdvertencia(false);
            setError(null);
        }
    }, [visible]);

    /* Manejar compartir */
    const manejarCompartir = useCallback(async () => {
        if (!companeroSeleccionado) return;

        /* Si hay cifrado activo y no se ha mostrado advertencia */
        if (cifradoActivo && !mostroAdvertencia) {
            setMostroAdvertencia(true);
            return;
        }

        setError(null);
        setCompartiendo(true);

        const exito = await onCompartir(companeroSeleccionado, rolSeleccionado);

        setCompartiendo(false);

        if (exito) {
            setCompaneroSeleccionado(null);
            setRolSeleccionado('colaborador');
            setMostroAdvertencia(false);
        } else {
            setError('Error al compartir. Por favor, intenta de nuevo.');
        }
    }, [companeroSeleccionado, rolSeleccionado, cifradoActivo, mostroAdvertencia, onCompartir]);

    /* Manejar cambio de rol */
    const manejarCambioRol = useCallback(
        async (compartidoId: number, nuevoRol: RolCompartido) => {
            await onCambiarRol(compartidoId, nuevoRol);
        },
        [onCambiarRol]
    );

    /* Manejar eliminar participante */
    const manejarEliminar = useCallback(
        async (compartidoId: number) => {
            await onDejarDeCompartir(compartidoId);
        },
        [onDejarDeCompartir]
    );

    if (!visible) return null;

    return (
        <Modal estaAbierto={visible} titulo={`Compartir ${tipoTextoMayus}`} onCerrar={onCerrar} claseExtra="modalCompartir">
            <div id="modal-compartir-contenido" className="modalCompartirContenido">
                {/* Nombre del elemento */}
                <div className="modalCompartirElemento">
                    <Share2 size={16} />
                    <span>{elementoNombre}</span>
                </div>

                {/* Advertencia de cifrado */}
                {cifradoActivo && mostroAdvertencia && (
                    <div className="modalCompartirAdvertencia">
                        <AlertTriangle size={18} />
                        <div>
                            <strong>Advertencia de seguridad</strong>
                            <p>Al compartir este {tipoTexto}, el cifrado de extremo a extremo se desactivará para este elemento. Los participantes podrán acceder a su contenido.</p>
                        </div>
                    </div>
                )}

                {/* Lista de participantes actuales */}
                {participantes.length > 0 && (
                    <div className="modalCompartirSeccion">
                        <h4>
                            <Users size={14} />
                            <span>Participantes ({participantes.length})</span>
                        </h4>
                        {cargandoParticipantes ? (
                            <div className="modalCompartirCargando">
                                <Loader2 size={16} className="girando" />
                                <span>Cargando participantes...</span>
                            </div>
                        ) : (
                            <ListaParticipantes participantes={participantes} esPropietario={esPropietario} onCambiarRol={manejarCambioRol} onEliminar={manejarEliminar} />
                        )}
                    </div>
                )}

                {/* Selector de nuevos compañeros */}
                <div className="modalCompartirSeccion">
                    <h4>
                        <UserPlus size={14} />
                        <span>Añadir participante</span>
                    </h4>
                    <SelectorCompaneros companeros={companerosDisponibles} companeroSeleccionado={companeroSeleccionado} rolSeleccionado={rolSeleccionado} onSeleccionar={setCompaneroSeleccionado} onCambiarRol={setRolSeleccionado} disabled={compartiendo} />
                </div>

                {/* Error */}
                {error && <div className="modalCompartirError">{error}</div>}

                {/* Acciones */}
                <div className="modalCompartirAcciones">
                    <button type="button" className="botonSecundario" onClick={onCerrar} disabled={compartiendo}>
                        Cerrar
                    </button>
                    {companeroSeleccionado && (
                        <button type="button" className="botonPrimario" onClick={manejarCompartir} disabled={compartiendo}>
                            {compartiendo ? (
                                <>
                                    <Loader2 size={14} className="girando" />
                                    <span>Compartiendo...</span>
                                </>
                            ) : mostroAdvertencia && cifradoActivo ? (
                                'Confirmar y compartir'
                            ) : (
                                'Compartir'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
