/*
 * Kamples Desktop — Entry Point
 *
 * Equivalente al main.tsx de Glory pero para Tauri.
 * En vez de depender de PHP para generar rutas y HTML,
 * define las rutas estáticamente e inicializa la app directamente.
 */

/* QL98: Capturar errores globales no manejados para diagnostico en pantalla negra */
window.addEventListener('error', (e) => {
    /* QL129: ResizeObserver loop es warning benigno del browser, no un error real */
    if (e.message?.includes('ResizeObserver loop')) return;
    console.error('[Kamples Desktop] Error global:', e.error ?? e.message);
    const appEl = document.getElementById('app');
    if (appEl && !appEl.children.length) {
        appEl.innerHTML = `<div style="padding:32px;color:#ef4444;font-family:monospace;white-space:pre-wrap;background:#1a1a1a;height:100vh;overflow:auto"><h2>Error no capturado</h2><pre>${e.error?.stack ?? e.message}</pre></div>`;
    }
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('[Kamples Desktop] Promesa rechazada:', e.reason);
    const appEl = document.getElementById('app');
    if (appEl && !appEl.children.length) {
        appEl.innerHTML = `<div style="padding:32px;color:#ef4444;font-family:monospace;white-space:pre-wrap;background:#1a1a1a;height:100vh;overflow:auto"><h2>Promesa rechazada</h2><pre>${e.reason?.stack ?? String(e.reason)}</pre></div>`;
    }
});

/* CSS del framework Glory (index.css incluye tailwind y resets) */
import '@/index.css';

/* Core de Glory: registry, hydration */
import { islandRegistry } from '@/core';
import { initializeIslands } from '@/core/hydration';

/* Islas del proyecto Kamples */
import appIslands, { AppProvider } from '@app/appIslands';

/* Servicios desktop: configuración API, auth, storage */
import { inicializarDesktop } from '@desktop/services/desktopService';
import { guardarToken, guardarUsuario, cerrarSesionDesktop } from '@desktop/services/authDesktopService';
/* Google OAuth PKCE para desktop — inyectado en window para evitar imports cross-project */
import { iniciarGoogleOAuthDesktop } from '@desktop/services/googleAuthDesktopService';
import { iniciarGoogleOAuthMobile } from '@desktop/services/googleAuthMobileService';
import { procesarOAuthGooglePendienteAlArrancar } from '@desktop/services/googleAuthResumeService';

/* Sync service — expuesto en window para que el hook en App/React lo consuma sin dynamic imports */
import {
    elegirCarpetaSync,
    toggleSincronizacion,
    obtenerConfigSync,
    sincronizarConServidor,
    sincronizarSampleIndividual,
    obtenerRutaLocal,
    /* C341: Sync bidireccional — estado de sincronización */
    obtenerEstadoSync,
    marcarNoSincronizarPorId,
    reactivarSync,
    obtenerSamplesNoSincronizados,
    /* C358: Historial y resync */
    obtenerHistorialSync,
    obtenerHistorialSamplesSync,
    obtenerColeccionesSync,
    forzarResync,
    reforzarSync,
    haySyncEnCurso,
    abrirCarpetaSync,
    limpiarHistorialSync,
    recargarHistorialDesdeStore,
    rehidratarImagenesPendientesSync,
} from '@desktop/services/syncService';

/* C341: Upload queue — estado de subidas automáticas */
import {
    obtenerEstadoCola,
    onProgresoUpload,
    reintentarItem,
    eliminarItemCola,
} from '@desktop/services/uploadQueueService';

/* Drag service — expuesto en window para drag-to-DAW/desktop nativo */
import { iniciarDragNativo, descargarYArrastrar, prepararDragNativo, preCachearIconoDrag, estaListoParaDrag, generarPreviewDrag } from '@desktop/services/audioLocalService';

/* Registrar todas las islas */
islandRegistry.registerAll(appIslands);

/*
 * Mapa de rutas estático.
 * En la web, PHP genera esto dinámicamente via __GLORY_ROUTES__.
 * En desktop, las rutas son fijas y conocidas.
 */
