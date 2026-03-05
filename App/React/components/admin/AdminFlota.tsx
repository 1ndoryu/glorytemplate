/**
 * AdminFlota — Gestión de vehículos: listar, crear, editar, toggle activo, eliminar.
 * Edición a través de un modal reutilizable.
 */

import { useState, useCallback } from 'react';
import { Boton } from '@app/components/ui/Boton';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { CampoSelect } from '@app/components/ui/CampoSelect';
import { Modal } from '@app/components/ui/Modal';
import type { AdminVehiculoEditable } from '@app/types/cresta';

interface AdminFlotaProps {
    vehiculos: AdminVehiculoEditable[];
    loading: boolean;
    onGuardar: (v: AdminVehiculoEditable) => Promise<boolean>;
    onToggleActivo: (id: number) => Promise<boolean>;
    onEliminar: (id: number) => Promise<boolean>;
}

const VEHICULO_VACIO: AdminVehiculoEditable = {
    id: 0,
    nombre: '',
    descripcionCorta: '',
    capacidad: 2,
    plazasViaje: 2,
    combustible: 'diesel',
    transmision: 'manual',
    precioBase: 0,
    activo: true,
    ubicacion: '',
    fianza: 0,
    kmIncluidos: 0,
    edadMinima: 21,
    equipamiento: [],
    imagen: '',
};

function formatearEuros(cantidad: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cantidad);
}

