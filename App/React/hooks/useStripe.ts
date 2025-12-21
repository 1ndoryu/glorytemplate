/**
 * useStripe
 *
 * Hook para manejar la integracion con Stripe Checkout.
 * Permite crear sesiones de pago y redirigir al checkout.
 *
 * @package App/React/hooks
 */

import {useState, useCallback} from 'react';

declare global {
    interface Window {
        gloryDashboard?: {
            nonce: string;
            apiBase: string;
            isLoggedIn: boolean;
            userId: number;
        };
    }
}

interface CheckoutResult {
    success: boolean;
    sessionId?: string;
    url?: string;
    error?: string;
}

interface PortalResult {
    success: boolean;
    url?: string;
    error?: string;
}

type PlanType = 'monthly' | 'yearly';

interface UseStripeReturn {
    iniciarCheckout: (plan: PlanType) => Promise<boolean>;
    abrirPortalFacturacion: () => Promise<boolean>;
    cargando: boolean;
    error: string | null;
}

/**
 * Hook para integracion con Stripe
 */
export function useStripe(): UseStripeReturn {
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getApiConfig = () => {
        const wpData = window.gloryDashboard;

        /* Verificar que exista la config y el usuario este logueado */
        if (!wpData || !wpData.isLoggedIn || !wpData.nonce) {
            return null;
        }

        /* apiBase apunta a /glory/v1/dashboard, necesitamos /glory/v1/ */
        const baseUrl = wpData.apiBase.replace(/\/dashboard\/?$/, '/');

        return {
            baseUrl,
            nonce: wpData.nonce
        };
    };

    /**
     * Inicia el proceso de checkout para un plan
     */
    const iniciarCheckout = useCallback(async (plan: PlanType): Promise<boolean> => {
        const config = getApiConfig();

        if (!config) {
            setError('Debes iniciar sesion para continuar');
            return false;
        }

        setCargando(true);
        setError(null);

        try {
            const response = await fetch(`${config.baseUrl}stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': config.nonce
                },
                credentials: 'include',
                body: JSON.stringify({plan})
            });

            const data: {success: boolean; data?: CheckoutResult; message?: string} = await response.json();

            if (!data.success) {
                setError(data.message || 'Error al iniciar el pago');
                return false;
            }

            /* Redirigir al checkout de Stripe */
            if (data.data?.url) {
                window.location.href = data.data.url;
                return true;
            }

            setError('No se recibio URL de pago');
            return false;
        } catch (err) {
            const mensaje = err instanceof Error ? err.message : 'Error de conexion';
            setError(mensaje);
            return false;
        } finally {
            setCargando(false);
        }
    }, []);

    /**
     * Abre el portal de facturacion de Stripe
     */
    const abrirPortalFacturacion = useCallback(async (): Promise<boolean> => {
        const config = getApiConfig();

        if (!config) {
            setError('Debes iniciar sesion para continuar');
            return false;
        }

        setCargando(true);
        setError(null);

        try {
            const response = await fetch(`${config.baseUrl}stripe/portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': config.nonce
                },
                credentials: 'include'
            });

            const data: {success: boolean; data?: PortalResult; message?: string} = await response.json();

            if (!data.success) {
                setError(data.message || 'Error al abrir portal de facturacion');
                return false;
            }

            if (data.data?.url) {
                window.location.href = data.data.url;
                return true;
            }

            setError('No se recibio URL del portal');
            return false;
        } catch (err) {
            const mensaje = err instanceof Error ? err.message : 'Error de conexion';
            setError(mensaje);
            return false;
        } finally {
            setCargando(false);
        }
    }, []);

    return {
        iniciarCheckout,
        abrirPortalFacturacion,
        cargando,
        error
    };
}
