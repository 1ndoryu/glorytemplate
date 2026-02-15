/*
 * Componente: ModalFiltros — Kamples
 * Modal con filtros avanzados de samples (tipo, key, BPM, escala).
 * Reemplaza los filtros inline que estaban en SamplesIsland.
 */

import { useCallback, type ChangeEvent } from 'react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import '../../styles/componentes/modalFiltros.css';

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TIPOS = ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'];

interface ModalFiltrosProps {
    abierto: boolean;
    onCerrar: () => void;
}

export const ModalFiltros = ({ abierto, onCerrar }: ModalFiltrosProps): JSX.Element | null => {
    const { tipo, key, bpmMin, bpmMax, setTipo, setKey, setBpmRango, resetearFiltros } = useFiltrosStore();

    const manejarTipo = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setTipo(e.target.value as never || undefined);
    }, [setTipo]);

    const manejarKey = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setKey(e.target.value as never || undefined);
    }, [setKey]);

    const manejarBpmMin = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || undefined;
        setBpmRango(val, bpmMax);
    }, [setBpmRango, bpmMax]);

    const manejarBpmMax = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || undefined;
        setBpmRango(bpmMin, val);
    }, [setBpmRango, bpmMin]);

    const manejarReset = useCallback(() => {
        resetearFiltros();
    }, [resetearFiltros]);

    return (
        <Modal abierto={abierto} onCerrar={onCerrar}>
            <div className="filtrosContenido">
                <h3 className="filtrosTitulo">Filtros</h3>

                <div className="filtrosGrupo">
                    <label className="filtrosLabel">Tipo</label>
                    <select
                        className="filtrosSelect"
                        value={tipo ?? ''}
                        onChange={manejarTipo}
                    >
                        <option value="">Todos</option>
                        {TIPOS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className="filtrosGrupo">
                    <label className="filtrosLabel">Key</label>
                    <select
                        className="filtrosSelect"
                        value={key ?? ''}
                        onChange={manejarKey}
                    >
                        <option value="">Todas</option>
                        {NOTAS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                <div className="filtrosGrupo">
                    <label className="filtrosLabel">BPM</label>
                    <div className="filtrosRango">
                        <input
                            className="filtrosRangoInput"
                            type="number"
                            placeholder="Min"
                            min={40}
                            max={300}
                            value={bpmMin ?? ''}
                            onChange={manejarBpmMin}
                        />
                        <span className="filtrosRangoSeparador">—</span>
                        <input
                            className="filtrosRangoInput"
                            type="number"
                            placeholder="Max"
                            min={40}
                            max={300}
                            value={bpmMax ?? ''}
                            onChange={manejarBpmMax}
                        />
                    </div>
                </div>

                <div className="filtrosAcciones">
                    <BotonBase variante="ghost" onClick={manejarReset}>
                        Limpiar filtros
                    </BotonBase>
                    <BotonBase variante="primario" onClick={onCerrar}>
                        Aplicar
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};

export default ModalFiltros;
