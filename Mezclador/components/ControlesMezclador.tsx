/*
 * ControlesMezclador — Play/Stop, BPM, compases, exportar, subir audio
 * Barra superior del mezclador con todas las acciones
 */

import { Play, Square, Plus, Minus, Scissors, ZoomIn, ZoomOut, Undo2, Redo2, MoveHorizontal, Crop } from 'lucide-react';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface ControlesMezcladorProps {
    onToggleReproduccion: () => void;
    reproduciendo: boolean;
}

export const ControlesMezclador = ({
    onToggleReproduccion,
    reproduciendo,
}: ControlesMezcladorProps): JSX.Element => {
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const setBpm = useMezcladorStore(s => s.setBpm);
    const agregarCompas = useMezcladorStore(s => s.agregarCompas);
    const quitarCompas = useMezcladorStore(s => s.quitarCompas);
    const modoCortarActivo = useMezcladorStore(s => s.modoCortarActivo);
    const toggleModoCortar = useMezcladorStore(s => s.toggleModoCortar);
    const nivelZoom = useMezcladorStore(s => s.nivelZoom);
    const zoomIn = useMezcladorStore(s => s.zoomIn);
    const zoomOut = useMezcladorStore(s => s.zoomOut);
    const deshacer = useMezcladorStore(s => s.deshacer);
    const rehacer = useMezcladorStore(s => s.rehacer);
    const puedeDeshacer = useMezcladorStore(s => s.puedeDeshacer);
    const puedeRehacer = useMezcladorStore(s => s.puedeRehacer);
    const modoResizeGlobal = useMezcladorStore(s => s.modoResizeGlobal);
    const setModoResizeGlobal = useMezcladorStore(s => s.setModoResizeGlobal);

    const alCambiarBpm = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = parseInt(e.target.value, 10);
        if (!isNaN(valor)) setBpm(valor);
    };

    return (
        <div className="mezcladorControles">
            {/* Grupo izquierdo: play + BPM */}
            <div className="mezcladorControlesGrupo">
                <button
                    className={`mezcladorBotonPlay ${reproduciendo ? 'activo' : ''}`}
                    onClick={onToggleReproduccion}
                    title={reproduciendo ? 'Detener' : 'Reproducir'}
                >
                    {reproduciendo ? <Square size={14} /> : <Play size={14} />}
                </button>

                {/* C224: Undo/Redo */}
                <button
                    className="mezcladorBotonAccion"
                    onClick={deshacer}
                    disabled={!puedeDeshacer()}
                    title="Deshacer (Ctrl+Z)"
                >
                    <Undo2 size={13} />
                </button>
                <button
                    className="mezcladorBotonAccion"
                    onClick={rehacer}
                    disabled={!puedeRehacer()}
                    title="Rehacer (Ctrl+Y)"
                >
                    <Redo2 size={13} />
                </button>

                <div className="mezcladorBpmControl">
                    <input
                        type="number"
                        className="mezcladorBpmInput"
                        value={bpmProyecto}
                        onChange={alCambiarBpm}
                        min={40}
                        max={300}
                    />
                    <span className="mezcladorBpmLabel">BPM</span>
                </div>
            </div>

            {/* Grupo centro: compases + snap + zoom */}
            <div className="mezcladorControlesGrupo">
                <button
                    className="mezcladorBotonCompas"
                    onClick={quitarCompas}
                    title="Quitar compás"
                >
                    <Minus size={12} />
                </button>
                <span className="mezcladorCompasContador">
                    {totalCompases} comp.
                </span>
                <button
                    className="mezcladorBotonCompas"
                    onClick={agregarCompas}
                    title="Añadir compás"
                >
                    <Plus size={12} />
                </button>

                <span className="mezcladorSeparadorVertical" />

                {/* C217: Zoom */}
                <button
                    className="mezcladorBotonCompas"
                    onClick={zoomOut}
                    title="Alejar"
                >
                    <ZoomOut size={12} />
                </button>
                <span className="mezcladorZoomLabel">{Math.round(nivelZoom * 100)}%</span>
                <button
                    className="mezcladorBotonCompas"
                    onClick={zoomIn}
                    title="Acercar"
                >
                    <ZoomIn size={12} />
                </button>
            </div>

            {/* Grupo derecho: herramienta de corte + modo resize */}
            <div className="mezcladorControlesGrupo">
                {/* C214: Botón herramienta de corte */}
                <button
                    className={`mezcladorBotonAccion ${modoCortarActivo ? 'mezcladorBotonActivo' : ''}`}
                    onClick={toggleModoCortar}
                    title={modoCortarActivo ? 'Desactivar corte' : 'Activar herramienta de corte'}
                >
                    <Scissors size={13} />
                </button>

                {/* C259(2): Toggle stretch/clip al lado del corte */}
                <button
                    className={`mezcladorBotonAccion ${modoResizeGlobal === 'stretch' ? 'mezcladorBotonActivo' : ''}`}
                    onClick={() => setModoResizeGlobal(modoResizeGlobal === 'stretch' ? 'clip' : 'stretch')}
                    title={modoResizeGlobal === 'stretch' ? 'Modo: Stretch (cambia velocidad al redimensionar) — Click para cambiar a Clip' : 'Modo: Clip (recorta al redimensionar) — Click para cambiar a Stretch'}
                >
                    {modoResizeGlobal === 'stretch' ? <MoveHorizontal size={13} /> : <Crop size={13} />}
                </button>
            </div>
        </div>
    );
};