const RUTAS_DESKTOP: Record<string, { island: string; props: Record<string, unknown>; title: string; params?: string }> = {
    '/': { island: 'InicioIsland', props: {}, title: 'Inicio' },
    '/auth/login/': { island: 'LoginIsland', props: {}, title: 'Login' },
    '/auth/registro/': { island: 'RegistroIsland', props: {}, title: 'Registro' },
    '/perfil/': { island: 'PerfilIsland', props: { username: '' }, title: 'Perfil', params: ':username' },
    '/perfil/editar/': { island: 'EditarPerfilIsland', props: {}, title: 'Editar Perfil' },
    '/libreria/': { island: 'LibreriaIsland', props: {}, title: 'Libreria' },
    '/descargas/': { island: 'DescargasIsland', props: {}, title: 'Descargas' },
    '/favoritos/': { island: 'FavoritosIsland', props: {}, title: 'Favoritos' },
    '/reproductor/': { island: 'ReproductorIsland', props: {}, title: 'Reproductor' },
    '/descubrir/': { island: 'DescubrirIsland', props: {}, title: 'Descubrir' },
    '/notificaciones/': { island: 'NotificacionesIsland', props: {}, title: 'Notificaciones' },
    '/planes/': { island: 'PlanesIsland', props: {}, title: 'Planes' },
    '/comunidad/': { island: 'ComunidadIsland', props: {}, title: 'Comunidad' },
    '/explorador/': { island: 'ExploradorIsland', props: {}, title: 'Explorador' },
    '/coleccion/': { island: 'ColeccionDetalleIsland', props: { coleccionSlug: '' }, title: 'Coleccion', params: ':coleccionSlug' },
    '/colecciones/': { island: 'ColeccionesIsland', props: {}, title: 'Colecciones' },
    '/mensajes/': { island: 'MensajesIsland', props: {}, title: 'Mensajes' },
    '/mensajes/chat/': { island: 'ChatIsland', props: { conversacionId: '' }, title: 'Chat', params: ':conversacionId' },
    '/admin/dashboard/': { island: 'DashboardCreadorIsland', props: {}, title: 'Dashboard' },
    '/admin/panel/': { island: 'AdminPanelIsland', props: {}, title: 'Admin' },
    '/sample/': { island: 'SampleDetalleIsland', props: { slug: '' }, title: 'Sample', params: ':slug' },
    /* QK104: En movil, / muestra comunidad; /samples/ da acceso directo al feed */
    '/samples/': { island: 'FeedSamplesIsland', props: {}, title: 'Samples' },
    '/musica/': { island: 'ExplorarCancionesIsland', props: {}, title: 'Música' },
    '/cancion/': { island: 'CancionDetalleIsland', props: { slug: '' }, title: 'Canción', params: ':slug' },
    '/sampleo/': { island: 'RelacionDetalleIsland', props: { id: '' }, title: 'Sampleo', params: ':id/:slug?' },
    '/artista/': { island: 'ArtistaDetalleIsland', props: { slug: '' }, title: 'Artista', params: ':slug' },
    '/publicacion/': { island: 'PublicacionIsland', props: { publicacionId: '' }, title: 'Publicación', params: ':publicacionId' },
    '/post/': { island: 'PublicacionIsland', props: { publicacionId: '' }, title: 'Publicación', params: ':publicacionId' },
    /* [183A-110-B] Blog routes — listado y detalle de artículos */
    '/blog/': { island: 'BlogPageIsland', props: { slug: '' }, title: 'Blog', params: ':slug?' },
    '/privacy/': { island: 'PrivacidadIsland', props: {}, title: 'Privacidad' },
    '/terms/': { island: 'TerminosIsland', props: {}, title: 'Términos' },
};

/*
 * Convierte las rutas al formato que espera Glory (GloryRoutesMap).
 * El formato es: { '/ruta/': { island: 'NombreIsla', props: {...} } }
 */
function inyectarRutas(): void {    window.__GLORY_ROUTES__ = RUTAS_DESKTOP;}

async function detectarAndroidTauri(): Promise<boolean> {
    if (/android/i.test(navigator.userAgent)) {
        return true;
    }

    try {
        const { platform } = await import('@tauri-apps/plugin-os');
        return (await platform()) === 'android';
    } catch {
        return false;
    }
}

/*
 * Marca el entorno como desktop para que los services puedan bifurcar lógica.
 * Los services de la app (apiCliente, auth, etc.) leen esta flag para:
 * - Usar rutas locales de archivos en vez de URLs remotas
 * - Almacenar tokens en el store seguro de Tauri
 * - Registrar reproducciones offline en queue local
 */
