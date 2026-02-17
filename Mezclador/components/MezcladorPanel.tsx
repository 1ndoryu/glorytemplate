/*
 * MezcladorPanel — Contenedor principal del mezclador (Mini DAW)
 * Se renderiza dentro del panel lateral. Contiene controles + timeline.
 * Aislado de la app principal via ErrorBoundary.
 */

import { PanelRightClose, Download, Upload, FolderUp, Trash2, Loader, Music2, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useMezclador } from '../hooks/useMezclador';
import { ControlesMezclador } from './ControlesMezclador';
import { Timeline } from './Timeline';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import '../styles/mezclador.css';

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
    useEffect(() => { abrir(); }, [abrir]);

    const {
        totalBloques,
        estaCargando,
        exportando,
        toggleReproduccion,
        reproduciendo,
        seek,
        timelineRef,
        iniciarDragBloque,
        alDragOver,
        alDropExterno,
        descargarMezcla,
        obtenerArchivoParaPublicar,
        puedeExportar,
        pistaIdHover,
        dragState,
        posicionDragFantasma,
        duracionBloqueDrag,
    } = useMezclador();

    const cerrarMezclador = useMezcladorStore(s => s.cerrar);
    const cerrarPanel = usePanelLateralStore(s => s.cerrar);
    const agregarAudioLocal = useMezcladorStore(s => s.agregarAudioLocal);
    const limpiarProyecto = useMezcladorStore(s => s.limpiarProyecto);

    /* C241: Estado de expansión del panel */
    const expandido = usePanelLateralStore(s => s.expandido);
    const toggleExpandido = usePanelLateralStore(s => s.toggleExpandido);

    /* C208: Referencia al input de archivo oculto */
    const inputArchivoRef = useRef<HTMLInputElement>(null);

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
         * Disparar evento para que ModalCrear lo recoja.
         * ModalCrear escucha este evento y carga el archivo.
         */
        window.dispatchEvent(new CustomEvent('kamples:publicar-mezcla', {
            detail: { archivo, esMezcla: true },
        }));
    };

    return (
        <div className="mezcladorPanel">
            {/* C233: Cabecera simplificada — acciones de proyecto + cerrar */}
            <div className="mezcladorCabecera">
                <div className="mezcladorCabeceraAcciones">
                    {estaCargando && (
                        <span className="mezcladorCargando">Cargando...</span>
                    )}
                    <button
                        className="mezcladorBotonCabecera"
                        onClick={() => inputArchivoRef.current?.click()}
                        title="Subir audio desde PC"
                    >
                        <FolderUp size={14} />
                    </button>
                    <input
                        ref={inputArchivoRef}
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={alSeleccionarArchivo}
                        style={{ display: 'none' }}
                    />
                    {exportando && <Loader size={14} className="mezcladorSpinner" />}
                    <button
                        className="mezcladorBotonCabecera"
                        onClick={descargarMezcla}
                        disabled={!puedeExportar || exportando}
                        title="Descargar mezcla (1 crédito)"
                    >
                        <Download size={14} />
                    </button>
                    <button
                        className="mezcladorBotonCabecera"
                        onClick={alPublicar}
                        disabled={!puedeExportar || exportando}
                        title="Publicar mezcla"
                    >
                        <Upload size={14} />
                    </button>
                    <button
                        className="mezcladorBotonCabecera mezcladorBotonLimpiar"
                        onClick={limpiarProyecto}
                        title="Limpiar proyecto"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                {/* C241: Botón expandir/contraer + cerrar */}
                <div className="mezcladorCabeceraAcciones">
                    <button
                        className="mezcladorBotonCabecera"
                        onClick={toggleExpandido}
                        title={expandido ? 'Contraer panel' : 'Expandir panel'}
                    >
                        {expandido ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button className="mezcladorCerrar" onClick={cerrar}>
                        <PanelRightClose size={16} />
                    </button>
                </div>
            </div>

            {/* Controles: play, BPM, compases, snap, zoom, cortar */}
            <ControlesMezclador
                onToggleReproduccion={toggleReproduccion}
                reproduciendo={reproduciendo}
            />

            {/* Timeline con pistas */}
            <Timeline
                timelineRef={timelineRef}
                onSeek={seek}
                onIniciarDrag={iniciarDragBloque}
                onDragOver={alDragOver}
                onDrop={alDropExterno}
                pistaIdHover={pistaIdHover}
                dragActivo={dragState.activo}
                bloqueIdDrag={dragState.bloqueId}
                posicionDragFantasma={posicionDragFantasma}
                duracionBloqueDrag={duracionBloqueDrag}
            />

            {/* Área de drop vacía cuando no hay bloques */}
            {totalBloques === 0 && (
                <div
                    className="mezcladorDropZoneVacia"
                    onDragOver={alDragOver}
                    onDrop={(e) => alDropExterno(e)}
                >
                    <Music2 size={24} />
                    <p>Arrastra samples desde el feed para empezar a mezclar</p>
                </div>
            )}
        </div>
    );
};
