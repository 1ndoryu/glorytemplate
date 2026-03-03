/*
 * VentanaSincPanel — Componente raiz de la ventana de sincronizacion.
 * Se renderiza como ventana Tauri independiente (sin Modal, sin layout).
 * Reutiliza usePanelSincronizacion y los sub-componentes de tabs existentes.
 *
 * La barra superior es draggable para mover la ventana frameless,
 * y el boton cerrar oculta la ventana (no la destruye).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    EllipsisVertical,
    FolderOpen,
    Loader2,
    PauseCircle,
    CircleDotDashed,
    Music2,
    RefreshCw,
    FolderSync,
    EyeOff,
    Trash2,
    ArrowRight,
    Settings,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import { useSyncStore } from '@app/stores/syncStore';
import type { EntradaHistorialSample, EstadoSampleHistorial } from '@app/stores/syncStore';
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

/* Helpers para el historial per-sample */

function etiquetaEstadoSample(estado: EstadoSampleHistorial | string): string {
    switch (estado) {
        case 'detectado': return 'Detectado';
        case 'subiendo': return 'Subiendo';
        case 'sincronizado': return 'Sincronizado';
        case 'error': return 'Error';
        case 'moviendo': return 'Moviendo';
        case 'descargando': return 'Descargando';
        case 'descargado': return 'Descargado';
        default: return capitalizarPrimera(estado);
    }
}

function iconoEstadoSample(estado: EstadoSampleHistorial | string): JSX.Element {
    switch (estado) {
        case 'detectado': return <CircleDotDashed size={13} />;
        case 'subiendo':
        case 'descargando':
        case 'moviendo':
            return <Loader2 size={13} className="sincPanelSpinner" />;
        case 'sincronizado':
        case 'descargado':
            return <CheckCircle2 size={13} />;
        case 'error': return <AlertCircle size={13} />;
        default: return <Music2 size={13} />;
    }
}

function claseEstadoSample(estado: EstadoSampleHistorial | string): string {
    switch (estado) {
        case 'error': return 'sincPanelEstadoError';
        case 'subiendo':
        case 'descargando':
        case 'moviendo':
            return 'sincPanelEstadoProgreso';
        case 'sincronizado':
        case 'descargado':
            return 'sincPanelEstadoOk';
        default: return '';
    }
}

/* Seleccionar un archivo en el explorador del sistema (resaltado en su carpeta) */
async function abrirArchivoEnExplorador(rutaLocal: string): Promise<void> {
    try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('seleccionar_archivo', { ruta: rutaLocal });
    } catch {
        /* Silencioso: entorno no-Tauri o error de permisos */
    }
}

/* Abre la ventana independiente de configuración de sync via comando Rust */
async function abrirVentanaConfig(): Promise<void> {
    try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('mostrar_ventana_config');
    } catch (err) {
        console.error('[ConfigSync] Error abriendo ventana de configuracion:', err);
    }
}

