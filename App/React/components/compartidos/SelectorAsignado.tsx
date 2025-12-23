/*
 * SelectorAsignado
 * Selector para asignar una tarea a un participante
 * Solo muestra participantes del elemento compartido
 */

import {useState, useRef, useEffect} from 'react';
import {User, ChevronDown, X, Check} from 'lucide-react';
import type {Participante} from '../../types/dashboard';

interface SelectorAsignadoProps {
    participantes: Participante[];
    asignadoActual?: number | null;
    onAsignar: (usuarioId: number | null, nombre: string, avatar: string) => void;
    disabled?: boolean;
}

export function SelectorAsignado({participantes, asignadoActual, onAsignar, disabled = false}: SelectorAsignadoProps): JSX.Element {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Encontrar participante asignado actualmente */
    const asignado = participantes.find(p => p.usuarioId === asignadoActual);

    /* Cerrar al hacer clic fuera */
    useEffect(() => {
        const manejarClickFuera = (evento: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
                setAbierto(false);
            }
        };

        if (abierto) {
            document.addEventListener('mousedown', manejarClickFuera);
        }

        return () => {
            document.removeEventListener('mousedown', manejarClickFuera);
        };
    }, [abierto]);

    const manejarSeleccion = (participante: Participante | null) => {
        if (participante) {
            onAsignar(participante.usuarioId, participante.nombre, participante.avatar);
        } else {
            onAsignar(null, '', '');
        }
        setAbierto(false);
    };

    if (participantes.length === 0) {
        return (
            <div className="selectorAsignadoVacio">
                <User size={14} />
                <span>Comparte la tarea para asignarla</span>
            </div>
        );
    }

    return (
        <div className="selectorAsignadoContenedor" ref={contenedorRef}>
            <button type="button" className={`selectorAsignadoBoton ${asignado ? 'selectorAsignadoBotonActivo' : ''}`} onClick={() => setAbierto(!abierto)} disabled={disabled}>
                {asignado ? (
                    <>
                        <img src={asignado.avatar} alt={asignado.nombre} className="selectorAsignadoAvatar" />
                        <span className="selectorAsignadoNombre">{asignado.nombre}</span>
                    </>
                ) : (
                    <>
                        <User size={14} />
                        <span>Sin asignar</span>
                    </>
                )}
                <ChevronDown size={12} className={`selectorAsignadoFlecha ${abierto ? 'selectorAsignadoFlechaAbierto' : ''}`} />
            </button>

            {abierto && (
                <div className="selectorAsignadoMenu">
                    {/* Opción para quitar asignación */}
                    {asignado && (
                        <button type="button" className="selectorAsignadoOpcion selectorAsignadoOpcionQuitar" onClick={() => manejarSeleccion(null)}>
                            <X size={14} />
                            <span>Quitar asignación</span>
                        </button>
                    )}

                    {/* Lista de participantes */}
                    {participantes.map(participante => (
                        <button key={participante.usuarioId} type="button" className={`selectorAsignadoOpcion ${asignadoActual === participante.usuarioId ? 'selectorAsignadoOpcionActiva' : ''}`} onClick={() => manejarSeleccion(participante)}>
                            <img src={participante.avatar} alt={participante.nombre} className="selectorAsignadoAvatarOpcion" />
                            <div className="selectorAsignadoOpcionInfo">
                                <span className="selectorAsignadoOpcionNombre">{participante.nombre}</span>
                                {participante.esPropietario && <span className="selectorAsignadoOpcionRol">Propietario</span>}
                            </div>
                            {asignadoActual === participante.usuarioId && <Check size={14} className="selectorAsignadoCheck" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
