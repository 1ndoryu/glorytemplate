/*
 * Service Worker — Kamples Push Notifications + Offline Cache
 * QK86: Recibe eventos push del servidor VAPID y muestra notificaciones nativas.
 * 193A-93: Cache offline — estrategia stale-while-revalidate para assets,
 *          network-first para navegación con fallback a página offline inlinada.
 *
 * Este archivo debe servirse desde la raíz del dominio (scope: /).
 * En WordPress, se sirve via rewrite rule o se coloca en la raiz del tema.
 *
 * Gotcha: Un dominio solo puede tener UN SW por scope. Este archivo centraliza
 * push + caching para evitar conflicto de registros múltiples en scope '/'.
 */

/* TypeScript: este archivo se ejecuta como Service Worker, no en el contexto React */
/// <reference lib="webworker" />
const sw = self;

/* [193A-93] Versiones de cache — incrementar cuando cambien assets críticos */
const CACHE_SHELL = 'kamples-shell-v1';
const CACHE_RUNTIME = 'kamples-runtime-v1';

/* [193A-93] Página offline inlinada — sin dependencias externas para máxima fiabilidad */
const HTML_OFFLINE = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Kamples — Sin conexión</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      min-height: 100%;
      background: #070707;
      color: #f5f1e8;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 32px 24px;
      text-align: center;
    }
    .icono {
      width: 80px;
      height: 80px;
      margin-bottom: 28px;
      opacity: 0.55;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      margin-bottom: 12px;
    }
    p {
      font-size: 15px;
      line-height: 1.65;
      opacity: 0.65;
      max-width: 300px;
      margin-bottom: 36px;
    }
    .btn {
      background: #d6c39a;
      color: #070707;
      border: none;
      border-radius: 10px;
      padding: 13px 32px;
      font-size: 15px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:active { opacity: 0.75; }
  </style>
</head>
<body>
  <svg class="icono" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="38" stroke="#f5f1e8" stroke-width="2" stroke-dasharray="6 4"/>
    <path d="M26 54 L54 26M26 26 L54 54" stroke="#f5f1e8" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
  <h1>Sin conexión</h1>
  <p>No hay internet disponible. Conéctate y vuelve a intentarlo.</p>
  <button class="btn" onclick="location.reload()">Reintentar</button>
</body>
</html>`;

/* [193A-93] Install — pre-cachear página offline */
sw.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_SHELL)
            .then((cache) => cache.put(
                '/offline',
                new Response(HTML_OFFLINE, {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                })
            ))
            .then(() => sw.skipWaiting())
    );
});

/* [193A-93] Fetch — interceptar requests para servir desde cache cuando offline */
sw.addEventListener('fetch', (event) => {
    const { request } = event;

    /* Solo interceptar requests del mismo origen */
    let url;
    try {
        url = new URL(request.url);
    } catch {
        return;
    }
    if (url.origin !== self.location.origin) return;

    /* API REST y admin — siempre network-only (datos frescos o falla visible) */
    if (
        url.pathname.startsWith('/wp-json/') ||
        url.pathname.startsWith('/wp-admin/') ||
        url.pathname.startsWith('/wp-login')
    ) return;

    /* Navegación HTML — network-first, fallback a página offline */
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match('/offline').then(
                    (cached) => cached || new Response('Sin conexión', { status: 503 })
                )
            )
        );
        return;
    }

    /* Assets estáticos (JS, CSS, imágenes, fuentes) — stale-while-revalidate */
    const destino = request.destination;
    if (
        destino === 'script' ||
        destino === 'style' ||
        destino === 'image' ||
        destino === 'font' ||
        destino === 'audio'
    ) {
        event.respondWith(
            caches.open(CACHE_RUNTIME).then((cache) =>
                cache.match(request).then((cached) => {
                    const networkPromise = fetch(request)
                        .then((response) => {
                            if (response.ok) {
                                /* Guardar copia fresca en background */
                                cache.put(request, response.clone()).catch(() => {});
                            }
                            return response;
                        })
                        .catch(() => cached);
                    /* Servir cache inmediatamente si existe, actualizar en background */
                    return cached || networkPromise;
                })
            )
        );
        return;
    }
});

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

/* [QK86 + 193A-93] Activación — limpiar caches obsoletos y tomar control inmediato */
sw.addEventListener('activate', (event) => {
    const cachesActivos = new Set([CACHE_SHELL, CACHE_RUNTIME]);
    event.waitUntil(
        caches.keys()
            .then((nombres) =>
                Promise.all(
                    nombres
                        .filter((n) => !cachesActivos.has(n))
                        .map((n) => caches.delete(n))
                )
            )
            .then(() => sw.clients.claim())
    );
});
