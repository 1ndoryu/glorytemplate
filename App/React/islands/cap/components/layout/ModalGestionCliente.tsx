/* [2003A-15] Modal de gestión de cliente para el panel admin.
 * Permite: editar datos del usuario (nombre/email/contraseña), cambiar estado
 * del plan (activar/desactivar), bloquear/desbloquear acceso y eliminar cuenta.
 * El admin puede cambiar la contraseña del usuario sin necesitar la actual. */

import {useState, useEffect} from 'react';
import {Modal, Input, Boton, Alerta, Badge} from '../ui';
import {useGestionCliente} from '../../hooks/useGestionCliente';
import type {Cliente} from '../../hooks/useClientes';
import './modalGestionCliente.css';

interface ModalGestionClienteProps {
    abierto: boolean;
    onCerrar: () => void;
    cliente: Cliente;
    onGuardado: () => void;
}

function varianteBadgeEstado(estado: Cliente['estado']): 'exito' | 'error' | 'advertencia' | 'info' {
    const mapa: Record<string, 'exito' | 'error' | 'advertencia' | 'info'> = {
        activa: 'exito',
        expirada: 'error',
        cancelada: 'error',
        pago_fallido: 'advertencia',
    };
    return mapa[estado] || 'info';
}

function etiquetaEstado(estado: Cliente['estado']): string {
    const mapa: Record<string, string> = {
        activa: 'Activa',
        expirada: 'Expirada',
        cancelada: 'Cancelada',
        pago_fallido: 'Pago fallido',
    };
    return mapa[estado] || estado;
}

export function ModalGestionCliente({abierto, onCerrar, cliente, onGuardado}: ModalGestionClienteProps) {
    const {guardando, error, exito, limpiarMensajes, actualizarUsuario, cambiarPlan, cambiarAcceso, eliminarUsuario} =
        useGestionCliente();

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [contrasena, setContrasena] = useState('');

    /* Inicializar campos al abrir/cambiar de cliente */
    useEffect(() => {
        if (abierto) {
            setNombre(cliente.wp_display_name || '');
            setEmail(cliente.wp_user_email || '');
            setContrasena('');
            limpiarMensajes();
        }
    }, [abierto, cliente, limpiarMensajes]);

    const handleGuardarDatos = async () => {
        const ok = await actualizarUsuario(cliente.user_id, {nombre, email, contrasena});
        if (ok) onGuardado();
    };

    const handleCambiarPlan = async (accion: 'activar' | 'desactivar') => {
        const ok = await cambiarPlan(cliente.centro_id, accion);
        if (ok) onGuardado();
    };

    const handleCambiarAcceso = async () => {
        const ok = await cambiarAcceso(cliente.user_id, !cliente.acceso_bloqueado);
        if (ok) onGuardado();
    };

    const handleEliminar = async () => {
        const confirmar = window.confirm(
            `¿Eliminar permanentemente la cuenta de "${cliente.wp_display_name || cliente.wp_user_login}"?\n\nEsta acción eliminará todos sus datos y no se puede deshacer.`,
        );
        if (!confirmar) return;

        const ok = await eliminarUsuario(cliente.user_id);
        if (ok) {
            onGuardado();
            onCerrar();
        }
    };

    return (
        <Modal
            abierto={abierto}
            onCerrar={onCerrar}
            titulo={`Gestionar: ${cliente.centro_nombre || cliente.wp_user_login}`}
            subtitulo={`Usuario: ${cliente.wp_user_login} · ${cliente.wp_user_email}`}
            tamano="md"
        >
            <div className="capModalGestion__secciones">
                {/* Feedback global */}
                {error && <Alerta variante="error">{error}</Alerta>}
                {exito && <Alerta variante="exito">{exito}</Alerta>}

                {/* Sección 1: Datos del usuario */}
                <div className="capModalGestion__seccion">
                    <p className="capModalGestion__seccionTitulo">Datos del usuario</p>
                    <div className="capModalGestion__campos">
                        <Input
                            etiqueta="Nombre"
                            tipo="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            disabled={guardando}
                        />
                        <Input
                            etiqueta="Email"
                            tipo="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={guardando}
                        />
                        <Input
                            etiqueta="Nueva contraseña (dejar vacío para no cambiar)"
                            tipo="password"
                            value={contrasena}
                            onChange={e => setContrasena(e.target.value)}
                            disabled={guardando}
                        />
                    </div>
                    <div className="capModalGestion__accionesSeccion">
                        <Boton variante="primario" tamano="sm" onClick={handleGuardarDatos} cargando={guardando}>
                            Guardar datos
                        </Boton>
                    </div>
                </div>

                <hr className="capModalGestion__separador" />

                {/* Sección 2: Plan */}
                <div className="capModalGestion__seccion">
                    <p className="capModalGestion__seccionTitulo">Plan de suscripción</p>
                    <div className="capModalGestion__planFila">
                        <div className="capModalGestion__planInfo">
                            <Badge variante={varianteBadgeEstado(cliente.estado)}>
                                {etiquetaEstado(cliente.estado)}
                            </Badge>
                        </div>
                        {cliente.estado === 'activa' ? (
                            <Boton
                                variante="secundario"
                                tamano="sm"
                                onClick={() => handleCambiarPlan('desactivar')}
                                cargando={guardando}
                            >
                                Desactivar plan
                            </Boton>
                        ) : (
                            <Boton
                                variante="primario"
                                tamano="sm"
                                onClick={() => handleCambiarPlan('activar')}
                                cargando={guardando}
                            >
                                Activar plan
                            </Boton>
                        )}
                    </div>
                </div>

                <hr className="capModalGestion__separador" />

                {/* Sección 3: Acceso al dashboard */}
                <div className="capModalGestion__seccion">
                    <p className="capModalGestion__seccionTitulo">Acceso al dashboard</p>
                    <div className={`capModalGestion__filaAcceso${cliente.acceso_bloqueado ? ' capModalGestion__filaAcceso--bloqueado' : ''}`}>
                        <div className="capModalGestion__filaAccesoInfo">
                            <strong>{cliente.acceso_bloqueado ? 'Acceso bloqueado' : 'Acceso activo'}</strong>
                            <span>
                                {cliente.acceso_bloqueado
                                    ? 'El usuario no puede iniciar sesión en el panel.'
                                    : 'El usuario puede acceder al panel normalmente.'}
                            </span>
                        </div>
                        <Boton
                            variante={cliente.acceso_bloqueado ? 'primario' : 'secundario'}
                            tamano="sm"
                            onClick={handleCambiarAcceso}
                            cargando={guardando}
                        >
                            {cliente.acceso_bloqueado ? 'Restaurar acceso' : 'Bloquear acceso'}
                        </Boton>
                    </div>
                </div>

                <hr className="capModalGestion__separador" />

                {/* Sección 4: Zona de peligro */}
                <div className="capModalGestion__seccion">
                    <p className="capModalGestion__seccionTitulo">Zona de peligro</p>
                    <div className="capModalGestion__zonaPeligro">
                        <div className="capModalGestion__zonaPeligroTexto">
                            <strong>Eliminar cuenta</strong>
                            <span>Elimina al usuario y todos sus datos. Esta acción no se puede deshacer.</span>
                        </div>
                        <Boton variante="peligro" tamano="sm" onClick={handleEliminar} cargando={guardando}>
                            Eliminar
                        </Boton>
                    </div>
                </div>
            </div>

            <div className="capModalGestion__pie">
                <Boton variante="ghost" onClick={onCerrar} disabled={guardando}>
                    Cerrar
                </Boton>
            </div>
        </Modal>
    );
}

export default ModalGestionCliente;
