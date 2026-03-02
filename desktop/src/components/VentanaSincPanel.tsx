/*
 * VentanaSincPanel — Componente raiz de la ventana de sincronizacion.
 * Se renderiza como ventana Tauri independiente (sin Modal, sin layout).
 * Reutiliza usePanelSincronizacion y los sub-componentes de tabs existentes.
 *
 * La barra superior es draggable para mover la ventana frameless,
 * y el boton cerrar oculta la ventana (no la destruye).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    EllipsisVertical,
    FolderOpen,
    Loader2,
    PauseCircle,
    CircleDotDashed,
    Music2,
    Layers3,
    RefreshCw,
    XCircle,
    FolderSync,
    EyeOff,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import { useSyncStore } from '@app/stores/syncStore';
import type { EntradaHistorial } from '@app/stores/syncStore';
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
        default: return <CircleDotDashed size={14} />;
    }
}

function estadoLabel(estado: string): string {
    switch (estado) {
        case 'sincronizando': return 'Sincronizando';
        case 'completado': return 'Sincronizado';
        case 'error': return 'Error';
        case 'pausado': return 'Pausado';
        default: return 'Inactivo';
    }
}

function capitalizarPrimera(texto: string): string {
    if (!texto) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function repararMojibake(texto: string): string {
    if (!texto) return '';
    if (!/[ÃÂâ]/.test(texto)) return texto;

    try {
        const bytes = new Uint8Array([...texto].map(c => c.charCodeAt(0) & 0xff));
        const decodificado = new TextDecoder('utf-8').decode(bytes);
        return decodificado.includes('�') ? texto : decodificado;
    } catch {
        return texto;
    }
}

function obtenerIconoEntrada(entrada: EntradaHistorial): JSX.Element {
    const tipo = entrada.tipo.toLowerCase();
    if (tipo.includes('coleccion') || tipo.includes('carpeta')) return <Layers3 size={14} />;
    if (tipo.includes('error') || tipo.includes('elimin')) return <XCircle size={14} />;
    if (tipo.includes('sync') || tipo.includes('renombrado') || tipo.includes('movido')) return <RefreshCw size={14} />;
    return <Music2 size={14} />;
}

function obtenerIconoEstadoFila(entrada: EntradaHistorial): JSX.Element {
    const tipo = entrada.tipo.toLowerCase();
    if (tipo.includes('error') || tipo.includes('elimin')) return <AlertCircle size={13} />;
    if (tipo.includes('sync') || tipo.includes('movido') || tipo.includes('renombrado')) return <Loader2 size={13} className="sincPanelSpinner" />;
    return <CheckCircle2 size={13} />;
}

function obtenerImagenEntrada(entrada: EntradaHistorial): string | null {
    const candidato = entrada as EntradaHistorial & {
        imagenUrl?: string;
        miniaturaUrl?: string;
        coverUrl?: string;
    };

    return candidato.imagenUrl ?? candidato.miniaturaUrl ?? candidato.coverUrl ?? null;
}

export function VentanaSincPanel(): JSX.Element {
    const {
        sincronizacionActiva,
        estado,
        mensajeEstado,
        historial,
        elegirCarpeta,
        alternarSincronizacion,
        sincronizarAhora,
        abrirCarpetaSincronizacion,
    } = usePanelSincronizacion();

    const [menuAbierto, setMenuAbierto] = useState(false);

    const ocultarVentana = useCallback(async () => {
        useSyncStore.getState().cerrarPanel();
        try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            await getCurrentWindow().hide();
        } catch {
            /* Entorno no-Tauri */
        }
    }, []);

    const contexto = window.GLORY_CONTEXT as {
        currentUser?: { nombreVisible?: string; username?: string; avatarUrl?: string | null };
    } | undefined;

    const nombreUsuario = useMemo(
        () => contexto?.currentUser?.nombreVisible ?? contexto?.currentUser?.username ?? 'Usuario',
        [contexto?.currentUser?.nombreVisible, contexto?.currentUser?.username],
    );

    const avatarUsuario = contexto?.currentUser?.avatarUrl ?? null;

    const estadoVisible = capitalizarPrimera(repararMojibake(mensajeEstado || estadoLabel(estado)));

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
                        setMenuAbierto(false);
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
                <div className="sincPanelPerfilBloque">
                    {avatarUsuario ? (
                        <img className="sincPanelPerfilAvatar" src={avatarUsuario} alt={nombreUsuario} />
                    ) : (
                        <div className="sincPanelPerfilAvatar sincPanelPerfilAvatarFallback">
                            {nombreUsuario.slice(0, 1).toUpperCase()}
                        </div>
                    )}
                    <span className="sincPanelPerfilNombre">{nombreUsuario}</span>
                </div>

                <div className="sincPanelMinimalDrag" />

                <BotonBase
                    variante="ghost"
                    className="sincPanelMinimalMenu"
                    type="button"
                    aria-label="Opciones"
                    onClick={() => setMenuAbierto(v => !v)}
                >
                    <EllipsisVertical size={14} />
                </BotonBase>

                {menuAbierto && (
                    <div className="sincPanelMinimalMenuLista">
                        <BotonBase variante="ghost" className="sincPanelMinimalMenuItem" onClick={sincronizarAhora} type="button">
                            <FolderSync size={14} />
                            Sincronizar ahora
                        </BotonBase>
                        <BotonBase variante="ghost" className="sincPanelMinimalMenuItem" onClick={elegirCarpeta} type="button">
                            <FolderOpen size={14} />
                            Elegir carpeta
                        </BotonBase>
                        <BotonBase variante="ghost" className="sincPanelMinimalMenuItem" onClick={abrirCarpetaSincronizacion} type="button">
                            <FolderOpen size={14} />
                            Abrir carpeta
                        </BotonBase>
                        <BotonBase variante="ghost" className="sincPanelMinimalMenuItem" onClick={alternarSincronizacion} type="button">
                            <PauseCircle size={14} />
                            {sincronizacionActiva ? 'Pausar sync' : 'Activar sync'}
                        </BotonBase>
                        <BotonBase variante="ghost" className="sincPanelMinimalMenuItem" onClick={ocultarVentana} type="button">
                            <EyeOff size={14} />
                            Ocultar panel
                        </BotonBase>
                    </div>
                )}
            </div>

            <div className="ventanaSincPanelContenido sincPanelMinimalContenido">
                <div className="sincPanelHistorialMinimal">
                    {historial.length === 0 ? (
                        <div className="sincPanelHistorialVacio">Sin actividad reciente</div>
                    ) : (
                        historial.map((entrada, i) => (
                            <div key={`${entrada.timestamp}-${i}`} className="sincPanelHistorialItemMinimal">
                                <div className="sincPanelHistorialMedia">
                                    {obtenerImagenEntrada(entrada) ? (
                                        <img
                                            className="sincPanelHistorialThumb"
                                            src={obtenerImagenEntrada(entrada) ?? ''}
                                            alt="preview"
                                        />
                                    ) : (
                                        <div className="sincPanelHistorialThumb sincPanelHistorialThumbFallback">
                                            {obtenerIconoEntrada(entrada)}
                                        </div>
                                    )}
                                </div>

                                <div className="sincPanelHistorialContenido">
                                    <span className="sincPanelHistorialDescMinimal">{repararMojibake(entrada.descripcion)}</span>
                                    <span className="sincPanelHistorialTiempoMinimal">{formatearTiempoRelativo(entrada.timestamp)}</span>
                                </div>

                                <div className="sincPanelHistorialEstadoFinal">
                                    {obtenerIconoEstadoFila(entrada)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={`sincPanelFooterMinimal sincPanelIndicador--${estado}`}>
                <div className="sincPanelFooterEstadoMinimal">
                    {iconoEstado(estado)}
                    <span>{estadoVisible}</span>
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
