/*
 * VentanaSincPanel — Componente raiz de la ventana de sincronizacion.
 * Se renderiza como ventana Tauri independiente (sin Modal, sin layout).
 * Reutiliza usePanelSincronizacion y los sub-componentes de tabs existentes.
 *
 * La barra superior es draggable para mover la ventana frameless,
 * y el boton cerrar oculta la ventana (no la destruye).
 */

import { useCallback, useEffect } from 'react';
import { FolderSync, X } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import { useSyncStore } from '@app/stores/syncStore';
import type { TabSync } from '@app/stores/syncStore';
import { TabEstadoSync, TabHistorialSync, TabColeccionesSync } from '@app/components/desktop/SincPanelTabs';
import '@app/styles/componentes/sincronizacion.css';

/* Tabs identicos al panel embebido */
const TABS: { id: TabSync; label: string }[] = [
    { id: 'estado', label: 'Estado' },
    { id: 'historial', label: 'Historial' },
    { id: 'colecciones', label: 'Colecciones' },
];

export function VentanaSincPanel(): JSX.Element {
    const {
        tabActual,
        carpetaLocal,
        sincronizacionActiva,
        estado,
        mensajeEstado,
        archivos,
        totalArchivos,
        espacioFormateado,
        ultimaSyncFormateada,
        historial,
        colecciones,
        cambiarTab,
        elegirCarpeta,
        alternarSincronizacion,
        sincronizarAhora,
        forzarResyncAhora,
    } = usePanelSincronizacion();

    const cerrarPanel = useSyncStore(s => s.cerrarPanel);

    /* Ocultar ventana Tauri en vez de destruirla */
    const ocultarVentana = useCallback(async () => {
        cerrarPanel();
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            await getCurrentWindow().hide();
        } catch {
            /* Fallback si no estamos en Tauri */
        }
    }, [cerrarPanel]);

    /* Auto-ocultar ventana al perder foco (click fuera = cerrar) */
    useEffect(() => {
        let limpiar: (() => void) | undefined;

        (async () => {
            try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const ventana = getCurrentWindow();
                const desuscribir = await ventana.onFocusChanged(({ payload: enfocado }) => {
                    if (!enfocado) {
                        /* Perdi el foco: ocultar la ventana */
                        useSyncStore.getState().cerrarPanel();
                        ventana.hide().catch(() => {});
                    } else {
                        /* Gane el foco: asegurar que el store marca panel abierto */
                        useSyncStore.getState().abrirPanel();
                    }
                });
                limpiar = desuscribir;
            } catch {
                /* Entorno no-Tauri */
            }
        })();

        return () => { limpiar?.(); };
    }, []);

    return (
        <div className="ventanaSincPanel">
            {/* Barra superior draggable (reemplaza decorations del OS) */}
            <div className="ventanaSincPanelBarra" data-tauri-drag-region>
                <div className="sincPanelTitulo">
                    <FolderSync size={16} />
                    <span>Sincronización</span>
                </div>
                <BotonBase
                    variante="ghost"
                    className="sincPanelCerrar"
                    onClick={ocultarVentana}
                    type="button"
                    aria-label="Cerrar panel"
                >
                    <X size={14} />
                </BotonBase>
            </div>

            {/* Tabs */}
            <div className="sincPanelTabs" role="tablist">
                {TABS.map((tab) => (
                    <BotonBase
                        key={tab.id}
                        variante="ghost"
                        className={`sincPanelTab ${tabActual === tab.id ? 'sincPanelTab--activo' : ''}`}
                        onClick={() => cambiarTab(tab.id)}
                        role="tab"
                        aria-selected={tabActual === tab.id}
                        type="button"
                    >
                        {tab.label}
                    </BotonBase>
                ))}
            </div>

            {/* Contenido por tab */}
            <div className="ventanaSincPanelContenido">
                {tabActual === 'estado' && (
                    <TabEstadoSync
                        estado={estado}
                        mensajeEstado={mensajeEstado}
                        ultimaSyncFormateada={ultimaSyncFormateada}
                        carpetaLocal={carpetaLocal}
                        sincronizacionActiva={sincronizacionActiva}
                        archivos={archivos}
                        totalArchivos={totalArchivos}
                        espacioFormateado={espacioFormateado}
                        elegirCarpeta={elegirCarpeta}
                        alternarSincronizacion={alternarSincronizacion}
                        sincronizarAhora={sincronizarAhora}
                        forzarResyncAhora={forzarResyncAhora}
                    />
                )}

                {tabActual === 'historial' && (
                    <TabHistorialSync historial={historial} />
                )}

                {tabActual === 'colecciones' && (
                    <TabColeccionesSync colecciones={colecciones} />
                )}
            </div>
        </div>
    );
}