async function marcarEntornoDesktop(): Promise<void> {    window.__KAMPLES_DESKTOP__ = true;
    window.__KAMPLES_VERSION__ = '0.1.0';
    const esAndroidTauri = await detectarAndroidTauri();

    /*
     * QL17: Inyectar clases de plataforma en <body> para CSS condicional.
     * - plataformaTauri: cualquier build de Tauri (desktop + APK)
     * - plataformaAndroid: solo APK Android
     * - plataformaEscritorio: solo desktop (Windows/Mac/Linux)
     * Uso en CSS: body.plataformaAndroid .miClase { ... }
     */
    document.body.classList.add('plataformaTauri');
    if (esAndroidTauri) {
        document.body.classList.add('plataformaAndroid');
    } else {
        document.body.classList.add('plataformaEscritorio');
    }

    const toggleVentanaSync = async (): Promise<void> => {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('toggle_ventana_sync');
    };

    /* Exponer syncService para que hooks en App/React no necesiten dynamic imports */
    window.__KAMPLES_SYNC__ = {
        elegirCarpetaSync,
        toggleSincronizacion,
        obtenerConfigSync,
        sincronizarConServidor,
        sincronizarSampleIndividual,
        /* Síncrono: verifica si un sample tiene copia local en el índice */
        obtenerRutaLocal,
        /* C341: Sync bidireccional — estado por sample */
        obtenerEstadoSync,
        marcarNoSincronizarPorId,
        reactivarSync,
        obtenerSamplesNoSincronizados,
        /* C358: Historial y resync forzada */
        obtenerHistorialSync,
        obtenerHistorialSamplesSync,
        obtenerColeccionesSync,
        forzarResync,
        reforzarSync,
        haySyncEnCurso,
        abrirCarpetaSync,
        limpiarHistorialSync,
        recargarHistorialDesdeStore,
        rehidratarImagenesPendientesSync,
        toggleVentanaSync,
    };
    /* C341: Upload queue — control de subidas automáticas */
    window.__KAMPLES_UPLOAD__ = {
        obtenerEstadoCola,
        onProgresoUpload,
        reintentarItem,
        eliminarItemCola,
    };
    /* Drag nativo: arrastar samples a DAW/escritorio/apps externas */
    /* [2003A-34] descargarYArrastrar para drag con créditos consumidos */
    window.__KAMPLES_DRAG__ = {
        iniciarDragNativo,
        descargarYArrastrar,
        prepararDragNativo,
        estaListoParaDrag,
        generarPreviewDrag,
    };
    /* Pre-calentar icono de drag para que el primer arrastre sea instantáneo */
    void preCachearIconoDrag();

    /*
     * QK77-A: Interfaz global de persistencia de auth.
     * useAuth.ts (código compartido web/desktop) usa estas funciones en vez
     * de un dynamic import frágil con @vite-ignore que falla silenciosamente.
     * Patrón de inyección de dependencias: desktop registra, shared code consume.
     */
    window.__KAMPLES_AUTH_PERSIST__ = {
        guardarToken,
        guardarUsuario,
        cerrarSesionDesktop,
    };

    const { invoke } = await import('@tauri-apps/api/core');
    window.__KAMPLES_ANDROID_BRIDGE__ = {
        leerTokenFcm: async () => invoke<string | null>('leer_token_fcm_android'),
        leerNavegacionFcmPendiente: async () => invoke<string | null>('leer_navegacion_fcm_pendiente'),
        leerDeepLinkPendiente: async () => invoke<string | null>('leer_deep_link_android_pendiente'),
    };

    /* Google OAuth — Android usa deep links, desktop usa TcpListener local.
     * Mismo patron de inyeccion que AUTH_PERSIST. */
    window.__KAMPLES_GOOGLE_OAUTH__ = esAndroidTauri
        ? iniciarGoogleOAuthMobile
        : iniciarGoogleOAuthDesktop;
}

async function init(): Promise<void> {
    try {
        let oauthGooglePendienteRecuperado = false;
        console.warn('[Kamples Desktop] init() iniciando...');
        await marcarEntornoDesktop();
        inyectarRutas();

        /* F12 → abrir/cerrar DevTools en la app instalada para diagnostico */
        window.addEventListener('keydown', async (e) => {
            if (e.key === 'F12') {
                try {
                    const { invoke } = await import('@tauri-apps/api/core');
                    await invoke('toggle_devtools');
                } catch { /* no-op en web */ }
            }
        });

        console.warn('[Kamples Desktop] inicializarDesktop()...');
        /* Inicializar servicios desktop (auth store, sync, offline queue) */
        await inicializarDesktop();
        oauthGooglePendienteRecuperado = await procesarOAuthGooglePendienteAlArrancar();
        console.warn('[Kamples Desktop] inicializarDesktop() completado');

        console.warn('[Kamples Desktop] initializeIslands()...');
        /* Inicializar el sistema de islas de Glory (hydration + SPA router) */
        initializeIslands({ appProvider: AppProvider });
        console.warn('[Kamples Desktop] initializeIslands() completado');

        if (oauthGooglePendienteRecuperado) {
            const { useNavigationStore } = await import('@/core/router/navigationStore');
            useNavigationStore.getState().navegar('/');
        }
    } catch (err) {
        console.error('[Kamples Desktop] ERROR FATAL en init():', err);
        /* Mostrar error visible en el DOM para diagnostico */
        const container = document.getElementById('app');
        if (container) {
            container.innerHTML = `<div style="padding:32px;color:#ef4444;font-family:monospace;white-space:pre-wrap;background:#1a1a1a;height:100vh;overflow:auto"><h2 style="color:#ef4444">Error de inicializacion Desktop</h2><pre>${err instanceof Error ? `${err.message}\n\n${err.stack}` : String(err)}</pre></div>`;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init().catch(err => console.error('[Kamples Desktop] Unhandled init error:', err)); });
} else {
    init().catch(err => console.error('[Kamples Desktop] Unhandled init error:', err));
}
