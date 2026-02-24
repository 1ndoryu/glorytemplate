/*
 * MezcladorPanel — Contenedor principal del mezclador (Mini DAW)
 * Se renderiza dentro del panel lateral. Contiene controles + timeline.
 * Aislado de la app principal via ErrorBoundary.
 */

import {PanelRightClose, Download, Upload, FolderUp, Trash2, Loader, Maximize2, Minimize2, Settings, PanelLeftOpen, PanelLeftClose} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {useMezclador} from '../hooks/useMezclador';
import {ControlesMezclador} from './ControlesMezclador';
import {ModalConfigDaw} from './ModalConfigDaw';
import {BarraVentanasMinimizadas} from './BarraVentanasMinimizadas';
import {Timeline} from './Timeline';
import {ChannelRack} from './ChannelRack/ChannelRack';
import {MixerConsola} from './Mixer/MixerConsola';
import {PanelBrowserDaw} from './PanelBrowserDaw';
import {useMezcladorStore} from '../stores/mezcladorStore';
import {usePanelLateralStore} from '@app/stores/panelLateralStore';
import {useCrearModalStore} from '@app/stores/crearModalStore';
import {useBrowserDaw} from '../hooks/useBrowserDaw';
import {FEATURE_FLAGS} from '../featureFlags';
/* C293: CSS refactorizado en módulos */
import '../styles/index.css';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Input } from '@app/components/ui/Input';

export const MezcladorPanel = (): JSX.Element => {
    /*
     * La visibilidad la controla PanelLateral.tsx via panelLateralStore.modo === 'mezclador'.
     * No verificamos mezcladorStore.abierto aquí para evitar estado duplicado.
     */
    return <MezcladorContenido />;
};

