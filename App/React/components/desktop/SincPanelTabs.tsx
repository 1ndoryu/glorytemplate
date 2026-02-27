/*
 * Componentes: SincPanelTabs
 * Subcomponentes tab del PanelSincronizacion: Estado, Historial, Colecciones.
 * Extraido de PanelSincronizacion para cumplir limite de 300 lineas.
 */

import {
    FolderSync, FolderOpen, RefreshCw, Check, AlertCircle,
    Pause, Loader2, HardDrive, Clock, Download, Trash2,
    RotateCcw, FolderClosed, ArrowRightLeft,
} from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import type { EntradaHistorial, ColeccionSyncInfo } from '@app/stores/syncStore';

/* Tipos */

export interface ArchivoSync {
    sampleId: number;
    nombre: string;
    ruta: string;
    estado: 'descargado' | 'pendiente' | 'descargando' | 'error';
    tamano: number;
    descargadoEn: number;
}

export interface TabEstadoProps {
    estado: string;
    mensajeEstado: string;
    ultimaSyncFormateada: string;
    carpetaLocal: string | null;
    sincronizacionActiva: boolean;
    archivos: ArchivoSync[];
    totalArchivos: number;
    espacioFormateado: string;
    elegirCarpeta: () => void;
    alternarSincronizacion: () => void;
    sincronizarAhora: () => void;
    forzarResyncAhora: () => void;
}

/* Utilidades de formato */

