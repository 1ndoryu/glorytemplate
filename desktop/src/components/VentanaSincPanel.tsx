/*
 * VentanaSincPanel — Componente raiz de la ventana de sincronizacion.
 * Se renderiza como ventana Tauri independiente (sin Modal, sin layout).
 * Reutiliza usePanelSincronizacion y los sub-componentes de tabs existentes.
 *
 * La barra superior es draggable para mover la ventana frameless,
 * y el boton cerrar oculta la ventana (no la destruye).
 */

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, EllipsisVertical, FolderOpen, Loader2, PauseCircle } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import { useSyncStore } from '@app/stores/syncStore';
import '@app/styles/componentes/sincronizacion.css';

function formatearTiempoRelativo(timestamp: number): string {
    const seg = Math.floor((Date.now() - timestamp) / 1000);
    if (seg < 60) return 'ahora';
    const min = Math.floor(seg / 60);
    if (min < 60) return `${min}m`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `${horas}h`;
    return `${Math.floor(horas / 24)}d`;
}

function iconoEstado(estado: string): JSX.Element {
    switch (estado) {
        case 'sincronizando': return <Loader2 size={14} className="sincPanelSpinner" />;
        case 'completado': return <CheckCircle2 size={14} />;
        case 'error': return <AlertCircle size={14} />;
        case 'pausado': return <PauseCircle size={14} />;
        default: return <Loader2 size={14} />;
    }
}

export function VentanaSincPanel(): JSX.Element {
    const {
        estado,
        mensajeEstado,
        historial,
        abrirCarpetaSincronizacion,
    } = usePanelSincronizacion();

    /* Auto-ocultar ventana al perder foco (click fuera = cerrar) */
    useEffect(() => {
        let limpiar: (() => void) | undefined;
        let intervalo: ReturnType<typeof setInterval> | undefined;

        (async () => {
            try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const ventana = getCurrentWindow();
                const ocultarSiPerdioFoco = () => {
                    useSyncStore.getState().cerrarPanel();
                    ventana.hide().catch(() => {});
                };

                const desuscribir = await ventana.onFocusChanged(({ payload: enfocado }) => {
                    if (!enfocado) {
                        /* Perdi el foco: ocultar la ventana */
                        ocultarSiPerdioFoco();
                    } else {
                        /* Gane el foco: asegurar que el store marca panel abierto */
                        useSyncStore.getState().abrirPanel();
                    }
                });

                /* Fallback robusto: algunos entornos no disparan onFocusChanged consistentemente */
                intervalo = setInterval(() => {
                    ventana.isFocused()
                        .then(enfocado => {
                            if (!enfocado && useSyncStore.getState().panelAbierto) {
                                ocultarSiPerdioFoco();
                            }
                        })
                        .catch(() => {});
                }, 180);

                limpiar = desuscribir;
            } catch {
                /* Entorno no-Tauri */
            }
        })();

        return () => {
            limpiar?.();
            if (intervalo) clearInterval(intervalo);
        };
    }, []);

    return (
        <div className="ventanaSincPanel ventanaSincPanelMinimal">
            <div className="sincPanelMinimalTop" data-tauri-drag-region>
                <div className="sincPanelMinimalDrag" />
                <BotonBase
                    variante="ghost"
                    className="sincPanelMinimalMenu"
                    type="button"
                    aria-label="Opciones"
                >
                    <EllipsisVertical size={14} />
                </BotonBase>
            </div>

            <div className="ventanaSincPanelContenido sincPanelMinimalContenido">
                <div className="sincPanelHistorialMinimal">
                    {historial.length === 0 ? (
                        <div className="sincPanelHistorialVacio">Sin actividad reciente</div>
                    ) : (
                        historial.map((entrada, i) => (
                            <div key={`${entrada.timestamp}-${i}`} className="sincPanelHistorialItemMinimal">
                                <span className="sincPanelHistorialDescMinimal">{entrada.descripcion}</span>
                                <span className="sincPanelHistorialTiempoMinimal">{formatearTiempoRelativo(entrada.timestamp)}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`sincPanelFooterMinimal sincPanelIndicador--${estado}`}>
                <div className="sincPanelFooterEstadoMinimal">
                    {iconoEstado(estado)}
                    <span>{mensajeEstado || estado}</span>
                </div>
                <BotonBase
                    variante="ghost"
                    className="sincPanelFooterCarpetaMinimal"
                    onClick={abrirCarpetaSincronizacion}
                    type="button"
                    aria-label="Abrir carpeta de sincronización"
                >
                    <FolderOpen size={15} />
                </BotonBase>
            </div>
        </div>
    );
}
