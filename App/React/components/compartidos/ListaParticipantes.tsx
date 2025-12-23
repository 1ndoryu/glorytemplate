/*
 * ListaParticipantes
 * Muestra los participantes de un elemento compartido con acciones
 * Permite cambiar roles y eliminar participantes (solo el propietario)
 */

import {useState} from 'react';
import {Crown, Edit3, Eye, X, ChevronDown} from 'lucide-react';
import type {Participante, RolCompartido} from '../../types/dashboard';

interface ListaParticipantesProps {
    participantes: Participante[];
    esPropietario: boolean;
    onCambiarRol?: (compartidoId: number, nuevoRol: RolCompartido) => void;
    onEliminar?: (compartidoId: number) => void;
    cargando?: boolean;
}

export function ListaParticipantes({participantes, esPropietario, onCambiarRol, onEliminar, cargando = false}: ListaParticipantesProps): JSX.Element {
    const [menuRolAbierto, setMenuRolAbierto] = useState<number | null>(null);

    const obtenerIconoRol = (rol: RolCompartido) => {
        switch (rol) {
            case 'propietario':
                return <Crown size={12} />;
            case 'colaborador':
                return <Edit3 size={12} />;
            case 'observador':
                return <Eye size={12} />;
        }
    };

    const obtenerTextoRol = (rol: RolCompartido) => {
        switch (rol) {
            case 'propietario':
                return 'Propietario';
            case 'colaborador':
                return 'Colaborador';
            case 'observador':
                return 'Observador';
        }
    };

    const manejarCambioRol = (compartidoId: number, nuevoRol: RolCompartido) => {
        onCambiarRol?.(compartidoId, nuevoRol);
        setMenuRolAbierto(null);
    };

    if (participantes.length === 0) {
        return (
            <div id="lista-participantes-vacia" className="listaParticipantesVacia">
                <span>No hay participantes</span>
            </div>
        );
    }

    return (
        <div id="lista-participantes" className="listaParticipantes">
            {participantes.map(participante => (
                <div key={`${participante.usuarioId}-${participante.rol}`} className={`participanteItem ${participante.esPropietario ? 'participanteItemPropietario' : ''}`}>
                    <img src={participante.avatar} alt={participante.nombre} className="participanteAvatar" />

                    <div className="participanteInfo">
                        <span className="participanteNombre">{participante.nombre}</span>
                        <span className="participanteEmail">{participante.email}</span>
                    </div>

                    <div className="participanteRolContainer">
                        {participante.esPropietario ? (
                            <span className="participanteRolBadge participanteRolPropietario">
                                {obtenerIconoRol('propietario')}
                                <span>{obtenerTextoRol('propietario')}</span>
                            </span>
                        ) : esPropietario ? (
                            <div className="participanteRolSelector">
                                <button type="button" className="participanteRolBoton" onClick={() => setMenuRolAbierto(menuRolAbierto === participante.id ? null : participante.id)} disabled={cargando}>
                                    {obtenerIconoRol(participante.rol)}
                                    <span>{obtenerTextoRol(participante.rol)}</span>
                                    <ChevronDown size={12} />
                                </button>

                                {menuRolAbierto === participante.id && (
                                    <div className="participanteRolMenu">
                                        <button type="button" className={`participanteRolOpcion ${participante.rol === 'colaborador' ? 'participanteRolOpcionActiva' : ''}`} onClick={() => manejarCambioRol(participante.id, 'colaborador')}>
                                            <Edit3 size={12} />
                                            <span>Colaborador</span>
                                        </button>
                                        <button type="button" className={`participanteRolOpcion ${participante.rol === 'observador' ? 'participanteRolOpcionActiva' : ''}`} onClick={() => manejarCambioRol(participante.id, 'observador')}>
                                            <Eye size={12} />
                                            <span>Observador</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="participanteRolBadge">
                                {obtenerIconoRol(participante.rol)}
                                <span>{obtenerTextoRol(participante.rol)}</span>
                            </span>
                        )}
                    </div>

                    {esPropietario && !participante.esPropietario && (
                        <button type="button" className="participanteEliminar" onClick={() => onEliminar?.(participante.id)} disabled={cargando} title="Dejar de compartir">
                            <X size={14} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
