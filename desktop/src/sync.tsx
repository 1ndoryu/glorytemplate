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
    haySyncEnCurso,
    limpiarHistorialSync,
    recargarHistorialDesdeStore,
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
        haySyncEnCurso,
        limpiarHistorialSync,
        recargarHistorialDesdeStore,
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

    /* Configurar API con token ya en memoria + inicializar sync service */
    configurarApiDesktop();
    await inicializarSyncService();

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
