/*
 * VentanaConfigSync — Ventana independiente de configuracion de sync.
 * Se renderiza como ventana Tauri frameless creada dinámicamente.
 * Tiene su propia barra de título draggable con botones minimize/close.
 *
 * Reutiliza los mismos estilos CSS de configuracionSync.css (.configSyncPanel,
 * .configSyncSeccion, etc.) para mantener consistencia visual.
 *
 * Comunica cambios a la ventana sync via evento Tauri 'config-sync-actualizada'.
 */

import { useCallback } from 'react';
import { X, Minus, RotateCcw, Save, Loader2 } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Checkbox } from '@app/components/ui/Checkbox';
import { Input } from '@app/components/ui/Input';
import { useConfiguracionSyncVentana } from '../hooks/useConfiguracionSyncVentana';

async function minimizarVentana(): Promise<void> {
    try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
    } catch (err) {
        console.error('[ConfigSync] Error minimizando ventana:', err);
    }
}

async function cerrarVentana(): Promise<void> {
    try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().hide();
    } catch (err) {
        console.error('[ConfigSync] Error ocultando ventana:', err);
    }
}

export function VentanaConfigSync(): JSX.Element {
    const {
        config,
        cargando,
        guardando,
        setVelocidadMaxima,
        setArchivosParalelos,
        setBorrarEnServidorAlBorrarLocal,
        setBorrarEnLocalAlBorrarEnServidor,
        setBorrarAlSubirExitoso,
        setPapeleraActiva,
        setPapeleraDuracionDias,
        guardar,
        resetear,
        hayaCambios,
    } = useConfiguracionSyncVentana();

    const guardarYCerrar = useCallback(async () => {
        await guardar();
        await cerrarVentana();
    }, [guardar]);

    if (cargando) {
        return (
            <div className="configSyncPanel configSyncPanelStandalone">
                <div className="configSyncCabecera configSyncCabeceraStandalone">
                    <span className="configSyncTitulo">Configuración de sincronización</span>
                </div>
                <div className="configSyncContenido" style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <Loader2 size={20} className="sincPanelSpinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="configSyncPanel configSyncPanelStandalone">
            {/* Barra de título draggable via CSS app-region (en configuracionSync.css).
                NO usar data-tauri-drag-region en el parent: sobreescribe el CSS no-drag
                de los botones, haciendo que minimize/close no respondan a clicks. */}
            <div className="configSyncCabecera configSyncCabeceraStandalone">
                <span className="configSyncTitulo">Configuración de sincronización</span>
                <div className="configSyncBotonesVentana">
                    <BotonBase
                        variante="ghost"
                        className="configSyncCerrar"
                        onClick={minimizarVentana}
                        type="button"
                        aria-label="Minimizar"
                    >
                        <Minus size={14} />
                    </BotonBase>
                    <BotonBase
                        variante="ghost"
                        className="configSyncCerrar"
                        onClick={cerrarVentana}
                        type="button"
                        aria-label="Cerrar"
                    >
                        <X size={14} />
                    </BotonBase>
                </div>
            </div>

            <div className="configSyncContenido">
                {/* Velocidad máxima */}
                <div className="configSyncSeccion">
                    <label className="configSyncLabel" htmlFor="configVelocidad">
                        Velocidad máxima de subida
                    </label>
                    <span className="configSyncDescripcion">
                        Límite de velocidad en Mbps. 0 = sin límite.
                    </span>
                    <div className="configSyncInputGrupo">
                        {/* sentinel-disable-next-line html-nativo-en-vez-de-componente — No existe componente Slider; range nativo */}
                        <input
                            id="configVelocidad"
                            type="range"
                            className="configSyncSlider"
                            min={0}
                            max={100}
                            step={1}
                            value={config.velocidadMaximaSubidaMbps}
                            onChange={(e) => setVelocidadMaxima(Number(e.target.value))}
                        />
                        <span className="configSyncValor">
                            {config.velocidadMaximaSubidaMbps === 0
                                ? 'Sin límite'
                                : `${config.velocidadMaximaSubidaMbps} Mbps`}
                        </span>
                    </div>
                </div>

                {/* Archivos paralelos */}
                <div className="configSyncSeccion">
                    <label className="configSyncLabel" htmlFor="configParalelos">
                        Archivos paralelos
                    </label>
                    <span className="configSyncDescripcion">
                        Número de archivos que se suben/descargan simultáneamente.
                    </span>
                    <div className="configSyncInputGrupo">
                        {/* sentinel-disable-next-line html-nativo-en-vez-de-componente — No existe componente Slider; range nativo */}
                        <input
                            id="configParalelos"
                            type="range"
                            className="configSyncSlider"
                            min={1}
                            max={5}
                            step={1}
                            value={config.archivosParalelos}
                            onChange={(e) => setArchivosParalelos(Number(e.target.value))}
                        />
                        <span className="configSyncValor">
                            {config.archivosParalelos}
                        </span>
                    </div>
                </div>

                {/* Borrado bidireccional */}
                <div className="configSyncSeccion">
                    <span className="configSyncLabel">Borrado bidireccional</span>
                    <div className="configSyncToggleGrupo">
                        <Checkbox
                            id="configBorrarServidor"
                            className="configSyncToggleLabel"
                            label="Al borrar en local, borrar en el servidor"
                            checked={config.borrarEnServidorAlBorrarLocal}
                            onChange={(e) => setBorrarEnServidorAlBorrarLocal(e.target.checked)}
                        />
                        <Checkbox
                            id="configBorrarLocal"
                            className="configSyncToggleLabel"
                            label="Al borrar en el servidor, borrar en local"
                            checked={config.borrarEnLocalAlBorrarEnServidor}
                            onChange={(e) => setBorrarEnLocalAlBorrarEnServidor(e.target.checked)}
                        />
                    </div>
                </div>

                {/* Borrar al subir */}
                <div className="configSyncSeccion">
                    <span className="configSyncLabel">Subida</span>
                    <div className="configSyncToggleGrupo">
                        <Checkbox
                            id="configBorrarAlSubir"
                            className="configSyncToggleLabel"
                            label="Borrar archivo local después de subir exitosamente"
                            checked={config.borrarAlSubirExitoso}
                            onChange={(e) => setBorrarAlSubirExitoso(e.target.checked)}
                        />
                    </div>
                </div>

                {/* Papelera */}
                <div className="configSyncSeccion">
                    <span className="configSyncLabel">Papelera</span>
                    <div className="configSyncToggleGrupo">
                        <Checkbox
                            id="configPapelera"
                            className="configSyncToggleLabel"
                            label="Activar papelera (los archivos borrados se retienen antes de eliminarse)"
                            checked={config.papeleraActiva}
                            onChange={(e) => setPapeleraActiva(e.target.checked)}
                        />
                    </div>
                    {config.papeleraActiva && (
                        <div className="configSyncInputGrupo configSyncInputGrupoIndentado">
                            <label className="configSyncDescripcion" htmlFor="configPapeleraDias">
                                Días de retención:
                            </label>
                            <Input
                                id="configPapeleraDias"
                                type="number"
                                className="configSyncInputNumero"
                                min={1}
                                max={90}
                                value={config.papeleraDuracionDias}
                                onChange={(e) => setPapeleraDuracionDias(Number(e.target.value))}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="configSyncFooter">
                <BotonBase
                    variante="ghost"
                    className="configSyncBotonResetear"
                    onClick={resetear}
                    type="button"
                >
                    <RotateCcw size={13} />
                    Restaurar
                </BotonBase>
                <div className="configSyncFooterDerecha">
                    <BotonBase variante="ghost" onClick={cerrarVentana} type="button">
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        className="configSyncBotonGuardar"
                        onClick={guardarYCerrar}
                        type="button"
                        disabled={!hayaCambios || guardando}
                    >
                        {guardando ? <Loader2 size={13} className="sincPanelSpinner" /> : <Save size={13} />}
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </BotonBase>
                </div>
            </div>
        </div>
    );
}
