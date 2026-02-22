/*
 * Componente: PanelSincronizacion
 * Panel estilo Google Drive para gestionar sincronización de archivos.
 * Solo se muestra en la versión desktop (Tauri).
 * Funcionalidades: selección de carpeta, estado de sync, lista de archivos.
 */

import { FolderSync, FolderOpen, RefreshCw, Check, AlertCircle, Pause, Loader2, HardDrive, X } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { usePanelSincronizacion } from '@app/hooks/usePanelSincronizacion';
import '../../styles/componentes/sincronizacion.css';

export const PanelSincronizacion = (): JSX.Element | null => {
    const {
        panelAbierto,
        carpetaLocal,
        sincronizacionActiva,
        estado,
        mensajeEstado,
        archivos,
        totalArchivos,
        espacioFormateado,
        ultimaSyncFormateada,
        cerrarPanel,
        elegirCarpeta,
        alternarSincronizacion,
        sincronizarAhora,
    } = usePanelSincronizacion();

    if (!panelAbierto) return null;

    return (
        <>
            <div className="dropdownOverlay" onClick={cerrarPanel} />
            <div className="sincPanel">
                {/* Cabecera */}
                <div className="sincPanelCabecera">
                    <div className="sincPanelTitulo">
                        <FolderSync size={18} />
                        <span>Sincronización</span>
                    </div>
                    <button
                        className="sincPanelCerrar"
                        onClick={cerrarPanel}
                        type="button"
                        aria-label="Cerrar panel"
                    >
                        <X size={16} />
                    </button>
                </div>

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
                            <button
                                className="sincPanelCarpetaCambiar"
                                onClick={elegirCarpeta}
                                type="button"
                            >
                                Cambiar
                            </button>
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
                        <button
                            className={`sincPanelToggle ${sincronizacionActiva ? 'sincPanelToggle--activo' : ''}`}
                            onClick={alternarSincronizacion}
                            type="button"
                            role="switch"
                            aria-checked={sincronizacionActiva}
                        >
                            <span className="sincPanelToggleDot" />
                        </button>
                    </div>
                </div>

                {/* Botón sincronizar ahora */}
                {carpetaLocal && sincronizacionActiva && (
                    <div className="sincPanelSeccion">
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
            </div>
        </>
    );
};

/* Sub-componente: icono según estado de sync */
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

/* Sub-componente: icono de estado de archivo individual */
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

/* Acorta rutas largas: C:\Users\Owner\Music\Kamples → ...Music\Kamples */
function acortarRuta(ruta: string): string {
    if (ruta.length <= 35) return ruta;
    const partes = ruta.replace(/\//g, '\\').split('\\');
    if (partes.length <= 2) return ruta;
    return `...\\${partes.slice(-2).join('\\')}`;
}

/* Formato corto: 1.2 MB, 340 KB */
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

export default PanelSincronizacion;
