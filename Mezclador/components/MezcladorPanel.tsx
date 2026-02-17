/*
 * MezcladorPanel — Contenedor principal del mezclador (Mini DAW)
 * Se renderiza dentro del panel lateral. Contiene controles + timeline.
 * Aislado de la app principal via ErrorBoundary.
 */

import { X, Music2 } from 'lucide-react';
import { useMezclador } from '../hooks/useMezclador';
import { ControlesMezclador } from './ControlesMezclador';
import { Timeline } from './Timeline';
import { useMezcladorStore } from '../stores/mezcladorStore';
import '../styles/mezclador.css';

export const MezcladorPanel = (): JSX.Element | null => {
    const abierto = useMezcladorStore(s => s.abierto);

    if (!abierto) return null;

    return <MezcladorContenido />;
};

/* Contenido separado para que hooks solo se ejecuten cuando está abierto */
const MezcladorContenido = (): JSX.Element => {
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
    } = useMezclador();

    const cerrar = useMezcladorStore(s => s.cerrar);

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
            {/* Cabecera */}
            <div className="mezcladorCabecera">
                <div className="mezcladorCabeceraTitulo">
                    <Music2 size={16} />
                    <span>Mezclador</span>
                    {totalBloques > 0 && (
                        <span className="mezcladorContadorBloques">{totalBloques}</span>
                    )}
                    {estaCargando && (
                        <span className="mezcladorCargando">Cargando...</span>
                    )}
                </div>
                <button className="mezcladorCerrar" onClick={cerrar}>
                    <X size={16} />
                </button>
            </div>

            {/* Controles: play, BPM, compases, export */}
            <ControlesMezclador
                onToggleReproduccion={toggleReproduccion}
                onDescargar={descargarMezcla}
                onPublicar={alPublicar}
                reproduciendo={reproduciendo}
                puedeExportar={puedeExportar}
                exportando={exportando}
            />

            {/* Timeline con pistas */}
            <Timeline
                timelineRef={timelineRef}
                onSeek={seek}
                onIniciarDrag={iniciarDragBloque}
                onDragOver={alDragOver}
                onDrop={alDropExterno}
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
