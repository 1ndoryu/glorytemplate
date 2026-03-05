/**
 * AdminFlota — Gestión de vehículos: listar, crear, editar, toggle activo, eliminar.
 * Minimalista con tabla y modal de edición inline.
 */

import { useState, useCallback } from 'react';
import { Boton } from '@app/components/ui/Boton';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { CampoSelect } from '@app/components/ui/CampoSelect';
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

    const cerrarEditor = useCallback(() => {
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

    if (editando) {
        return (
            <div className="adminSeccion">
                <div className="adminSeccionCabecera">
                    <h2 className="adminSeccionTitulo">
                        {editando.id ? 'Editar vehículo' : 'Nuevo vehículo'}
                    </h2>
                    <Boton variante="atras" onClick={cerrarEditor}>Volver</Boton>
                </div>

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
            </div>
        );
    }

    return (
        <div className="adminSeccion">
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
                                    <td className="adminTablaCelda">
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
                                    <td className="adminTablaCelda">
                                        <div className="adminAcciones">
                                            <Boton variante="enlace" onClick={() => abrirEditar(v)}>Editar</Boton>
                                            <Boton variante="enlace" onClick={() => onToggleActivo(v.id)}>
                                                {v.activo ? 'Desactivar' : 'Activar'}
                                            </Boton>
                                            {confirmEliminar === v.id ? (
                                                <Boton variante="enlace" onClick={() => handleEliminar(v.id)}>
                                                    Confirmar
                                                </Boton>
                                            ) : (
                                                <Boton variante="enlace" onClick={() => setConfirmEliminar(v.id)}>
                                                    Eliminar
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
