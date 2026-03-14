/*
 * Componente: ConfiguracionSync
 * Panel modal de configuracion avanzada de sincronizacion.
 * Se renderiza como overlay centrado sobre VentanaSincPanel.
 *
 * Opciones:
 * - Velocidad maxima de subida (Mbps, 0 = sin limite)
 * - Archivos paralelos (1-5)
 * - Borrado bidireccional (local→servidor, servidor→local)
 * - Papelera (activar/desactivar + duracion en dias)
 */

import { useCallback, useEffect, useRef } from 'react';
import { X, RotateCcw, Save, Loader2 } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Checkbox } from '@app/components/ui/Checkbox';
import { Input } from '@app/components/ui/Input';
import { useConfiguracionSync } from '../hooks/useConfiguracionSync';
import '@app/styles/componentes/configuracionSync.css';

interface ConfiguracionSyncProps {
    abierto: boolean;
    onCerrar: () => void;
}

export function ConfiguracionSync({ abierto, onCerrar }: ConfiguracionSyncProps): JSX.Element | null {
    const {
        config,
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
    } = useConfiguracionSync();

    const panelRef = useRef<HTMLDivElement>(null);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!abierto) return;
        const manejarTecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };
        document.addEventListener('keydown', manejarTecla);
        return () => document.removeEventListener('keydown', manejarTecla);
    }, [abierto, onCerrar]);

    /* Cerrar al hacer click fuera del panel */
    const manejarClickOverlay = useCallback((e: React.MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
            onCerrar();
        }
    }, [onCerrar]);

    const guardarYCerrar = useCallback(async () => {
        await guardar();
        onCerrar();
    }, [guardar, onCerrar]);

    if (!abierto) return null;

    return (
        /* sentinel-disable-next-line componente-artesanal — Modal usa createPortal al body; aquí necesitamos overlay inline dentro del panel Tauri */
        <div className="configSyncOverlay" onClick={manejarClickOverlay} role="dialog" aria-modal="true">
            <div className="configSyncPanel" ref={panelRef}>
                <div className="configSyncCabecera">
                    <span className="configSyncTitulo">Configuración de sincronización</span>
                    <BotonBase variante="ghost" className="configSyncCerrar" onClick={onCerrar} type="button" aria-label="Cerrar">
                        <X size={14} />
                    </BotonBase>
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
                        <BotonBase variante="ghost" onClick={onCerrar} type="button">
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
        </div>
    );
}
