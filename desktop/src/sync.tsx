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
import '../../App/Assets/css/init.css';
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

/* Exponer syncService en window para que usePanelSincronizacion funcione */
import {
    elegirCarpetaSync,
    toggleSincronizacion,
    obtenerConfigSync,
    sincronizarConServidor,
    sincronizarSampleIndividual,
    obtenerRutaLocal,
    obtenerEstadoSync,
    marcarNoSincronizarPorId,
    reactivarSync,
    obtenerSamplesNoSincronizados,
    obtenerHistorialSync,
    obtenerColeccionesSync,
    forzarResync,
} from '@desktop/services/syncService';

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
        obtenerEstadoSync,
        marcarNoSincronizarPorId,
        reactivarSync,
        obtenerSamplesNoSincronizados,
        obtenerHistorialSync,
        obtenerColeccionesSync,
        forzarResync,
    };
}

async function inicializar(): Promise<void> {
    configurarEntorno();

    /* Solo configurar API + sync service (no auth completo ni offline queue) */
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
