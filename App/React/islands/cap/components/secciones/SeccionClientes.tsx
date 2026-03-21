/**
 * SeccionClientes
 *
 * [2003A-3] Vista de gestión de clientes y pagos para admin.
 * Muestra tabla con centros, estado de suscripción y acciones.
 * Solo visible para usuarios con rol administrator.
 * [2003A-15] Botón Gestionar abre ModalGestionCliente para editar datos,
 * plan, acceso y eliminar usuario. onGuardado recarga la lista.
 */

import {useState} from 'react';
import {Alerta, Spinner, Badge, Boton, Input, Tooltip} from '../ui';
import {IconoUsuarios, IconoEnlaceExterno, IconoBuscar, IconoEditar} from '../icons';
import {useClientes, type Cliente} from '../../hooks/useClientes';
import {ModalGestionCliente} from '../layout/ModalGestionCliente';
import './seccionClientes.css';

function formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    try {
        return new Date(fecha).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});
    } catch {
        return fecha;
    }
}

/* [2003A-15fix] Si estado=activa pero no hay stripe_subscription_id, la suscripción
 * fue creada manualmente. Se muestra con variante 'info' y etiqueta distinta para
 * que el admin no la confunda con una suscripción de Stripe real. */
function varianteBadgeEstado(estado: Cliente['estado'], tieneStripe: boolean): 'exito' | 'error' | 'advertencia' | 'info' {
    if (estado === 'activa') return tieneStripe ? 'exito' : 'info';
    const mapa: Record<string, 'exito' | 'error' | 'advertencia' | 'info'> = {
        expirada: 'error',
        cancelada: 'error',
        pago_fallido: 'advertencia',
    };
    return mapa[estado] || 'info';
}

function etiquetaEstado(estado: Cliente['estado'], tieneStripe: boolean): string {
    if (estado === 'activa') return tieneStripe ? 'Activa' : 'Manual';
    const mapa: Record<string, string> = {
        expirada: 'Expirada',
        cancelada: 'Cancelada',
        pago_fallido: 'Pago fallido',
    };
    return mapa[estado] || estado;
}

