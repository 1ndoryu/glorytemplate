/**
 * SeccionClientes
 *
 * [2003A-3] Vista de gestión de clientes y pagos para admin.
 * Muestra tabla con centros, estado de suscripción y acciones.
 * Solo visible para usuarios con rol administrator.
 */

import {Alerta, Spinner, Badge, Boton, Input} from '../ui';
import {IconoUsuarios, IconoEnlaceExterno, IconoBuscar} from '../icons';
import {useClientes, type Cliente} from '../../hooks/useClientes';
import './seccionClientes.css';

function formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    try {
        return new Date(fecha).toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});
    } catch {
        return fecha;
    }
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

export function SeccionClientes() {
    const {clientes, total, cargando, error, filtros, cambiarFiltros} = useClientes();

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
                                            <Badge variante={varianteBadgeEstado(cliente.estado)} tamano="sm">
                                                {etiquetaEstado(cliente.estado)}
                                            </Badge>
                                        </td>
                                        <td className="capTexto capTexto--sm">{formatearFecha(cliente.fecha_inicio)}</td>
                                        <td className="capTexto capTexto--sm">{formatearFecha(cliente.fecha_fin)}</td>
                                        <td>
                                            {cliente.stripe_customer_id ? (
                                                <a
                                                    href={`https://dashboard.stripe.com/customers/${cliente.stripe_customer_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="capBoton capBoton--sm capBoton--fantasma"
                                                    title="Ver en Stripe"
                                                >
                                                    <IconoEnlaceExterno size={14} />
                                                    Ver en Stripe
                                                </a>
                                            ) : (
                                                <span className="capTexto capTexto--xs capTexto--secundario">Sin Stripe</span>
                                            )}
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
        </div>
    );
}

export default SeccionClientes;