/* Contenido separado para que hooks solo se ejecuten cuando está abierto */
const MezcladorContenido = (): JSX.Element => {
    /* Sincronizar estado del mezcladorStore al montarse */
    const abrir = useMezcladorStore(s => s.abrir);
    useEffect(() => {
        abrir();
    }, [abrir]);

    const {estaCargando, exportando, toggleReproduccion, reproduciendo, seek, timelineRef, iniciarDragBloque, alDragOver, alDropExterno, descargarMezcla, obtenerArchivoParaPublicar, puedeExportar, pistaIdHover, dragState, posicionDragFantasma, duracionBloqueDrag} = useMezclador();

    const cerrarMezclador = useMezcladorStore(s => s.cerrar);
    const cerrarPanel = usePanelLateralStore(s => s.cerrar);
    const agregarAudioLocal = useMezcladorStore(s => s.agregarAudioLocal);
    const limpiarProyecto = useMezcladorStore(s => s.limpiarProyecto);

    /* C241: Estado de expansión del panel */
    const expandido = usePanelLateralStore(s => s.expandido);
    const toggleExpandido = usePanelLateralStore(s => s.toggleExpandido);

    /* C208: Referencia al input de archivo oculto */
    const inputArchivoRef = useRef<HTMLInputElement>(null);

    /* C253: Modal de configuración del DAW */
    const [modalConfigDawAbierto, setModalConfigDawAbierto] = useState(false);

    /* C307: Browser del DAW */
    const browser = useBrowserDaw();

    /* Cerrar el mezclador Y el panel lateral */
    const cerrar = () => {
        cerrarMezclador();
        cerrarPanel();
    };

    /* C208: Handler para subir archivos de audio desde PC */
    const alSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivos = e.target.files;
        if (!archivos || archivos.length === 0) return;
        for (const archivo of archivos) {
            if (!archivo.type.startsWith('audio/')) continue;
            agregarAudioLocal(archivo);
        }
        e.target.value = '';
    };

    const alPublicar = async () => {
        const archivo = await obtenerArchivoParaPublicar();
        if (!archivo) return;

        /*
         * C254: Abrir ModalCrear con el archivo pre-cargado.
         * El hook useCrearContenido consumirá el archivo del store al montar.
         */
        useCrearModalStore.getState().abrir(archivo, true);
    };

    return (
        <div className="mezcladorPanel">
            {/* C233: Cabecera simplificada — acciones de proyecto + cerrar */}
            <div className="mezcladorCabecera">
                <div className="mezcladorCabeceraAcciones">
                    {estaCargando && <span className="mezcladorCargando">Cargando...</span>}
                    {/* C307: Toggle browser */}
                    <BotonBase variante="ghost" className={`mezcladorBotonCabecera ${browser.abierto ? 'mezcladorBotonActivo' : ''}`} onClick={browser.toggle} title={browser.abierto ? 'Cerrar browser' : 'Abrir browser'}>
                        {browser.abierto ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                    </BotonBase>
                    <BotonBase variante="ghost" className="mezcladorBotonCabecera" onClick={() => inputArchivoRef.current?.click()} title="Subir audio desde PC">
                        <FolderUp size={14} />
                    </BotonBase>
                    <Input ref={inputArchivoRef} type="file" accept="audio/*" multiple onChange={alSeleccionarArchivo} style={{display: 'none'}} />
                    {exportando && <Loader size={14} className="mezcladorSpinner" />}
                    <BotonBase variante="ghost" className="mezcladorBotonCabecera" onClick={descargarMezcla} disabled={!puedeExportar || exportando} title="Descargar mezcla (1 crédito)">
                        <Download size={14} />
                    </BotonBase>
                    <BotonBase variante="ghost" className="mezcladorBotonCabecera" onClick={alPublicar} disabled={!puedeExportar || exportando} title="Publicar mezcla">
                        <Upload size={14} />
                    </BotonBase>
                    <BotonBase variante="ghost" className="mezcladorBotonCabecera mezcladorBotonLimpiar" onClick={limpiarProyecto} title="Limpiar proyecto">
                        <Trash2 size={14} />
                    </BotonBase>
                </div>
                {/* C241+C253: Botón config + expandir/contraer + cerrar */}
                <div className="mezcladorCabeceraAcciones">
                    <BotonBase variante="ghost" className="mezcladorBotonCabecera" onClick={() => setModalConfigDawAbierto(true)} title="Configuración del DAW">
                        <Settings size={14} />
                    </BotonBase>
                    <BotonBase variante="ghost" className="mezcladorBotonCabecera" onClick={toggleExpandido} title={expandido ? 'Contraer panel' : 'Expandir panel'}>
                        {expandido ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </BotonBase>
                    <BotonBase variante="ghost" className="mezcladorCerrar" onClick={cerrar}>
                        <PanelRightClose size={16} />
                    </BotonBase>
                </div>
            </div>

            {/* Controles: play, BPM, compases, snap, zoom, cortar */}
            <ControlesMezclador onToggleReproduccion={toggleReproduccion} reproduciendo={reproduciendo} />

            {/* C307: Cuerpo — browser (opcional) + timeline */}
            <div className="mezcladorCuerpo">
                {browser.abierto && <PanelBrowserDaw carpetas={browser.carpetas} samplesPorCarpeta={browser.samplesPorCarpeta} carpetasExpandidas={browser.carpetasExpandidas} cargando={browser.cargando} onToggleCarpeta={browser.toggleCarpeta} />}

                {/* Timeline con pistas */}
                <Timeline timelineRef={timelineRef} onSeek={seek} onIniciarDrag={iniciarDragBloque} onDragOver={alDragOver} onDrop={alDropExterno} pistaIdHover={pistaIdHover} dragActivo={dragState.activo} bloqueIdDrag={dragState.bloqueId} posicionDragFantasma={posicionDragFantasma} duracionBloqueDrag={duracionBloqueDrag} />
            </div>

            {/* C253: Modal de configuración global del DAW */}
            <ModalConfigDaw abierto={modalConfigDawAbierto} onCerrar={() => setModalConfigDawAbierto(false)} />
            {/* Channel Rack y Mixer como ventanas flotantes — controlados por featureFlags */}
            {FEATURE_FLAGS.channelRack && <ChannelRack />}
            {FEATURE_FLAGS.mixer && <MixerConsola />}
            {/* C287: Barra de ventanas minimizadas (depende de ventanas flotantes) */}
            {FEATURE_FLAGS.ventanasFlotantes && <BarraVentanasMinimizadas />}
        </div>
    );
};