export function SeccionClientes() {
    const {clientes, total, cargando, error, filtros, cambiarFiltros, cargarClientes} = useClientes();

    /* [2003A-15] Estado para modal de gestión */
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [modalAbierto, setModalAbierto] = useState(false);

    const abrirGestion = (cliente: Cliente) => {
        setClienteSeleccionado(cliente);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setClienteSeleccionado(null);
    };

    return (
        <div className="capSeccion capAnimFadeIn">
            {/* Header */}
            <div className="capSeccionClientes__header">
                <div>
                    <h2 className="capTitulo capTitulo--lg">Clientes y Pagos</h2>
                    <p className="capTexto capTexto--secundario">
                        <Badge variante="info" tamano="sm">Solo admin</Badge>
                        {' '}{total > 0 ? `${total} suscripción${total !== 1 ? 'es' : ''} registrada${total !== 1 ? 's' : ''}` : 'Administra las suscripciones de tus clientes'}
                    </p>
                </div>
                <a
                    href="https://dashboard.stripe.com/customers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="capBoton capBoton--secundario capSeccionClientes__stripeLink"
                >
                    <IconoEnlaceExterno size={16} />
                    Stripe Dashboard
                </a>
            </div>

            {/* Buscador */}
            <div className="capSeccionClientes__buscador capMt--md">
                <Input
                    tipo="search"
                    icono={<IconoBuscar size={16} />}
                    placeholder="Buscar por nombre, email o usuario..."
                    value={filtros.busqueda}
                    onChange={e => cambiarFiltros({busqueda: e.target.value, pagina: 1})}
                />
            </div>

            {/* Mensajes */}
            {error && (
                <Alerta variante="error" className="capMt--md capAnimSlideUp">
                    {error}
                </Alerta>
            )}

            {/* Tabla */}
            <div className="capMt--lg">
                {cargando ? (
                    <div className="capSeccionClientes__cargando">
                        <Spinner tamano="lg" />
                        <p className="capTexto capTexto--secundario capMt--sm">Cargando clientes...</p>
                    </div>
                ) : clientes.length === 0 ? (
                    <div className="capSeccionClientes__vacio">
                        <IconoUsuarios size={48} className="capSeccionClientes__vacioIcono" />
                        <p className="capTexto capTexto--secundario">
                            {filtros.busqueda ? 'No se encontraron clientes con esa búsqueda.' : 'No hay suscripciones registradas aún.'}
                        </p>
                    </div>
                ) : (
                    <div className="capSeccionClientes__tablaContenedor">
                        <table className="capTabla">
                            <thead>
                                <tr>
                                    <th>Centro / Cliente</th>
                                    <th>Contacto</th>
                                    <th>Estado</th>
                                    <th>Fecha inicio</th>
                                    <th>Fecha fin</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientes.map(cliente => (
                                    <tr key={cliente.id}>
                                        <td>
                                            <div className="capSeccionClientes__celda">
                                                <span className="capSeccionClientes__nombre">{cliente.centro_nombre || 'Sin nombre'}</span>
                                                <span className="capTexto capTexto--xs capTexto--secundario">{cliente.wp_user_login || `user_id: ${cliente.user_id}`}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="capSeccionClientes__celda">
                                                <span className="capTexto capTexto--sm">{cliente.centro_email || cliente.wp_user_email || '—'}</span>
                                                {cliente.centro_telefono && (
                                                    <span className="capTexto capTexto--xs capTexto--secundario">{cliente.centro_telefono}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge variante={varianteBadgeEstado(cliente.estado, !!cliente.stripe_subscription_id)} tamano="sm">
                                                {etiquetaEstado(cliente.estado, !!cliente.stripe_subscription_id)}
                                            </Badge>
                                        </td>
                                        <td className="capTexto capTexto--sm">{formatearFecha(cliente.fecha_inicio)}</td>
                                        <td className="capTexto capTexto--sm">{formatearFecha(cliente.fecha_fin)}</td>
                                        <td>
                                            <div className="capTabla__acciones">
                                                {/* [2003A-15fix] Iconos igual que TablaAlumnos */}
                                                <Tooltip content="Gestionar usuario" position="top">
                                                    <Boton
                                                        variante="ghost"
                                                        tamano="sm"
                                                        onClick={() => abrirGestion(cliente)}
                                                    >
                                                        <IconoEditar size={16} />
                                                    </Boton>
                                                </Tooltip>
                                                {cliente.stripe_customer_id && (
                                                    <Tooltip content="Ver en Stripe" position="top">
                                                        <a
                                                            href={`https://dashboard.stripe.com/customers/${cliente.stripe_customer_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="capBoton capBoton--sm capBoton--fantasma"
                                                        >
                                                            <IconoEnlaceExterno size={16} />
                                                        </a>
                                                    </Tooltip>
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

            {/* Paginación básica */}
            {!cargando && total > filtros.porPagina && (
                <div className="capSeccionClientes__paginacion capMt--md">
                    <Boton
                        variante="ghost"
                        tamano="sm"
                        disabled={filtros.pagina <= 1}
                        onClick={() => cambiarFiltros({pagina: filtros.pagina - 1})}
                    >
                        Anterior
                    </Boton>
                    <span className="capTexto capTexto--sm">
                        Página {filtros.pagina} de {Math.ceil(total / filtros.porPagina)}
                    </span>
                    <Boton
                        variante="ghost"
                        tamano="sm"
                        disabled={filtros.pagina >= Math.ceil(total / filtros.porPagina)}
                        onClick={() => cambiarFiltros({pagina: filtros.pagina + 1})}
                    >
                        Siguiente
                    </Boton>
                </div>
            )}
            {/* [2003A-15] Modal de gestión del cliente seleccionado */}
            {clienteSeleccionado && (
                <ModalGestionCliente
                    abierto={modalAbierto}
                    onCerrar={cerrarModal}
                    cliente={clienteSeleccionado}
                    onGuardado={cargarClientes}
                />
            )}
        </div>
    );
}

export default SeccionClientes;
