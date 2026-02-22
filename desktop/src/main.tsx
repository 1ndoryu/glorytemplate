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

/* Sync service — expuesto en window para que el hook en App/React lo consuma sin dynamic imports */
import {
    elegirCarpetaSync,
    toggleSincronizacion,
    obtenerConfigSync,
    sincronizarConServidor,
} from '@desktop/services/syncService';

/* Registrar todas las islas */
islandRegistry.registerAll(appIslands);

/*
 * Mapa de rutas estático.
 * En la web, PHP genera esto dinámicamente via __GLORY_ROUTES__.
 * En desktop, las rutas son fijas y conocidas.
 */
const RUTAS_DESKTOP: Record<string, { island: string; props?: Record<string, unknown> }> = {
    '/': { island: 'InicioIsland' },
    '/auth/login/': { island: 'LoginIsland' },
    '/auth/registro/': { island: 'RegistroIsland' },
    '/perfil/': { island: 'PerfilIsland', props: { username: '' } },
    '/perfil/editar/': { island: 'EditarPerfilIsland' },
    '/libreria/': { island: 'LibreriaIsland' },
    '/descargas/': { island: 'DescargasIsland' },
    '/favoritos/': { island: 'FavoritosIsland' },
    '/reproductor/': { island: 'ReproductorIsland' },
    '/descubrir/': { island: 'DescubrirIsland' },
    '/notificaciones/': { island: 'NotificacionesIsland' },
    '/planes/': { island: 'PlanesIsland' },
    '/comunidad/': { island: 'ComunidadIsland' },
    '/explorador/': { island: 'ExploradorIsland' },
    '/coleccion/': { island: 'ColeccionDetalleIsland', props: { coleccionId: '' } },
    '/mensajes/': { island: 'MensajesIsland' },
    '/mensajes/chat/': { island: 'ChatIsland', props: { conversacionId: '' } },
    '/admin/dashboard/': { island: 'DashboardCreadorIsland' },
    '/admin/panel/': { island: 'AdminPanelIsland' },
    '/sample/': { island: 'SampleDetalleIsland', props: { slug: '' } },
};

/*
 * Convierte las rutas al formato que espera Glory (GloryRoutesMap).
 * El formato es: { '/ruta/': { island: 'NombreIsla', props: {...} } }
 */
function inyectarRutas(): void {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__GLORY_ROUTES__ = RUTAS_DESKTOP;
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

/*
 * Marca el entorno como desktop para que los services puedan bifurcar lógica.
 * Los services de la app (apiCliente, auth, etc.) leen esta flag para:
 * - Usar rutas locales de archivos en vez de URLs remotas
 * - Almacenar tokens en el store seguro de Tauri
 * - Registrar reproducciones offline en queue local
 */
function marcarEntornoDesktop(): void {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__KAMPLES_DESKTOP__ = true;
    (window as any).__KAMPLES_VERSION__ = '0.1.0';
    /* Exponer syncService para que hooks en App/React no necesiten dynamic imports */
    (window as any).__KAMPLES_SYNC__ = {
        elegirCarpetaSync,
        toggleSincronizacion,
        obtenerConfigSync,
        sincronizarConServidor,
    };
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

async function init(): Promise<void> {
    marcarEntornoDesktop();
    inyectarRutas();

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