export function VentanaSincPanel(): JSX.Element {
    const {
        sincronizacionActiva,
        estado,
        mensajeEstado,
        historialSamples,
        elegirCarpeta,
        alternarSincronizacion,
        sincronizarAhora,
        abrirCarpetaSincronizacion,
        limpiarHistorialLocal,
    } = usePanelSincronizacion();

    const [menuAbierto, setMenuAbierto] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const botonMenuRef = useRef<HTMLDivElement>(null);
    const [perfilDesktop, setPerfilDesktop] = useState<{
        nombre: string;
        avatarUrl: string | null;
    } | null>(null);

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

    const nombreUsuario = useMemo(() => {
        if (perfilDesktop?.nombre) return perfilDesktop.nombre;
        return contexto?.currentUser?.nombreVisible ?? contexto?.currentUser?.username ?? 'Usuario';
    }, [perfilDesktop?.nombre, contexto?.currentUser?.nombreVisible, contexto?.currentUser?.username]);

    const avatarUsuario = perfilDesktop?.avatarUrl ?? contexto?.currentUser?.avatarUrl ?? null;

    const estadoVisible = capitalizarPrimera(repararMojibake(mensajeEstado || estadoLabel(estado)));

    /* Cerrar menú al hacer click fuera (delegado al documento) */
    useEffect(() => {
        if (!menuAbierto) return;
        const cerrarMenu = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                menuRef.current && !menuRef.current.contains(target) &&
                botonMenuRef.current && !botonMenuRef.current.contains(target)
            ) {
                setMenuAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrarMenu);
        return () => document.removeEventListener('mousedown', cerrarMenu);
    }, [menuAbierto]);

    /* Sincronizar estado del store y auto-hide al perder foco.
     * El backend Rust tiene un handler equivalente con 220ms delay.
     * Este handler frontend actua como fallback (ej: binario no recompilado). */
    useEffect(() => {
        let desuscribir: (() => void) | undefined;
        (async () => {
            try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const ventana = getCurrentWindow();
                desuscribir = await ventana.onFocusChanged(({ payload: enfocado }) => {
                    if (!enfocado) {
                        setMenuAbierto(false);
                        /* Auto-hide: delay para no interferir con toggle del tray icon.
                         * Si el tray handler ya mostrara la ventana, isFocused() sera true
                         * y el hide no se ejecuta. */
                        setTimeout(async () => {
                            try {
                                const sigueEnfocado = await ventana.isFocused();
                                if (!sigueEnfocado) {
                                    useSyncStore.getState().cerrarPanel();
                                    await ventana.hide();
                                }
                            } catch { /* Silencioso */ }
                        }, 300);
                    } else {
                        useSyncStore.getState().abrirPanel();
                    }
                });
            } catch {
                /* Entorno no-Tauri */
            }
        })();
        return () => desuscribir?.();
    }, []);

    /* Cargar perfil real desde store desktop (sync window no monta auth completa) */
    useEffect(() => {
        let cancelado = false;

        (async () => {
            try {
                const { load } = await import('@tauri-apps/plugin-store');
                const store = await load('auth.json');
                const usuario = await store.get<Record<string, unknown>>('auth_usuario');
                if (!usuario || cancelado) return;

                const nombre =
                    (usuario.nombreVisible as string | undefined)
                    ?? (usuario.nombre_display as string | undefined)
                    ?? (usuario.username as string | undefined)
                    ?? '';

                const avatarRaw =
                    (usuario.avatarUrl as string | undefined)
                    ?? (usuario.avatar_url as string | undefined)
                    ?? null;

                setPerfilDesktop({
                    nombre: nombre || 'Usuario',
                    avatarUrl: avatarRaw && avatarRaw.trim() !== '' ? avatarRaw : null,
                });
            } catch {
                /* Si falla el store, usar fallback de GLORY_CONTEXT */
            }
        })();

        return () => {
            cancelado = true;
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

                <div ref={botonMenuRef} style={{ display: 'contents' }}>
                    <BotonBase
                        variante="ghost"
                        className="sincPanelMinimalMenu"
                        type="button"
                        aria-label="Opciones"
                        onClick={() => setMenuAbierto(v => !v)}
                    >
                        <EllipsisVertical size={14} />
                    </BotonBase>
                </div>

                {menuAbierto && (
                    <div className="sincPanelMinimalMenuLista" ref={menuRef}>
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
                        <BotonBase variante="ghost" className="sincPanelMinimalMenuItem" onClick={() => { setMenuAbierto(false); abrirVentanaConfig(); }} type="button">
                            <Settings size={14} />
                            Configuración
                        </BotonBase>
                        <BotonBase variante="ghost" className="sincPanelMinimalMenuItem sincPanelMinimalMenuItemPeligro" onClick={limpiarHistorialLocal} type="button">
                            <Trash2 size={14} />
                            Limpiar historial
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
                    {historialSamples.length === 0 ? (
                        <div className="sincPanelHistorialVacio">Sin actividad reciente</div>
                    ) : (
                        historialSamples.map((entrada) => (
                            <div
                                key={`${entrada.sampleId}-${entrada.nombreArchivo}`}
                                className={`sincPanelHistorialItemMinimal ${entrada.rutaLocal ? 'sincPanelHistorialClickable' : ''}`}
                                onClick={entrada.rutaLocal ? () => abrirArchivoEnExplorador(entrada.rutaLocal!) : undefined}
                                role={entrada.rutaLocal ? 'button' : undefined}
                                tabIndex={entrada.rutaLocal ? 0 : undefined}
                                onKeyDown={entrada.rutaLocal ? (e) => { if (e.key === 'Enter') abrirArchivoEnExplorador(entrada.rutaLocal!); } : undefined}
                            >
                                <div className="sincPanelHistorialMedia">
                                    {entrada.imagenUrl ? (
                                        <img
                                            className="sincPanelHistorialThumb"
                                            src={entrada.imagenUrl}
                                            alt={repararMojibake(entrada.nombreArchivo)}
                                        />
                                    ) : (
                                        <div className="sincPanelHistorialThumb sincPanelHistorialThumbFallback">
                                            <Music2 size={14} />
                                        </div>
                                    )}
                                </div>

                                <div className="sincPanelHistorialContenido">
                                    <span className="sincPanelHistorialDescMinimal">
                                        {repararMojibake(entrada.nombreArchivo)}
                                    </span>
                                    <span className={`sincPanelHistorialEstadoLabel ${claseEstadoSample(entrada.estado)}`}>
                                        {etiquetaEstadoSample(entrada.estado as EstadoSampleHistorial)}
                                        {entrada.error ? ` — ${entrada.error}` : ''}
                                    </span>
                                </div>

                                <div className="sincPanelHistorialEstadoFinal">
                                    {iconoEstadoSample(entrada.estado as EstadoSampleHistorial)}
                                </div>

                                {entrada.rutaLocal && (
                                    <div className="sincPanelHistorialNavegar">
                                        <ArrowRight size={12} />
                                    </div>
                                )}
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
