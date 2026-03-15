/*
 * Kamples Desktop — Entry Point
 *
 * Equivalente al main.tsx de Glory pero para Tauri.
 * En vez de depender de PHP para generar rutas y HTML,
 * define las rutas estáticamente e inicializa la app directamente.
 */

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
import { iniciarDragNativo } from '@desktop/services/audioLocalService';

/* Registrar todas las islas */
islandRegistry.registerAll(appIslands);

/*
 * Mapa de rutas estático.
 * En la web, PHP genera esto dinámicamente via __GLORY_ROUTES__.
 * En desktop, las rutas son fijas y conocidas.
 */
const RUTAS_DESKTOP: Record<string, { island: string; props: Record<string, unknown>; title: string }> = {
    '/': { island: 'InicioIsland', props: {}, title: 'Inicio' },
    '/auth/login/': { island: 'LoginIsland', props: {}, title: 'Login' },
    '/auth/registro/': { island: 'RegistroIsland', props: {}, title: 'Registro' },
    '/perfil/': { island: 'PerfilIsland', props: { username: '' }, title: 'Perfil' },
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
    '/coleccion/': { island: 'ColeccionDetalleIsland', props: { coleccionSlug: '' }, title: 'Coleccion' },
    '/colecciones/': { island: 'ColeccionesIsland', props: {}, title: 'Colecciones' },
    '/mensajes/': { island: 'MensajesIsland', props: {}, title: 'Mensajes' },
    '/mensajes/chat/': { island: 'ChatIsland', props: { conversacionId: '' }, title: 'Chat' },
    '/admin/dashboard/': { island: 'DashboardCreadorIsland', props: {}, title: 'Dashboard' },
    '/admin/panel/': { island: 'AdminPanelIsland', props: {}, title: 'Admin' },
    '/sample/': { island: 'SampleDetalleIsland', props: { slug: '' }, title: 'Sample' },
    /* QK104: En movil, / muestra comunidad; /samples/ da acceso directo al feed */
    '/samples/': { island: 'FeedSamplesIsland', props: {}, title: 'Samples' },
    '/musica/': { island: 'ExplorarCancionesIsland', props: {}, title: 'Música' },
    '/cancion/': { island: 'CancionDetalleIsland', props: { slug: '' }, title: 'Canción' },
    '/sampleo/': { island: 'RelacionDetalleIsland', props: { id: '' }, title: 'Sampleo' },
    '/artista/': { island: 'ArtistaDetalleIsland', props: { slug: '' }, title: 'Artista' },
    '/publicacion/': { island: 'PublicacionIsland', props: { publicacionId: '' }, title: 'Publicación' },
    '/privacy/': { island: 'PrivacidadIsland', props: {}, title: 'Privacidad' },
    '/terms/': { island: 'TerminosIsland', props: {}, title: 'Términos' },
};

/*
 * Convierte las rutas al formato que espera Glory (GloryRoutesMap).
 * El formato es: { '/ruta/': { island: 'NombreIsla', props: {...} } }
 */
function inyectarRutas(): void {    window.__GLORY_ROUTES__ = RUTAS_DESKTOP;}

/*
 * Marca el entorno como desktop para que los services puedan bifurcar lógica.
 * Los services de la app (apiCliente, auth, etc.) leen esta flag para:
 * - Usar rutas locales de archivos en vez de URLs remotas
 * - Almacenar tokens en el store seguro de Tauri
 * - Registrar reproducciones offline en queue local
 */
function marcarEntornoDesktop(): void {    window.__KAMPLES_DESKTOP__ = true;
    window.__KAMPLES_VERSION__ = '0.1.0';

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
    window.__KAMPLES_DRAG__ = {
        iniciarDragNativo,
    };

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

    /* Google OAuth PKCE — expuesto via window para que useAuth.ts (código compartido)
     * no necesite importar código Tauri directamente. Mismo patrón que AUTH_PERSIST. */
    window.__KAMPLES_GOOGLE_OAUTH__ = iniciarGoogleOAuthDesktop;
}

async function init(): Promise<void> {
    marcarEntornoDesktop();
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

    /* Inicializar servicios desktop (auth store, sync, offline queue) */
    await inicializarDesktop();

    /* Inicializar el sistema de islas de Glory (hydration + SPA router) */
    initializeIslands({ appProvider: AppProvider });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); });
} else {
    init();
}
