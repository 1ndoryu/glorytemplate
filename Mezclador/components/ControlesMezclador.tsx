/*
 * ControlesMezclador — Play/Stop, BPM, compases, exportar
 * Barra superior del mezclador con todas las acciones
 */

import { Play, Square, Plus, Minus, Download, Upload, Trash2, Loader } from 'lucide-react';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface ControlesMezcladorProps {
    onToggleReproduccion: () => void;
    onDescargar: () => void;
    onPublicar: () => void;
    reproduciendo: boolean;
    puedeExportar: boolean;
    exportando: boolean;
}

export const ControlesMezclador = ({
    onToggleReproduccion,
    onDescargar,
    onPublicar,
    reproduciendo,
    puedeExportar,
    exportando,
}: ControlesMezcladorProps): JSX.Element => {
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const setBpm = useMezcladorStore(s => s.setBpm);
    const agregarCompas = useMezcladorStore(s => s.agregarCompas);
    const quitarCompas = useMezcladorStore(s => s.quitarCompas);
    const limpiarProyecto = useMezcladorStore(s => s.limpiarProyecto);

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

            {/* Grupo centro: compases */}
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
            </div>

            {/* Grupo derecho: exportar + limpiar */}
            <div className="mezcladorControlesGrupo">
                {exportando && <Loader size={14} className="mezcladorSpinner" />}
                <button
                    className="mezcladorBotonAccion"
                    onClick={onDescargar}
                    disabled={!puedeExportar || exportando}
                    title="Descargar mezcla (1 crédito)"
                >
                    <Download size={13} />
                </button>
                <button
                    className="mezcladorBotonAccion"
                    onClick={onPublicar}
                    disabled={!puedeExportar || exportando}
                    title="Publicar mezcla"
                >
                    <Upload size={13} />
                </button>
                <button
                    className="mezcladorBotonAccion mezcladorBotonLimpiar"
                    onClick={limpiarProyecto}
                    title="Limpiar proyecto"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};
