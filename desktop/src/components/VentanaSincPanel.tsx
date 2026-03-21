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
    RefreshCw,
    FolderSync,
    EyeOff,
    Trash2,
    Settings,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ContenedorToasts } from '@app/components/ui/ContenedorToasts';
import { MenuContextual, type MenuItemDef } from '@app/components/ui/MenuContextual';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useSyncStore } from '@app/stores/syncStore';
import { useAuthStore } from '@app/stores/authStore';
import { toast } from '@app/stores/toastStore';
import type { EntradaHistorialSample, EstadoSampleHistorial } from '@app/stores/syncStore';
import '@app/styles/componentes/sincronizacion.css';
import DiagnosticoSync from './DiagnosticoSync';

const VERSION_PORTADA_INTERVALO_MS = 15_000;

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

/* [2003A-38] Estados informativos para el usuario */
function estadoLabel(estado: string): string {
    switch (estado) {
        case 'sincronizando': return 'Sincronizando';
        case 'completado': return 'Sincronizado';
        case 'error': return 'Error';
        case 'pausado': return 'Pausado';
        case 'escaneando': return 'Escaneando';
        default: return 'Listo';
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

function obtenerOrigenServidorSync(): string | null {
    const config = window.__KAMPLES_CONFIG__ as { serverUrl?: string } | undefined;
    const desdeConfig = config?.serverUrl;
    if (desdeConfig && /^https?:\/\//i.test(desdeConfig)) {
        try {
            return new URL(desdeConfig).origin;
        } catch {
            /* continuar con fallback */
        }
    }

    const ctx = window.GLORY_CONTEXT as { apiUrl?: string; restUrl?: string } | undefined;
    const candidata = ctx?.apiUrl ?? ctx?.restUrl;
    if (candidata && /^https?:\/\//i.test(candidata)) {
        try {
            return new URL(candidata).origin;
        } catch {
            return null;
        }
    }

    return null;
}

function anexarVersionPortada(url: string, version: number): string {
    try {
        const urlNormalizada = new URL(url, window.location.href);
        urlNormalizada.searchParams.set('_sv', String(version));
        return urlNormalizada.toString();
    } catch {
        const separador = url.includes('?') ? '&' : '?';
        return `${url}${separador}_sv=${version}`;
    }
}

function resolverUrlPortada(
    url: string | null | undefined,
    timestampActualizado?: number,
): string | null {
    if (!url) return null;

    const versionPortada = Math.max(
        timestampActualizado ?? 0,
        Math.floor(Date.now() / VERSION_PORTADA_INTERVALO_MS) * VERSION_PORTADA_INTERVALO_MS,
    );

    if (/^https?:\/\//i.test(url)) return anexarVersionPortada(url, versionPortada);
    if (url.startsWith('//')) return anexarVersionPortada(`${window.location.protocol}${url}`, versionPortada);

    const origen = obtenerOrigenServidorSync();

    if (url.startsWith('/')) {
        if (origen) return anexarVersionPortada(`${origen}${url}`, versionPortada);
        return anexarVersionPortada(url, versionPortada);
    }

    if (origen) return anexarVersionPortada(`${origen}/${url.replace(/^\/+/, '')}`, versionPortada);
    return anexarVersionPortada(url, versionPortada);
}

function resolverMiniaturaHistorial(entrada: EntradaHistorialSample): string | null {
    const portadaReal = resolverUrlPortada(entrada.imagenUrl, entrada.timestampActualizado);
    if (portadaReal) return portadaReal;
    if (entrada.sampleId > 0) {
        return resolverUrlPortada(obtenerImagenColor(entrada.sampleId), entrada.timestampActualizado);
    }
    return null;
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
        toast.error('No se pudo abrir la configuración de sync');
    }
}

export function VentanaSincPanel(): JSX.Element {
    const {
        sincronizacionActiva,
        carpetaLocal,
        estado,
        mensajeEstado,
        historialSamples,
        elegirCarpeta,
        alternarSincronizacion,
        sincronizarAhora,
        reforzarSyncAhora,
        abrirCarpetaSincronizacion,
        limpiarHistorialLocal,
    } = usePanelSincronizacion();

    const [menu, setMenu] = useState<{ abierto: boolean; x: number; y: number }>({ abierto: false, x: 0, y: 0 });
    const [diagnosticoVisible, setDiagnosticoVisible] = useState(false);
    const [perfilDesktop, setPerfilDesktop] = useState<{
        nombre: string;
        avatarUrl: string | null;
    } | null>(null);

    /* QK77-B: Reaccionar cuando el usuario cambia (login/logout cross-window) */
    const authUsuarioId = useAuthStore(s => s.usuario?.id);

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

    const abrirMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenu({ abierto: true, x: rect.right, y: rect.bottom + 6 });
    }, []);

    const menuItems = useMemo<MenuItemDef[]>(() => [
        {
            id: 'sincronizar',
            etiqueta: 'Sincronizar ahora',
            icono: <FolderSync size={14} />,
            onClick: sincronizarAhora,
        },
        {
            id: 'reforzar-sync',
            etiqueta: 'Reforzar sincronización',
            icono: <RefreshCw size={14} />,
            onClick: reforzarSyncAhora,
        },
        {
            id: 'elegir-carpeta',
            etiqueta: 'Elegir carpeta',
            icono: <FolderOpen size={14} />,
            onClick: elegirCarpeta,
        },
        {
            id: 'abrir-carpeta',
            etiqueta: 'Abrir carpeta',
            icono: <FolderOpen size={14} />,
            onClick: abrirCarpetaSincronizacion,
        },
        {
            id: 'toggle-sync',
            etiqueta: sincronizacionActiva ? 'Pausar sync' : 'Activar sync',
            icono: <PauseCircle size={14} />,
            onClick: alternarSincronizacion,
        },
        {
            id: 'configuracion',
            etiqueta: 'Configuración',
            icono: <Settings size={14} />,
            onClick: () => { void abrirVentanaConfig(); },
        },
        {
            id: 'limpiar-historial',
            etiqueta: 'Limpiar historial',
            icono: <Trash2 size={14} />,
            peligro: true,
            onClick: limpiarHistorialLocal,
        },
        {
            id: 'diagnostico',
            etiqueta: diagnosticoVisible ? 'Ocultar diagnóstico' : 'Diagnóstico sync',
            icono: <Settings size={14} />,
            onClick: () => setDiagnosticoVisible(v => !v),
        },
        {
            id: 'ocultar',
            etiqueta: 'Ocultar panel',
            icono: <EyeOff size={14} />,
            onClick: () => { void ocultarVentana(); },
        },
    ], [
        abrirCarpetaSincronizacion,
        alternarSincronizacion,
        diagnosticoVisible,
        elegirCarpeta,
        limpiarHistorialLocal,
        ocultarVentana,
        reforzarSyncAhora,
        sincronizacionActiva,
        sincronizarAhora,
    ]);

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
                        setMenu(prev => ({ ...prev, abierto: false }));
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

    /* Cargar perfil real desde store desktop (sync window no monta auth completa).
     * QK77-B: Se re-ejecuta cuando authUsuarioId cambia (login/logout cross-window)
     * para mantener nombre y avatar actualizados sin necesidad de reiniciar la app. */
    useEffect(() => {
        let cancelado = false;

        (async () => {
            try {
                /* Primero intentar authStore (actualizado por manejarLoginExterno) */
                const authUsuario = useAuthStore.getState().usuario;
                if (authUsuario && !cancelado) {
                    setPerfilDesktop({
                        nombre: authUsuario.nombreVisible || authUsuario.username || 'Usuario',
                        avatarUrl: authUsuario.avatarUrl ?? null,
                    });
                    return;
                }

                /* Fallback: leer directamente de Tauri Store */
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
    }, [authUsuarioId]);

    return (
        <>
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
                        onClick={(e) => (menu.abierto ? setMenu(prev => ({ ...prev, abierto: false })) : abrirMenu(e))}
                    >
                        <EllipsisVertical size={14} />
                    </BotonBase>

                <MenuContextual
                    abierto={menu.abierto}
                    onCerrar={() => setMenu(prev => ({ ...prev, abierto: false }))}
                    items={menuItems}
                    x={menu.x}
                    y={menu.y}
                    alinearDerecha
                    forzarDropdown
                />
            </div>

            <div className="ventanaSincPanelContenido sincPanelMinimalContenido">
                <div className="sincPanelHistorialMinimal">
                    {historialSamples.length === 0 ? (
                        <div className="sincPanelHistorialVacio" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '100%', textAlign: 'center' }}>
                            {/* [2003A-38] Estado vacío dinámico según contexto */}
                            {!carpetaLocal ? (
                                <>
                                    <span>Selecciona una carpeta para sincronizar</span>
                                    <BotonBase variante="secundario" tamano="sm" onClick={elegirCarpeta} type="button">
                                        <FolderOpen size={14} /> Elegir carpeta
                                    </BotonBase>
                                </>
                            ) : !sincronizacionActiva ? (
                                <>
                                    <span>Sincronización pausada</span>
                                    <BotonBase variante="secundario" tamano="sm" onClick={alternarSincronizacion} type="button">
                                        Activar sincronización
                                    </BotonBase>
                                </>
                            ) : (
                                <>
                                    <span>Sin actividad reciente</span>
                                    <BotonBase variante="secundario" tamano="sm" onClick={sincronizarAhora} type="button">
                                        Sincronizar ahora
                                    </BotonBase>
                                </>
                            )}
                        </div>
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
                                    {resolverMiniaturaHistorial(entrada) ? (
                                        <img
                                            className="sincPanelHistorialThumb"
                                            src={resolverMiniaturaHistorial(entrada) ?? undefined}
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
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* F6.2: Panel de diagnóstico colapsable */}
            {diagnosticoVisible && <DiagnosticoSync />}

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
            <ContenedorToasts />
        </>
    );
}
