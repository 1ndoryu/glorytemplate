/**
 * Paywall
 *
 * Overlay que bloquea el acceso al dashboard cuando el usuario no ha pagado
 * y no tiene período de prueba activo. Muestra un CTA claro para suscribirse.
 *
 * Se muestra cuando:
 * - El usuario no ha pagado (stripe_customer_id vacío)
 * - Y no tiene días de trial restantes (diasRestantes <= 0)
 * - Y Stripe está configurado (hay forma de pagar)
 */

import {useState} from 'react';
import {Boton, Alerta} from '../ui';
import {IconoLogoCap} from '../icons';
import type {InfoSuscripcion} from '../../hooks/useConfiguracion';
import {API_BASE} from '../../constants/cap-constants';
import './paywall.css';

interface PaywallProps {
    suscripcion: InfoSuscripcion;
    userName: string;
    logoutUrl: string;
}

export function Paywall({suscripcion, userName, logoutUrl}: PaywallProps) {
    const [suscribiendo, setSuscribiendo] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const irACheckout = async () => {
        setSuscribiendo(true);
        setError(null);
        try {
            const nonce = (window as any).wpApiSettings?.nonce || '';
            const resp = await fetch(`${API_BASE}/stripe/checkout`, {
                method: 'POST',
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
                setError(data.error || 'No se pudo iniciar el proceso de pago');
            }
        } catch (err) {
            console.error('[Paywall] Error iniciando checkout:', err);
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setSuscribiendo(false);
        }
    };

    const handleCerrarSesion = () => {
        window.location.href = logoutUrl || '/wp-login.php?action=logout';
    };

    /* Determinar si es trial expirado o si nunca tuvo trial */
    const esTrialExpirado = suscripcion.diasRestantes <= 0 && !suscripcion.haPagado;

    return (
        <div className="capPaywall" id="paywallSuscripcion">
            <div className="capPaywall__contenedor">
                <div className="capPaywall__logo">
                    <IconoLogoCap size={48} />
                </div>

                <h1 className="capPaywall__titulo">
                    {esTrialExpirado ? 'Tu período de prueba ha terminado' : 'Suscríbete para continuar'}
                </h1>

                <p className="capPaywall__descripcion">
                    {esTrialExpirado
                        ? `Hola ${userName}, tu acceso gratuito ha expirado. Suscríbete para seguir usando todas las funcionalidades de la plataforma.`
                        : `Hola ${userName}, necesitas una suscripción activa para acceder a la plataforma.`}
                </p>

                {error && (
                    <Alerta variante="error" className="capPaywall__error">{error}</Alerta>
                )}

                <div className="capPaywall__acciones">
                    <Boton
                        variante="primario"
                        tamano="lg"
                        onClick={irACheckout}
                        cargando={suscribiendo}
                        disabled={suscribiendo}
                        anchoCompleto
                    >
                        {suscribiendo ? 'Redirigiendo al pago...' : 'Suscribirme Ahora'}
                    </Boton>

                    <button
                        type="button"
                        className="capPaywall__enlaceSesion"
                        onClick={handleCerrarSesion}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Paywall;