export function AdminFlota({ vehiculos, loading, onGuardar, onToggleActivo, onEliminar }: AdminFlotaProps): JSX.Element {
    const [editando, setEditando] = useState<AdminVehiculoEditable | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [confirmEliminar, setConfirmEliminar] = useState<number | null>(null);

    const abrirCrear = useCallback(() => {
        setEditando({ ...VEHICULO_VACIO });
    }, []);

    const abrirEditar = useCallback((v: AdminVehiculoEditable) => {
        setEditando({ ...v });
    }, []);

    const cerrarModal = useCallback(() => {
        setEditando(null);
    }, []);

    const actualizarCampo = useCallback(<K extends keyof AdminVehiculoEditable>(campo: K, valor: AdminVehiculoEditable[K]) => {
        setEditando(prev => prev ? { ...prev, [campo]: valor } : null);
    }, []);

    const handleGuardar = useCallback(async () => {
        if (!editando) return;
        setGuardando(true);
        const ok = await onGuardar(editando);
        setGuardando(false);
        if (ok) setEditando(null);
    }, [editando, onGuardar]);

    const handleEliminar = useCallback(async (id: number) => {
        await onEliminar(id);
        setConfirmEliminar(null);
    }, [onEliminar]);

    const tituloModal = editando?.id ? `Editar — ${editando.nombre || 'vehículo'}` : 'Nuevo vehículo';

    return (
        <div className="adminSeccion">
            {/* Modal de edición / creación */}
            <Modal
                abierto={editando !== null}
                titulo={tituloModal}
                onCerrar={cerrarModal}
                ancho="640px"
            >
                {editando && (
                    <>
                        <div className="adminFormGrid">
                            <CampoTexto
                                label="Nombre"
                                value={editando.nombre}
                                onChange={v => actualizarCampo('nombre', v)}
                                placeholder="Ej: Cresta One"
                            />
                            <CampoTexto
                                label="Descripción corta"
                                value={editando.descripcionCorta}
                                onChange={v => actualizarCampo('descripcionCorta', v)}
                                placeholder="Breve descripción para tarjetas"
                            />
                            <CampoTexto
                                label="Precio base (€/noche)"
                                type="number"
                                value={String(editando.precioBase)}
                                onChange={v => actualizarCampo('precioBase', Number(v))}
                            />
                            <CampoTexto
                                label="Ubicación"
                                value={editando.ubicacion}
                                onChange={v => actualizarCampo('ubicacion', v)}
                                placeholder="Ej: Madrid"
                            />
                            <CampoTexto
                                label="Capacidad (camas)"
                                type="number"
                                value={String(editando.capacidad)}
                                onChange={v => actualizarCampo('capacidad', Number(v))}
                            />
                            <CampoTexto
                                label="Plazas de viaje"
                                type="number"
                                value={String(editando.plazasViaje)}
                                onChange={v => actualizarCampo('plazasViaje', Number(v))}
                            />
                            <CampoTexto
                                label="Fianza (€)"
                                type="number"
                                value={String(editando.fianza)}
                                onChange={v => actualizarCampo('fianza', Number(v))}
                            />
                            <CampoTexto
                                label="Km incluidos/día (0 = ilimitados)"
                                type="number"
                                value={String(editando.kmIncluidos)}
                                onChange={v => actualizarCampo('kmIncluidos', Number(v))}
                            />
                            <CampoTexto
                                label="Edad mínima"
                                type="number"
                                value={String(editando.edadMinima)}
                                onChange={v => actualizarCampo('edadMinima', Number(v))}
                            />
                            <CampoSelect
                                label="Combustible"
                                value={editando.combustible}
                                onChange={v => actualizarCampo('combustible', v)}
                            >
                                <option value="diesel">Diésel</option>
                                <option value="gasolina">Gasolina</option>
                                <option value="electrico">Eléctrico</option>
                                <option value="hibrido">Híbrido</option>
                            </CampoSelect>
                            <CampoSelect
                                label="Transmisión"
                                value={editando.transmision}
                                onChange={v => actualizarCampo('transmision', v)}
                            >
                                <option value="manual">Manual</option>
                                <option value="automatico">Automática</option>
                            </CampoSelect>
                        </div>

                        <div className="adminFormAcciones">
                            <Boton onClick={handleGuardar} disabled={guardando || !editando.nombre}>
                                {guardando ? 'Guardando...' : 'Guardar vehículo'}
                            </Boton>
                        </div>
                    </>
                )}
            </Modal>

            <div className="adminSeccionCabecera">
                <div>
                    <h2 className="adminSeccionTitulo">Flota</h2>
                    <p className="adminSeccionDesc">Gestiona tus furgonetas camper</p>
                </div>
                <Boton onClick={abrirCrear}>Nuevo vehículo</Boton>
            </div>

            {loading ? (
                <div className="adminSeccionCargando">
                    <div className="cargandoSpinner" />
                    <p>Cargando vehículos...</p>
                </div>
            ) : vehiculos.length === 0 ? (
                <div className="adminVacio">
                    <p>No hay vehículos registrados.</p>
                    <Boton onClick={abrirCrear}>Añadir el primero</Boton>
                </div>
            ) : (
                <div className="adminTablaWrap">
                    <table className="adminTabla">
                        <thead>
                            <tr>
                                <th>Vehículo</th>
                                <th>Ubicación</th>
                                <th>Capacidad</th>
                                <th>Precio/noche</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiculos.map(v => (
                                <tr key={v.id}>
                                    <td className="adminTablaCelda adminTablaColNombre">
                                        <div className="adminVehiculoInfo">
                                            {v.imagen && (
                                                <img src={v.imagen} alt={v.nombre} className="adminVehiculoMiniImg" />
                                            )}
                                            <div>
                                                <span className="adminVehiculoNombre">{v.nombre}</span>
                                                <span className="adminVehiculoDesc">{v.descripcionCorta}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="adminTablaCelda">{v.ubicacion}</td>
                                    <td className="adminTablaCelda">{v.capacidad} camas</td>
                                    <td className="adminTablaCelda adminPrecio">{formatearEuros(v.precioBase)}</td>
                                    <td className="adminTablaCelda">
                                        <span className={`adminBadge ${v.activo ? 'adminBadgeExito' : 'adminBadgeError'}`}>
                                            {v.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="adminTablaAcciones">
                                        <div className="adminAcciones">
                                            <Boton
                                                variante="icono"
                                                className="adminAccionIcono"
                                                title="Editar"
                                                onClick={() => abrirEditar(v)}
                                            >
                                                {/* Lápiz */}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </Boton>
                                            <Boton
                                                variante="icono"
                                                className={`adminAccionIcono ${v.activo ? 'adminAccionIconoAviso' : 'adminAccionIconoExito'}`}
                                                title={v.activo ? 'Desactivar' : 'Activar'}
                                                onClick={() => onToggleActivo(v.id)}
                                            >
                                                {v.activo ? (
                                                    /* Ojo tachado — desactivar */
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                ) : (
                                                    /* Ojo — activar */
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                )}
                                            </Boton>
                                            {confirmEliminar === v.id ? (
                                                <Boton
                                                    variante="icono"
                                                    className="adminAccionIcono adminAccionIconoEliminarConfirm"
                                                    title="Confirmar eliminación"
                                                    onClick={() => handleEliminar(v.id)}
                                                >
                                                    {/* Check */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </Boton>
                                            ) : (
                                                <Boton
                                                    variante="icono"
                                                    className="adminAccionIcono adminAccionIconoEliminar"
                                                    title="Eliminar"
                                                    onClick={() => setConfirmEliminar(v.id)}
                                                >
                                                    {/* Papelera */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                                        <path d="M10 11v6M14 11v6" />
                                                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                                    </svg>
                                                </Boton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
