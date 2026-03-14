/*
 * Service Worker — Kamples Push Notifications
 * QK86: Recibe eventos push del servidor VAPID y muestra notificaciones nativas.
 *
 * Este archivo debe servirse desde la raíz del dominio (scope: /).
 * En WordPress, se sirve via rewrite rule o se coloca en la raiz del tema.
 */

/* TypeScript: este archivo se ejecuta como Service Worker, no en el contexto React */
/// <reference lib="webworker" />
const sw = self;

/* Recibir push del servidor */
sw.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const datos = event.data.json();
        const titulo = datos.title || 'Kamples';
        const opciones = {
            body: datos.body || '',
            icon: datos.icon || '/wp-content/themes/glorytemplate/App/Assets/images/icon-192.png',
            badge: datos.badge || '/wp-content/themes/glorytemplate/App/Assets/images/badge-72.png',
            data: datos.data || {},
            tag: datos.tag || 'general',
            /* Reemplazar notificaciones del mismo tipo en vez de apilar */
            renotify: true,
            /* Vibrar en Android */
            vibrate: [100, 50, 100],
        };

        event.waitUntil(
            sw.registration.showNotification(titulo, opciones)
        );
    } catch {
        /* Payload no JSON — mostrar notificación genérica */
        event.waitUntil(
            sw.registration.showNotification('Kamples', {
                body: event.data.text(),
            })
        );
    }
});

/* Click en notificación — navegar a la URL del enlace */
sw.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const enlace = event.notification.data?.enlace;
    const url = enlace ? new URL(enlace, sw.location.origin).href : sw.location.origin;

    event.waitUntil(
        sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
            /* Si ya hay una ventana abierta, enfocarla y navegar */
            for (const cliente of clientes) {
                if ('focus' in cliente) {
                    cliente.focus();
                    cliente.postMessage({
                        tipo: 'push-click',
                        enlace: enlace || '/',
                    });
                    return;
                }
            }
            /* Si no hay ventana, abrir una nueva */
            return sw.clients.openWindow(url);
        })
    );
});

/* Activación — tomar control inmediato de las páginas */
sw.addEventListener('activate', (event) => {
    event.waitUntil(sw.clients.claim());
});
