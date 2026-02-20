/**
 * usePanelStripeUI
 *
 * Hook para estado de UI del panel Stripe.
 * Maneja visibilidad de claves secretas, copia de webhook URL
 * y limpieza automática de mensajes.
 */

import {useState, useEffect} from 'react';

interface UsePanelStripeUIParams {
    exito: string | null;
    error: string | null;
    limpiarMensajes: () => void;
    webhookUrl?: string;
}

export function usePanelStripeUI({exito, error, limpiarMensajes, webhookUrl}: UsePanelStripeUIParams) {
    const [mostrarTestSecret, setMostrarTestSecret] = useState(false);
    const [mostrarLiveSecret, setMostrarLiveSecret] = useState(false);
    const [mostrarWebhookSecret, setMostrarWebhookSecret] = useState(false);
    const [copiado, setCopiado] = useState(false);
    const [errorCopia, setErrorCopia] = useState<string | null>(null);

    /* Limpiar mensajes del hook useStripe después de 4 segundos */
    useEffect(() => {
        if (!exito && !error) return;

        const timeoutId = window.setTimeout(() => {
            limpiarMensajes();
        }, 4000);

        return () => window.clearTimeout(timeoutId);
    }, [exito, error, limpiarMensajes]);

    /* Limpiar error de copia después de 3 segundos */
    useEffect(() => {
        if (!errorCopia) return;

        const timeoutId = window.setTimeout(() => {
            setErrorCopia(null);
        }, 3000);

        return () => window.clearTimeout(timeoutId);
    }, [errorCopia]);

    /* Copiar URL de webhook al portapapeles */
    const copiarWebhookUrl = async () => {
        if (!webhookUrl) return;

        try {
            await navigator.clipboard.writeText(webhookUrl);
            setErrorCopia(null);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 2000);
        } catch (err) {
            console.error('[PanelStripe] Error copiando URL de webhook', err);
            setErrorCopia('No se pudo copiar la URL. Copia manualmente el valor mostrado.');
        }
    };

    return {
        mostrarTestSecret,
        setMostrarTestSecret,
        mostrarLiveSecret,
        setMostrarLiveSecret,
        mostrarWebhookSecret,
        setMostrarWebhookSecret,
        copiado,
        errorCopia,
        copiarWebhookUrl,
    };
}
