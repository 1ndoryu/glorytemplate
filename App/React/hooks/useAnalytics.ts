/**
 * Hook para tracking de eventos con GTM/GA4.
 * Envia eventos al dataLayer para que GTM los procese.
 * Solo funciona si el usuario ha aceptado cookies de analitica.
 */

// Declaracion global para TypeScript
declare global {
    interface Window {
        dataLayer: Record<string, unknown>[];
    }
}

type AnalyticsEvent = {
    event: string;
    [key: string]: unknown;
};

/**
 * Envia un evento al dataLayer de GTM.
 * Si dataLayer no existe (GTM no cargado), el evento se descarta silenciosamente.
 */
function pushEvent(eventData: AnalyticsEvent): void {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push(eventData);
    }
}

/**
 * Eventos predefinidos para el tracking de conversion.
 * Estos eventos deben configurarse en GTM para activar las etiquetas correspondientes.
 */
export const analytics = {
    /**
     * Trackea click en enlace de WhatsApp.
     * Trigger: Click en cualquier enlace que contenga "wa.me" o "api.whatsapp.com"
     */
    trackWhatsAppClick: (ctaText: string, pageLocation: string = window.location.pathname): void => {
        pushEvent({
            event: 'click_whatsapp',
            cta_text: ctaText,
            page_location: pageLocation
        });
    },

    /**
     * Trackea click en enlace de Calendly.
     * Trigger: Click en cualquier enlace que contenga "calendly.com"
     */
    trackCalendlyClick: (ctaText: string, pageLocation: string = window.location.pathname): void => {
        pushEvent({
            event: 'click_calendly',
            cta_text: ctaText,
            page_location: pageLocation
        });
    },

    /**
     * Trackea envio exitoso del formulario de contacto.
     * Trigger: Formulario enviado correctamente (despues de validacion)
     */
    trackFormSubmit: (formService: string, pageLocation: string = window.location.pathname): void => {
        pushEvent({
            event: 'lead_form_submit',
            form_service: formService,
            page_location: pageLocation
        });
    },

    /**
     * Trackea cuando Calendly confirma una cita.
     * Nota: Requiere escuchar el evento de Calendly (calendly.event_scheduled)
     */
    trackCalendlyScheduled: (pageLocation: string = window.location.pathname): void => {
        pushEvent({
            event: 'schedule_calendly',
            page_location: pageLocation
        });
    }
};

/**
 * Hook de conveniencia que retorna las funciones de tracking.
 * Uso: const { trackWhatsAppClick } = useAnalytics();
 */
export function useAnalytics() {
    return analytics;
}
