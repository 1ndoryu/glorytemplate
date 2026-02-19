/*
 * ControlesMezclador — Play/Stop, BPM, herramientas
 * C285: Simplificado — zoom y compases controlados por MinimapaDaw.
 * Barra superior del mezclador con acciones principales.
 */

import {Play, Square, Scissors, Undo2, Redo2, MoveHorizontal, Crop, LayoutGrid, Sliders, Grid2x2, ListMusic} from 'lucide-react';
import {useMezcladorStore} from '../stores/mezcladorStore';
import {usePatronesStore} from '../stores/patronesStore';
import {useVentanasStore} from '../stores/ventanasStore';
import {FEATURE_FLAGS} from '../featureFlags';
import {InputTempo} from './InputTempo';
import {SongPosition} from './SongPosition';
import {MonitorOnda} from './MonitorOnda';
import {MedidorPicos} from './MedidorPicos';

interface ControlesMezcladorProps {
    onToggleReproduccion: () => void;
    reproduciendo: boolean;
}

export const ControlesMezclador = ({onToggleReproduccion, reproduciendo}: ControlesMezcladorProps): JSX.Element => {
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const setBpm = useMezcladorStore(s => s.setBpm);
    const modoCortarActivo = useMezcladorStore(s => s.modoCortarActivo);
    const toggleModoCortar = useMezcladorStore(s => s.toggleModoCortar);
    const deshacer = useMezcladorStore(s => s.deshacer);
    const rehacer = useMezcladorStore(s => s.rehacer);
    const puedeDeshacer = useMezcladorStore(s => s.puedeDeshacer);
    const puedeRehacer = useMezcladorStore(s => s.puedeRehacer);
    const modoResizeGlobal = useMezcladorStore(s => s.modoResizeGlobal);
    const setModoResizeGlobal = useMezcladorStore(s => s.setModoResizeGlobal);
    /* Solo se leen si el flag está activo, pero los hooks deben llamarse siempre (reglas de React) */
    const modoReproduccion = usePatronesStore(s => s.modoReproduccion);
    const setModoReproduccion = usePatronesStore(s => s.setModoReproduccion);
    const abrirVentana = useVentanasStore(s => s.abrirVentana);

    const abrirChannelRack = () => {
        abrirVentana({id: 'channelRack', tipo: 'channelRack', titulo: 'Channel Rack', posicion: {x: 80, y: 120}});
    };

    const abrirMixer = () => {
        abrirVentana({id: 'mixer', tipo: 'mixer', titulo: 'Mixer', posicion: {x: 100, y: 150}});
    };

    return (
        <div className="mezcladorControles">
            {/* Grupo izquierdo: play + undo/redo + BPM */}
            <div className="mezcladorControlesGrupo">
                <button className={`mezcladorBotonPlay ${reproduciendo ? 'activo' : ''}`} onClick={onToggleReproduccion} title={reproduciendo ? 'Detener' : 'Reproducir'}>
                    {reproduciendo ? <Square size={14} /> : <Play size={14} />}
                </button>

                {/* C224: Undo/Redo */}
                <button className="mezcladorBotonAccion" onClick={deshacer} disabled={!puedeDeshacer()} title="Deshacer (Ctrl+Z)">
                    <Undo2 size={13} />
                </button>
                <button className="mezcladorBotonAccion" onClick={rehacer} disabled={!puedeRehacer()} title="Rehacer (Ctrl+Y)">
                    <Redo2 size={13} />
                </button>

                <div className="mezcladorBpmControl">
                    <InputTempo valor={bpmProyecto} onChange={setBpm} min={40} max={300} etiqueta="BPM" />
                </div>

                {/* C304: Song Position Display */}
                <SongPosition />

                {/* C305+C306: Monitor de onda y Peak meter */}
                <div className="mezcladorVisualizadores">
                    <MonitorOnda activo={reproduciendo} />
                    <MedidorPicos activo={reproduciendo} />
                </div>
            </div>

            {/* C285: Botones de compás y zoom eliminados — ahora en MinimapaDaw */}

            {/* C321: PAT/SONG, Channel Rack, Mixer — controlados por featureFlags */}
            <div className="mezcladorControlesGrupo">
                {FEATURE_FLAGS.modoPatronCancion && (
                    <>
                        <button className={`mezcladorBotonAccion ${modoReproduccion === 'pat' ? 'mezcladorBotonActivo' : ''}`} onClick={() => setModoReproduccion('pat')} title="Modo patrón: reproduce el patrón activo en loop">
                            <Grid2x2 size={13} />
                        </button>
                        <button className={`mezcladorBotonAccion ${modoReproduccion === 'song' ? 'mezcladorBotonActivo' : ''}`} onClick={() => setModoReproduccion('song')} title="Modo canción: reproduce la playlist completa">
                            <ListMusic size={13} />
                        </button>
                    </>
                )}
                {FEATURE_FLAGS.channelRack && (
                    <button className="mezcladorBotonAccion" onClick={abrirChannelRack} title="Abrir Channel Rack">
                        <LayoutGrid size={13} />
                    </button>
                )}
                {FEATURE_FLAGS.mixer && (
                    <button className="mezcladorBotonAccion" onClick={abrirMixer} title="Abrir Mixer">
                        <Sliders size={13} />
                    </button>
                )}
            </div>

            {/* Grupo derecho: herramienta de corte + modo resize */}
            <div className="mezcladorControlesGrupo">
                {/* C214: Botón herramienta de corte */}
                <button className={`mezcladorBotonAccion ${modoCortarActivo ? 'mezcladorBotonActivo' : ''}`} onClick={toggleModoCortar} title={modoCortarActivo ? 'Desactivar corte' : 'Activar herramienta de corte'}>
                    <Scissors size={13} />
                </button>

                {/* C259(2): Toggle stretch/clip al lado del corte */}
                <button className={`mezcladorBotonAccion ${modoResizeGlobal === 'stretch' ? 'mezcladorBotonActivo' : ''}`} onClick={() => setModoResizeGlobal(modoResizeGlobal === 'stretch' ? 'clip' : 'stretch')} title={modoResizeGlobal === 'stretch' ? 'Modo: Stretch (cambia velocidad al redimensionar) — Click para cambiar a Clip' : 'Modo: Clip (recorta al redimensionar) — Click para cambiar a Stretch'}>
                    {modoResizeGlobal === 'stretch' ? <MoveHorizontal size={13} /> : <Crop size={13} />}
                </button>
            </div>
        </div>
    );
};
