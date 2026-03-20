/**
 * PanelSuscripcion
 *
 * Muestra el estado de la suscripción actual y enlace a gestión de pagos.
 * Incluye indicador visual de días restantes y botón de checkout
 * para usuarios que aún no han pagado.
 */

import {useState} from 'react';
import {Boton, Tarjeta, TarjetaHeader, TarjetaBody, Badge, Alerta} from '../ui';
import {IconoTarjeta, IconoEnlaceExterno} from '../icons';
import type {InfoSuscripcion} from '../../hooks/useConfiguracion';
import {CapSuscripcionesEnums} from '../../../../types/_generated/schema';
import {API_BASE} from '../../constants/cap-constants';

interface PanelSuscripcionProps {
    suscripcion: InfoSuscripcion | null;
    userName: string;
    userEmail: string;
    stripeConfigurado?: boolean;
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

function obtenerVarianteBadge(estado: string, haPagado: boolean, diasRestantes: number): 'exito' | 'advertencia' | 'error' | 'info' {
    /* Si no ha pagado y no tiene días restantes, mostrar como error */
    if (!haPagado && diasRestantes <= 0) return 'error';
    switch (estado) {
        case CapSuscripcionesEnums.ESTADO_ACTIVA:
            return 'exito';
        case CapSuscripcionesEnums.ESTADO_PAGO_FALLIDO:
            return 'advertencia';
        case CapSuscripcionesEnums.ESTADO_EXPIRADA:
        case CapSuscripcionesEnums.ESTADO_CANCELADA:
            return 'error';
        default:
            return 'info';
    }
}

function obtenerEtiquetaEstado(estado: string, haPagado: boolean, diasRestantes: number): string {
    /* Si no ha pagado y sin días restantes, mostrar estado descriptivo */
    if (!haPagado && diasRestantes <= 0) return 'Pendiente de pago';
    switch (estado) {
        case CapSuscripcionesEnums.ESTADO_ACTIVA:
            return 'Activa';
        case CapSuscripcionesEnums.ESTADO_PAGO_FALLIDO:
            return 'Pago Fallido';
        case CapSuscripcionesEnums.ESTADO_EXPIRADA:
            return 'Expirada';
        case CapSuscripcionesEnums.ESTADO_CANCELADA:
            return 'Cancelada';
        default:
            return estado;
    }
}

export function PanelSuscripcion({suscripcion, userName, userEmail, stripeConfigurado = false}: PanelSuscripcionProps) {
    const [abriendo, setAbriendo] = useState(false);
    const [suscribiendo, setSuscribiendo] = useState(false);
    const [errorCheckout, setErrorCheckout] = useState<string | null>(null);

    const porcentajeRestante = suscripcion ? Math.min(100, (suscripcion.diasRestantes / 14) * 100) : 0;
    const esTrial = suscripcion && !suscripcion.haPagado && suscripcion.diasRestantes > 0 && suscripcion.diasRestantes <= 14;
    const necesitaPagar = suscripcion && !suscripcion.haPagado;

    /* [2003A-4] Corregido: AbortController para timeout, tipado correcto de window, feedback visible */
    const irACheckout = async () => {
        setSuscribiendo(true);
        setErrorCheckout(null);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const wpWindow = window as unknown as { wpApiSettings?: { nonce?: string } };
            const nonce = wpWindow.wpApiSettings?.nonce || '';
            const resp = await fetch(`${API_BASE}/stripe/checkout`, {
                method: 'POST',
                signal: controller.signal,
                headers: {'X-WP-Nonce': nonce, 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    urlExito: window.location.origin + '/cap-dashboard/?pago=exitoso',
                    urlCancelado: window.location.origin + '/cap-dashboard/?pago=cancelado'
                })
            });
            const data = await resp.json();
            if (resp.ok && data.url) {
                window.location.href = data.url;
            } else {
                setErrorCheckout(data.error || 'No se pudo iniciar el proceso de pago');
            }
        } catch (err) {
            console.error('[PanelSuscripcion] Error iniciando checkout:', err);
            const mensaje = err instanceof DOMException && err.name === 'AbortError'
                ? 'La solicitud tardó demasiado. Intenta de nuevo.'
                : 'Error de conexión al iniciar el pago';
            setErrorCheckout(mensaje);
        } finally {
            clearTimeout(timeout);
            setSuscribiendo(false);
        }
    };

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
                    {errorCheckout && (
                        <Alerta variante="error" className="capMb--md">{errorCheckout}</Alerta>
                    )}

                    {/* Estado actual */}
                    <div className="capSuscripcionInfo__fila">
                        <span className="capSuscripcionInfo__etiqueta">Estado</span>
                        <Badge variante={suscripcion ? obtenerVarianteBadge(suscripcion.estado, suscripcion.haPagado, suscripcion.diasRestantes) : 'info'}>
                            {suscripcion ? obtenerEtiquetaEstado(suscripcion.estado, suscripcion.haPagado, suscripcion.diasRestantes) : 'Sin datos'}
                        </Badge>
                    </div>

                    {/* Plan */}
                    <div className="capSuscripcionInfo__fila">
                        <span className="capSuscripcionInfo__etiqueta">Plan</span>
                        <span className="capSuscripcionInfo__valor">
                            {esTrial ? 'Período de prueba (14 días)' : necesitaPagar ? 'Sin suscripción' : 'Plan Estándar'}
                        </span>
                    </div>

                    {/* Fecha de expiración */}
                    {suscripcion && suscripcion.haPagado && (
                        <div className="capSuscripcionInfo__fila">
                            <span className="capSuscripcionInfo__etiqueta">{suscripcion.estado === CapSuscripcionesEnums.ESTADO_ACTIVA ? 'Próxima facturación' : 'Expiró el'}</span>
                            <span className="capSuscripcionInfo__valor">{formatearFecha(suscripcion.fechaFin)}</span>
                        </div>
                    )}

                    {/* Barra de progreso para trial */}
                    {esTrial && suscripcion?.estado === CapSuscripcionesEnums.ESTADO_ACTIVA && (
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

                    <div className="capFormConfig__acciones capMt--lg">
                        {/* Botón de suscripción para usuarios sin pago */}
                        {necesitaPagar && stripeConfigurado && (
                            <Boton
                                variante="primario"
                                tamano="md"
                                onClick={irACheckout}
                                cargando={suscribiendo}
                                disabled={suscribiendo}
                                className="capMb--sm"
                            >
                                {suscribiendo ? 'Redirigiendo...' : 'Suscribirme Ahora'}
                            </Boton>
                        )}

                        {/* Botón de gestión — solo para usuarios que ya pagaron */}
                        {suscripcion?.haPagado && (
                            <>
                                <Boton
                                    variante="outline"
                                    tamano="md"
                                    disabled={!suscripcion || suscripcion.estado !== CapSuscripcionesEnums.ESTADO_ACTIVA || abriendo}
                                    onClick={async () => {
                                        /* [2003A-4] Corregido: feedback visible al usuario si falla el portal */
                                        setAbriendo(true);
                                        setErrorCheckout(null);
                                        const controller = new AbortController();
                                        const timeout = setTimeout(() => controller.abort(), 15000);
                                        try {
                                            const wpWindow = window as unknown as { wpApiSettings?: { nonce?: string } };
                                            const nonce = wpWindow.wpApiSettings?.nonce || '';
                                            const resp = await fetch(`${API_BASE}/stripe/portal`, {
                                                method: 'POST',
                                                signal: controller.signal,
                                                headers: {'X-WP-Nonce': nonce, 'Content-Type': 'application/json'}
                                            });
                                            const data = await resp.json();
                                            if (resp.ok && data.url) {
                                                window.location.href = data.url;
                                            } else {
                                                setErrorCheckout('No se pudo abrir el portal de pagos');
                                            }
                                        } catch (err) {
                                            console.error('[PanelSuscripcion] Error abriendo portal:', err);
                                            const mensaje = err instanceof DOMException && err.name === 'AbortError'
                                                ? 'La solicitud tardó demasiado. Intenta de nuevo.'
                                                : 'Error de conexión al abrir el portal';
                                            setErrorCheckout(mensaje);
                                        } finally {
                                            clearTimeout(timeout);
                                            setAbriendo(false);
                                        }
                                    }}
                                >
                                    <IconoEnlaceExterno />
                                    {abriendo ? 'Abriendo...' : 'Gestionar Pagos'}
                                </Boton>
                                <p className="capTexto capTexto--xs capTexto--terciario capMt--sm">Serás redirigido al portal de pagos de Stripe</p>
                            </>
                        )}

                        {/* Mensaje si Stripe no está configurado y necesita pagar */}
                        {necesitaPagar && !stripeConfigurado && (
                            <Alerta variante="info">
                                El sistema de pagos no está configurado. Contacta con el administrador.
                            </Alerta>
                        )}
                    </div>
                </div>
            </TarjetaBody>
        </Tarjeta>
    );
}

export default PanelSuscripcion;
