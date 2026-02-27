/*
 * sync.tsx — Entry point de la ventana de sincronizacion.
 * Ventana Tauri independiente (sin layout ni islands system).
 * Renderiza VentanaSincPanel directamente con React.
 *
 * Estrategia cross-window:
 * Esta ventana inicializa su propia instancia del syncService.
 * Comparte el Tauri Store (persistente) con la ventana principal,
 * asi ambas leen la misma configuracion de carpeta/activa/etc.
 * El file watcher corre solo en la ventana principal.
 */

/* CSS base: variables, reset, tailwind */
import '@/index.css';

/* Componente standalone del panel de sincronizacion */
import { VentanaSincPanel } from './components/VentanaSincPanel';

/* Servicios desktop: solo los necesarios para sync */
import { inicializarDesktop } from '@desktop/services/desktopService';

/* Store sync — se accede fuera de React para eventos Tauri */
import { useSyncStore } from '@app/stores/syncStore';

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
    await inicializarDesktop();

    /* Marcar panel como abierto para que el hook cargue config/datos */
    useSyncStore.getState().abrirPanel();

    /* Escuchar evento del tray para re-activar cuando se muestra la ventana */
    try {
        const { listen } = await import('@tauri-apps/api/event');
        await listen('abrir-panel-sync', () => {
            useSyncStore.getState().abrirPanel();
        });
    } catch {
        /* Entorno no-Tauri — ignorar */
    }

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
