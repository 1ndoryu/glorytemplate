/**
 * PanelSuscripcion
 *
 * Muestra el estado de la suscripción actual y enlace a gestión de pagos.
 * Incluye indicador visual de días restantes.
 */

import {Boton, Tarjeta, TarjetaHeader, TarjetaBody, Badge} from '../ui';
import {IconoTarjeta, IconoEnlaceExterno} from '../icons';
import type {EstadoSuscripcion} from '../../hooks/useConfiguracion';

interface PanelSuscripcionProps {
    suscripcion: EstadoSuscripcion | null;
    userName: string;
    userEmail: string;
}

function formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function obtenerVarianteBadge(estado: string): 'exito' | 'advertencia' | 'error' | 'info' {
    switch (estado) {
        case 'activa':
            return 'exito';
        case 'pendiente':
            return 'advertencia';
        case 'expirada':
        case 'cancelada':
            return 'error';
        default:
            return 'info';
    }
}

function obtenerEtiquetaEstado(estado: string): string {
    switch (estado) {
        case 'activa':
            return 'Activa';
        case 'pendiente':
            return 'Pendiente';
        case 'expirada':
            return 'Expirada';
        case 'cancelada':
            return 'Cancelada';
        default:
            return estado;
    }
}

export function PanelSuscripcion({suscripcion, userName, userEmail}: PanelSuscripcionProps) {
    const porcentajeRestante = suscripcion ? Math.min(100, (suscripcion.diasRestantes / 14) * 100) : 0;

    const esTrial = suscripcion?.diasRestantes && suscripcion.diasRestantes <= 14;

    return (
        <Tarjeta className="capPanelConfig capPanelConfig--suscripcion">
            <TarjetaHeader>
                <div className="capFlexStart capGap--sm">
                    <span className="capPanelConfig__icono capPanelConfig__icono--destacado">
                        <IconoTarjeta />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Suscripción</h3>
                </div>
            </TarjetaHeader>
            <TarjetaBody>
                <div className="capSuscripcionInfo">
                    {/* Estado actual */}
                    <div className="capSuscripcionInfo__fila">
                        <span className="capSuscripcionInfo__etiqueta">Estado</span>
                        <Badge variante={suscripcion ? obtenerVarianteBadge(suscripcion.estado) : 'info'}>{suscripcion ? obtenerEtiquetaEstado(suscripcion.estado) : 'Sin datos'}</Badge>
                    </div>

                    {/* Plan */}
                    <div className="capSuscripcionInfo__fila">
                        <span className="capSuscripcionInfo__etiqueta">Plan</span>
                        <span className="capSuscripcionInfo__valor">{esTrial ? 'Período de prueba (14 días)' : 'Plan Estándar'}</span>
                    </div>

                    {/* Fecha de expiración */}
                    {suscripcion && (
                        <div className="capSuscripcionInfo__fila">
                            <span className="capSuscripcionInfo__etiqueta">{suscripcion.estado === 'activa' ? 'Próxima facturación' : 'Expiró el'}</span>
                            <span className="capSuscripcionInfo__valor">{formatearFecha(suscripcion.fechaFin)}</span>
                        </div>
                    )}

                    {/* Barra de progreso para trial */}
                    {esTrial && suscripcion?.estado === 'activa' && (
                        <div className="capSuscripcionInfo__progreso">
                            <div className="capSuscripcionInfo__progresoHeader">
                                <span className="capTexto capTexto--sm capTexto--secundario">Días restantes de prueba</span>
                                <span className="capTexto capTexto--sm capTexto--primario">{suscripcion.diasRestantes} días</span>
                            </div>
                            <div className="capProgresoBarra">
                                <div className="capProgresoBarra__relleno" style={{width: `${porcentajeRestante}%`}} />
                            </div>
                        </div>
                    )}

                    {/* Datos de cuenta */}
                    <div className="capSuscripcionInfo__separador" />

                    <div className="capSuscripcionInfo__fila">
                        <span className="capSuscripcionInfo__etiqueta">Usuario</span>
                        <span className="capSuscripcionInfo__valor">{userName}</span>
                    </div>

                    <div className="capSuscripcionInfo__fila">
                        <span className="capSuscripcionInfo__etiqueta">Email</span>
                        <span className="capSuscripcionInfo__valor">{userEmail}</span>
                    </div>

                    {/* Botón de gestión */}
                    <div className="capFormConfig__acciones capMt--lg">
                        <Boton variante="outline" tamano="md" disabled={!suscripcion || suscripcion.estado !== 'activa'}>
                            <IconoEnlaceExterno />
                            Gestionar Pagos
                        </Boton>
                        <p className="capTexto capTexto--xs capTexto--terciario capMt--sm">Serás redirigido al portal de pagos de Stripe</p>
                    </div>
                </div>
            </TarjetaBody>
        </Tarjeta>
    );
}

export default PanelSuscripcion;
