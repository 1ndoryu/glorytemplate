/*
 * Componente: PanelSincronizacion
 * Panel estilo Google Drive para gestionar sincronización de archivos.
 * Solo se muestra en la versión desktop (Tauri).
 * C358: Tabs estado/historial/colecciones, forzar re-sync.
 */

import {
    FolderSync, FolderOpen, RefreshCw, Check, AlertCircle,
    Pause, Loader2, HardDrive, X, Clock, Download, Trash2,
    RotateCcw, FolderClosed, ArrowRightLeft,
} from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import type { TabSync, EntradaHistorial, ColeccionSyncInfo } from '@app/stores/syncStore';
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

    if (!panelAbierto) return null;

    return (
        <>
            {/* sentinel-disable-next-line componente-artesanal — panel dropdown posicionado, no un modal centrado */}
            <div className="dropdownOverlay" onClick={cerrarPanel} />
            <div className="sincPanel">
                {/* Cabecera */}
                <div className="sincPanelCabecera">
                    <div className="sincPanelTitulo">
                        <FolderSync size={18} />
                        <span>Sincronización</span>
                    </div>
                    <BotonBase variante="ghost"
                        className="sincPanelCerrar"
                        onClick={cerrarPanel}
                        type="button"
                        aria-label="Cerrar panel"
                    >
                        <X size={16} />
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
                {tabActual === 'estado' && (
                    <TabEstado
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
                    <TabHistorial historial={historial} />
                )}

                {tabActual === 'colecciones' && (
                    <TabColecciones colecciones={colecciones} />
                )}
            </div>
        </>
    );
};

/* ──────────────────────────────────────── Tab: Estado ──────────────────────────────────────── */

interface ArchivoSync {
    sampleId: number;
    nombre: string;
    ruta: string;
    estado: 'descargado' | 'pendiente' | 'descargando' | 'error';
    tamano: number;
    descargadoEn: number;
}

interface TabEstadoProps {
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

function TabEstado({
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

/* ──────────────────────────────────────── Tab: Historial ──────────────────────────────────────── */

function TabHistorial({ historial }: { historial: EntradaHistorial[] }): JSX.Element {
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

function IconoHistorial({ tipo }: { tipo: string }): JSX.Element {
    switch (tipo) {
        case 'descarga':
            return <Download size={12} />;
        case 'eliminacion':
            return <Trash2 size={12} />;
        case 'mover':
            return <ArrowRightLeft size={12} />;
        case 'sync':
            return <RefreshCw size={12} />;
        default:
            return <Clock size={12} />;
    }
}

/* ──────────────────────────────────────── Tab: Colecciones ──────────────────────────────────────── */

function TabColecciones({ colecciones }: { colecciones: ColeccionSyncInfo[] }): JSX.Element {
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
            {colecciones.map((col) => (
                <div key={col.id} className="sincPanelColeccionItem">
                    <FolderSync size={16} className="sincPanelColeccionIcono" />
                    <div className="sincPanelColeccionInfo">
                        <span className="sincPanelColeccionNombre">{col.nombre}</span>
                        <span className="sincPanelColeccionMeta">
                            {col.archivos} {col.archivos === 1 ? 'archivo' : 'archivos'}
                            {col.carpetaLocal && ` · ${acortarRuta(col.carpetaLocal)}`}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ──────────────────────────────────── Utilidades internas ──────────────────────────────────── */

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

export default PanelSincronizacion;
