/*
 * sync.tsx — Entry point de la ventana de sincronizacion.
 * Ventana Tauri independiente (sin layout ni islands system).
 * Renderiza VentanaSincPanel directamente con React.
 *
 * Esta ventana NO inicializa el sistema completo de islas/auth.
 * Solo configura las dependencias minimas para el panel de sync:
 * - CSS variables y estilos
 * - syncService expuesto en window.__KAMPLES_SYNC__
 * - Store Zustand compartido (en memoria, no cross-window)
 */

/* Variables + estilos de UI reutilizados */
import '@app/styles/variables.css';
import '@app/styles/componentes/botonBase.css';
import '@app/styles/componentes/sincronizacion.css';

/* CSS shell de la ventana sync */
import './sync.css';

/* Componente standalone del panel de sincronizacion */
import { VentanaSincPanel } from './components/VentanaSincPanel';

/* Store sync */
import { useSyncStore } from '@app/stores/syncStore';

/* syncService — se inicializa por separado, no via desktopService completo */
import { inicializarSyncService } from '@desktop/services/syncService';

/* Auth: restaurar token JWT del store ANTES de configurar API.
 * Sin esto, configurarApiDesktop() no encuentra token y fetch va sin Authorization → 401. */
import { inicializarAuthDesktop } from '@desktop/services/authDesktopService';
import { escucharCambiosAuth } from '@desktop/services/authDesktopEventos';

/* Exponer syncService en window para que usePanelSincronizacion funcione */
import {
    elegirCarpetaSync,
    toggleSincronizacion,
    obtenerConfigSync,
    sincronizarConServidor,
    sincronizarSampleIndividual,
    obtenerRutaLocal,
    abrirCarpetaSync,
    obtenerEstadoSync,
    marcarNoSincronizarPorId,
    reactivarSync,
    obtenerSamplesNoSincronizados,
    obtenerHistorialSync,
    obtenerHistorialSamplesSync,
    obtenerColeccionesSync,
    forzarResync,
    reforzarSync,
    haySyncEnCurso,
    limpiarHistorialSync,
    recargarHistorialDesdeStore,
    rehidratarImagenesPendientesSync,
} from '@desktop/services/syncService';

/* Cola de subidas — expuesto en window para feedback de uploads */
import {
    obtenerEstadoCola,
    onProgresoUpload,
    reintentarItem,
    eliminarItemCola,
} from '@desktop/services/uploadQueueService';

/* Configurar API base para que las requests apunten al servidor correcto */
import { configurarApiDesktop } from '@desktop/services/apiDesktopAdapter';

import { createRoot } from 'react-dom/client';

/* Marcar entorno desktop y exponer syncService */
function configurarEntorno(): void {
    window.__KAMPLES_DESKTOP__ = true;
    window.__KAMPLES_VERSION__ = '0.1.0';
    window.__KAMPLES_SYNC__ = {
        elegirCarpetaSync,
        toggleSincronizacion,
        obtenerConfigSync,
        sincronizarConServidor,
        sincronizarSampleIndividual,
        obtenerRutaLocal,
        abrirCarpetaSync,
        obtenerEstadoSync,
        marcarNoSincronizarPorId,
        reactivarSync,
        obtenerSamplesNoSincronizados,
        obtenerHistorialSync,
        obtenerHistorialSamplesSync,
        obtenerColeccionesSync,
        forzarResync,
        reforzarSync,
        haySyncEnCurso,
        limpiarHistorialSync,
        recargarHistorialDesdeStore,
        rehidratarImagenesPendientesSync,
    };
    /* Cola de subidas: necesario para que usePanelSincronizacion conecte
     * el callback de progreso de uploads y muestre feedback en vivo. */
    window.__KAMPLES_UPLOAD__ = {
        obtenerEstadoCola,
        onProgresoUpload,
        reintentarItem,
        eliminarItemCola,
    };
}

async function inicializar(): Promise<void> {
    configurarEntorno();

    /* Restaurar token JWT del store de Tauri → sin esto, fetch no tiene Authorization header */
    await inicializarAuthDesktop();

    /* Escuchar cambios de auth de la ventana principal (login/logout cross-window) */
    escucharCambiosAuth();

    /*
     * Exponer origen del servidor para que:
     * 1. configurarApiDesktop() resuelva la URL del servidor correctamente
     *    (obtenerServidorUrl() lee __KAMPLES_CONFIG__ primero)
     * 2. VentanaSincPanel.resolverUrlPortada() resuelva URLs de imágenes
     *    relativas contra el origen real (no tauri://localhost)
     *
     * DEBE ir ANTES de configurarApiDesktop() — si no, obtenerServidorUrl()
     * no encuentra __KAMPLES_CONFIG__ y usa fallback relativo /wp-json
     * que falla en contexto Tauri (resuelve contra tauri://localhost).
     */
    const gloryCtx = window.GLORY_CONTEXT as { apiUrl?: string } | undefined;
    const apiUrl = gloryCtx?.apiUrl ?? '';
    let origenServidor = '';

    if (/^https?:\/\//i.test(apiUrl)) {
        /* URL absoluta (producción): extraer origin */
        try { origenServidor = new URL(apiUrl).origin; } catch { /* fallback abajo */ }
    }

    /* Fallback: en dev, el proxy local redirige a kamples.com (via KAMPLES_API_TARGET) */
    if (!origenServidor) {
        origenServidor = 'https://kamples.com';
    }

    window.__KAMPLES_CONFIG__ = { serverUrl: `${origenServidor}/wp-json` };

    /* Configurar API con token ya en memoria + URL del servidor resuelta */
    configurarApiDesktop();

    /*
     * Inicializar sync service en modo SOLO-LECTURA.
     * La ventana sync-panel solo necesita leer historial y colecciones.
     * El watcher, upload queue y polling los ejecuta la ventana principal.
     * Sin este flag, se duplican watchers → uploads dobles, race conditions
     * en tracking que borran imagenUrl, y colisiones en persistir().
     */
    await inicializarSyncService({ soloLectura: true });

    /* Marcar panel como abierto para que el hook cargue config/datos */
    useSyncStore.getState().abrirPanel();

    /* Montar React */
    const contenedor = document.getElementById('sync-root');
    if (!contenedor) return;

    const root = createRoot(contenedor);
    root.render(<VentanaSincPanel />);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { inicializar(); });
} else {
    inicializar();
}