function acortarRuta(ruta: string): string {
    if (ruta.length <= 35) return ruta;
    const partes = ruta.replace(/\//g, '\\').split('\\');
    if (partes.length <= 2) return ruta;
    return `...\\${partes.slice(-2).join('\\')}`;
}

function formatearTamanoCorto(bytes: number): string {
    if (bytes === 0) return '0 B';
    const unidades = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const valor = bytes / Math.pow(1024, i);
    return `${valor.toFixed(i > 1 ? 1 : 0)} ${unidades[i]}`;
}

function obtenerTextoEstado(estado: string, mensaje: string): string {
    if (mensaje) return mensaje;
    switch (estado) {
        case 'sincronizando': return 'Sincronizando archivos...';
        case 'completado': return 'Todo sincronizado';
        case 'error': return 'Error de sincronización';
        case 'pausado': return 'Sincronización pausada';
        default: return 'Listo para sincronizar';
    }
}

/* Tiempo relativo corto para historial: "hace 5m", "hace 2h", "hace 3d" */
function formatearTiempoRelativoCorto(timestamp: number): string {
    const ahora = Date.now();
    const diff = ahora - timestamp;
    const segundos = Math.floor(diff / 1000);
    if (segundos < 60) return 'ahora';
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `hace ${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias}d`;
}

/* Iconos de estado */

function IconoEstado({ estado }: { estado: string }): JSX.Element {
    switch (estado) {
        case 'sincronizando':
            return <Loader2 size={14} className="sincPanelSpinner" />;
        case 'completado':
            return <Check size={14} />;
        case 'error':
            return <AlertCircle size={14} />;
        case 'pausado':
            return <Pause size={14} />;
        default:
            return <FolderSync size={14} />;
    }
}

function IconoArchivoEstado({ estado }: { estado: string }): JSX.Element {
    switch (estado) {
        case 'descargado':
            return <Check size={12} />;
        case 'descargando':
            return <Loader2 size={12} className="sincPanelSpinner" />;
        case 'error':
            return <AlertCircle size={12} />;
        default:
            return <RefreshCw size={12} />;
    }
}

function IconoHistorial({ tipo }: { tipo: string }): JSX.Element {
    switch (tipo) {
        case 'descarga':
            return <Download size={12} />;
        case 'eliminacion':
        case 'eliminado_local':
            return <Trash2 size={12} />;
        case 'movido':
            return <ArrowRightLeft size={12} />;
        case 'sync':
        case 'renombrado':
            return <RefreshCw size={12} />;
        case 'subida':
        case 'creado':
            return <FolderSync size={12} />;
        default:
            return <Clock size={12} />;
    }
}

/* Tab: Estado */

export function TabEstadoSync({
    estado, mensajeEstado, ultimaSyncFormateada,
    carpetaLocal, sincronizacionActiva, archivos, totalArchivos,
    espacioFormateado, elegirCarpeta, alternarSincronizacion,
    sincronizarAhora, forzarResyncAhora,
}: TabEstadoProps): JSX.Element {
    return (
        <>
            {/* Estado actual */}
            <div className="sincPanelEstado">
                <div className={`sincPanelIndicador sincPanelIndicador--${estado}`}>
                    <IconoEstado estado={estado} />
                    <span>{obtenerTextoEstado(estado, mensajeEstado)}</span>
                </div>
                {ultimaSyncFormateada && (
                    <span className="sincPanelUltimaSync">
                        Última sync: {ultimaSyncFormateada}
                    </span>
                )}
            </div>

            {/* Carpeta de sincronización */}
            <div className="sincPanelSeccion">
                <div className="sincPanelSeccionTitulo">Carpeta local</div>
                {carpetaLocal ? (
                    <div className="sincPanelCarpeta">
                        <FolderOpen size={16} className="sincPanelCarpetaIcono" />
                        <span className="sincPanelCarpetaRuta" title={carpetaLocal}>
                            {acortarRuta(carpetaLocal)}
                        </span>
                        <BotonBase variante="ghost"
                            className="sincPanelCarpetaCambiar"
                            onClick={elegirCarpeta}
                            type="button"
                        >
                            Cambiar
                        </BotonBase>
                    </div>
                ) : (
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        onClick={elegirCarpeta}
                        className="sincPanelElegirCarpeta"
                    >
                        <FolderOpen size={14} />
                        Elegir carpeta
                    </BotonBase>
                )}
            </div>

            {/* Toggle de sincronización */}
            <div className="sincPanelSeccion">
                <div className="sincPanelToggleRow">
                    <span className="sincPanelToggleLabel">Sincronización automática</span>
                    <BotonBase variante="ghost"
                        className={`sincPanelToggle ${sincronizacionActiva ? 'sincPanelToggle--activo' : ''}`}
                        onClick={alternarSincronizacion}
                        type="button"
                        role="switch"
                        aria-checked={sincronizacionActiva}
                    >
                        <span className="sincPanelToggleDot" />
                    </BotonBase>
                </div>
            </div>

            {/* Botones de sincronización */}
            {carpetaLocal && sincronizacionActiva && (
                <div className="sincPanelSeccion sincPanelAcciones">
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        onClick={sincronizarAhora}
                        disabled={estado === 'sincronizando'}
                        className="sincPanelSincAhora"
                    >
                        <RefreshCw
                            size={14}
                            className={estado === 'sincronizando' ? 'sincPanelSpinner' : ''}
                        />
                        {estado === 'sincronizando' ? 'Sincronizando...' : 'Sincronizar ahora'}
                    </BotonBase>
                    <BotonBase
                        variante="ghost"
                        tamano="sm"
                        onClick={forzarResyncAhora}
                        disabled={estado === 'sincronizando'}
                        className="sincPanelResync"
                    >
                        <RotateCcw size={14} />
                        Re-sincronizar todo
                    </BotonBase>
                </div>
            )}

            {/* Lista de archivos sincronizados */}
            {archivos.length > 0 && (
                <div className="sincPanelArchivos">
                    <div className="sincPanelSeccionTitulo">
                        Archivos ({totalArchivos})
                    </div>
                    <div className="sincPanelArchivoLista">
                        {archivos.slice(0, 20).map((archivo) => (
                            <div key={archivo.sampleId} className="sincPanelArchivoItem">
                                <div className="sincPanelArchivoIcono">
                                    <IconoArchivoEstado estado={archivo.estado} />
                                </div>
                                <div className="sincPanelArchivoInfo">
                                    <span className="sincPanelArchivoNombre">{archivo.nombre}</span>
                                    <span className="sincPanelArchivoMeta">
                                        {formatearTamanoCorto(archivo.tamano)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {archivos.length > 20 && (
                            <div className="sincPanelArchivoMas">
                                +{archivos.length - 20} archivos más
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Almacenamiento */}
            <div className="sincPanelFooter">
                <HardDrive size={14} />
                <span>{espacioFormateado} usados</span>
                <span className="sincPanelFooterSep">·</span>
                <span>{totalArchivos} archivos</span>
            </div>
        </>
    );
}

/* Tab: Historial */

export function TabHistorialSync({ historial }: { historial: EntradaHistorial[] }): JSX.Element {
    if (historial.length === 0) {
        return (
            <div className="sincPanelVacio">
                <Clock size={24} />
                <span>Sin actividad reciente</span>
            </div>
        );
    }

    return (
        <div className="sincPanelHistorial">
            {historial.map((entrada, idx) => (
                <div key={`${entrada.timestamp}-${idx}`} className="sincPanelHistorialItem">
                    <div className="sincPanelHistorialIcono">
                        <IconoHistorial tipo={entrada.tipo} />
                    </div>
                    <div className="sincPanelHistorialInfo">
                        <span className="sincPanelHistorialDesc">{entrada.descripcion}</span>
                        <span className="sincPanelHistorialTiempo">
                            {formatearTiempoRelativoCorto(entrada.timestamp)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* Tab: Colecciones */

export function TabColeccionesSync({ colecciones }: { colecciones: ColeccionSyncInfo[] }): JSX.Element {
    if (colecciones.length === 0) {
        return (
            <div className="sincPanelVacio">
                <FolderClosed size={24} />
                <span>Sin colecciones sincronizadas</span>
            </div>
        );
    }

    return (
        <div className="sincPanelColecciones">
            {colecciones.map((col) => {
                const esSuelta = col.id === 0;
                const Icono = esSuelta ? FolderOpen : FolderSync;
                return (
                    <div key={col.id} className={`sincPanelColeccionItem ${esSuelta ? 'sincPanelColeccionItem--suelto' : ''}`}>
                        <Icono size={16} className="sincPanelColeccionIcono" />
                        <div className="sincPanelColeccionInfo">
                            <span className="sincPanelColeccionNombre">{col.nombre}</span>
                            <span className="sincPanelColeccionMeta">
                                {col.archivos} {col.archivos === 1 ? 'archivo' : 'archivos'}
                                {!esSuelta && col.carpetaLocal && ` · ${acortarRuta(col.carpetaLocal)}`}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
