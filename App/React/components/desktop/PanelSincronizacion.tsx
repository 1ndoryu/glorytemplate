/*
 * Componente: PanelSincronizacion
 * Modal sin header para gestionar sincronizacion de archivos (uso in-app).
 * En desktop (Tauri): la ventana standalone VentanaSincPanel se abre desde tray.
 * C358: Tabs estado/historial/colecciones, forzar re-sync.
 * Tabs extraidos a SincPanelTabs.tsx para cumplir limite 300 lineas.
 */

import { BotonBase } from '../ui/BotonBase';
import { Modal } from '../ui/Modal';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import type { TabSync } from '@app/stores/syncStore';
import { TabEstadoSync, TabHistorialSync, TabColeccionesSync } from './SincPanelTabs';
import '../../styles/componentes/sincronizacion.css';

/* Definición de tabs disponibles */
const TABS: { id: TabSync; label: string }[] = [
    { id: 'estado', label: 'Estado' },
    { id: 'historial', label: 'Historial' },
    { id: 'colecciones', label: 'Colecciones' },
];

export const PanelSincronizacion = (): JSX.Element | null => {
    const {
        panelAbierto,
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
        cerrarPanel,
        cambiarTab,
        elegirCarpeta,
        alternarSincronizacion,
        sincronizarAhora,
        forzarResyncAhora,
    } = usePanelSincronizacion();

    return (
        <Modal
            abierto={panelAbierto}
            onCerrar={cerrarPanel}
            tamano="pequeno"
            className="sincPanelModal"
        >
            <div className="sincPanel">
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
        </Modal>
    );
};

export default PanelSincronizacion;
