/*
 * ModalCompartir
 * Permite gestionar el acceso compartido a elementos (tareas, proyectos, hábitos)
 */

import {useState, useEffect, useMemo} from 'react';
import {Modal} from './Modal';
import {useCompartir} from '../../hooks/useCompartir';
import {useEquipos} from '../../hooks/useEquipos';
import {Users, AlertTriangle, Trash2, UserPlus, Shield} from 'lucide-react';
import type {Participante} from '../../types/dashboard';

interface ModalCompartirProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    tipo: 'tarea' | 'proyecto' | 'habito';
    elementoId: number;
    tituloElemento: string;
}

export function ModalCompartir({estaAbierto, onCerrar, tipo, elementoId, tituloElemento}: ModalCompartirProps): JSX.Element {
    const {cargarEquipo, companeros} = useEquipos();
    const {compartirElemento, dejarDeCompartir, obtenerParticipantes, cargando, error} = useCompartir();

    const [participantes, setParticipantes] = useState<Participante[]>([]);
    const [companeroSeleccionadoId, setCompaneroSeleccionadoId] = useState<string>('');
    const [rolSeleccionado, setRolSeleccionado] = useState<'colaborador' | 'observador'>('colaborador');

    useEffect(() => {
        if (estaAbierto && elementoId) {
            cargarEquipo();
            cargarParticipantes();
        }
    }, [estaAbierto, elementoId, tipo]);

    const cargarParticipantes = async () => {
        const data = await obtenerParticipantes(tipo, elementoId);
        setParticipantes(data);
    };

    const handleCompartir = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companeroSeleccionadoId) return;

        const resultado = await compartirElemento(tipo, elementoId, Number(companeroSeleccionadoId), rolSeleccionado);
        if (resultado.exito) {
            setCompaneroSeleccionadoId('');
            await cargarParticipantes();
        }
    };

    const handleEliminar = async (compartidoId: number) => {
        if (window.confirm('¿Estás seguro de quitar el acceso a este usuario?')) {
            await dejarDeCompartir(compartidoId);
            await cargarParticipantes();
        }
    };

    /* Filtrar compañeros que ya son participantes para excluirlos del select */
    const companerosDisponibles = useMemo(() => {
        const idsParticipantes = new Set(participantes.map(p => p.usuarioId));
        return companeros.filter(c => !idsParticipantes.has(c.companeroId));
    }, [companeros, participantes]);

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo={`Compartir ${tipo}: ${tituloElemento}`} claseExtra="modalCompartir">
            <div className="modalCompartirContenido">
                {/* Advertencia de Cifrado */}
                <div className="alertaCifrado">
                    <AlertTriangle size={18} className="iconoAlerta" />
                    <p>
                        <strong>Atención:</strong> Al compartir este elemento, el cifrado E2E individual se desactivará para permitir el acceso a otros usuarios.
                    </p>
                </div>

                {error && <div className="mensajeError">{error}</div>}

                {/* Formulario de Invitar */}
                <form onSubmit={handleCompartir} className="formularioInvitar">
                    <div className="grupoInput">
                        <label htmlFor="selectCompanero">Invitar compañero</label>
                        <div className="inputConBoton">
                            <select id="selectCompanero" value={companeroSeleccionadoId} onChange={e => setCompaneroSeleccionadoId(e.target.value)} disabled={cargando} className="inputSelect">
                                <option value="">Seleccionar compañero...</option>
                                {companerosDisponibles.map(c => (
                                    <option key={c.id} value={c.companeroId}>
                                        {c.nombre} ({c.email})
                                    </option>
                                ))}
                            </select>
                            <button type="submit" className="botonPrimario" disabled={!companeroSeleccionadoId || cargando}>
                                <UserPlus size={16} />
                                Compartir
                            </button>
                        </div>
                    </div>
                </form>

                {/* Lista de Participantes */}
                <div className="seccionParticipantes">
                    <h3>Personas con acceso</h3>
                    <div className="listaParticipantes">
                        {participantes.length === 0 && !cargando ? (
                            <p className="textoVacio">Nadie tiene acceso aún.</p>
                        ) : (
                            participantes.map(p => (
                                <div key={p.usuarioId} className="itemParticipante">
                                    <div className="infoParticipante">
                                        <img src={p.avatar} alt={p.nombre} className="avatarParticipante" />
                                        <div className="textoParticipante">
                                            <span className="nombreParticipante">
                                                {p.nombre} {p.esPropietario && <span className="badgePropietario">Propietario</span>}
                                            </span>
                                            <span className="emailParticipante">{p.email}</span>
                                        </div>
                                    </div>
                                    <div className="accionesParticipante">
                                        <span className={`badgeRol ${p.rol}`}>{p.rol}</span>
                                        {!p.esPropietario && (
                                            <button className="botonEliminar" onClick={() => handleEliminar(p.id)} disabled={cargando} title="Quitar acceso">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        {p.esPropietario && <Shield size={16} className="iconoPropietario" />}
                                    </div>
                                </div>
                            ))
                        )}
                        {cargando && <p className="cargandoTexto">Cargando...</p>}
                    </div>
                </div>
            </div>
            <style jsx>{`
                .alertaCifrado {
                    background-color: rgb(255 244 229);
                    border: 1px solid rgb(255 213 153);
                    color: rgb(102 60 0);
                    padding: 12px;
                    border-radius: 8px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 20px;
                    font-size: 13px;
                }
                .iconoAlerta {
                    color: rgb(230 149 0);
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .formularioInvitar {
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid var(--borde-color);
                }
                .grupoInput {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .inputConBoton {
                    display: flex;
                    gap: 8px;
                }
                .inputSelect {
                    flex: 1;
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 1px solid var(--borde-color);
                    background-color: var(--bg-input);
                    color: var(--texto-color);
                }
                .botonPrimario {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background-color: var(--brand-color);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .botonPrimario:hover {
                    background-color: var(--brand-color-dark);
                }
                .botonPrimario:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .seccionParticipantes h3 {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: var(--texto-color);
                }
                .listaParticipantes {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .itemParticipante {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px;
                    background-color: var(--bg-card);
                    border: 1px solid var(--borde-color);
                    border-radius: 8px;
                }
                .infoParticipante {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .avatarParticipante {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .textoParticipante {
                    display: flex;
                    flex-direction: column;
                }
                .nombreParticipante {
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .emailParticipante {
                    font-size: 11px;
                    color: var(--texto-muted);
                }
                .badgePropietario {
                    background-color: var(--brand-color-light);
                    color: var(--brand-color);
                    font-size: 9px;
                    padding: 1px 4px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                .accionesParticipante {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .badgeRol {
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background-color: var(--bg-hover);
                    color: var(--texto-muted);
                    text-transform: capitalize;
                }
                .botonEliminar {
                    background: none;
                    border: none;
                    color: var(--danger-color);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    display: flex;
                }
                .botonEliminar:hover {
                    background-color: var(--danger-bg);
                }
                .iconoPropietario {
                    color: var(--brand-color);
                    opacity: 0.5;
                }
                .mensajeError {
                    color: var(--danger-color);
                    background-color: var(--danger-bg);
                    padding: 8px;
                    border-radius: 6px;
                    margin-bottom: 16px;
                    font-size: 13px;
                }
            `}</style>
        </Modal>
    );
}
