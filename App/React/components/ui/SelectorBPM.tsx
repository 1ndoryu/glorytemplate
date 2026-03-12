/*
 * SelectorBPM — Kamples (C116)
 * Selector de rango BPM con inputs min/max.
 * Estilo consistente con SelectFiltro (menu contextual style).
 * Lógica extraída a useSelectorBPM hook.
 */

import { ChevronDown, X } from 'lucide-react';
import { useSelectorBPM } from '../../hooks/useSelectorBPM';
import '../../styles/componentes/selectFiltro.css';
import { BotonBase } from './BotonBase';
import { CampoTexto } from './CampoTexto';

export interface SelectorBPMProps {
    bpmMin: number | null;
    bpmMax: number | null;
    onCambiar: (min: number | null, max: number | null) => void;
}

export const SelectorBPM = ({
    bpmMin,
    bpmMax,
    onCambiar,
}: SelectorBPMProps): JSX.Element => {
    const {
        abierto,
        minLocal,
        maxLocal,
        activo,
        etiquetaTexto,
        contenedorRef,
        setMinLocal,
        setMaxLocal,
        toggleAbierto,
        limpiar,
        manejarKeyDown,
        aplicarYCerrar,
    } = useSelectorBPM({ bpmMin, bpmMax, onCambiar });

    return (
        <div className="selectFiltro" ref={contenedorRef}>
            <BotonBase variante="ghost"
                type="button"
                className={`selectFiltroBoton ${activo ? 'selectFiltroBotonActivo' : ''}`}
                onClick={toggleAbierto}
                aria-expanded={abierto}
            >
                <span className="selectFiltroEtiqueta">{etiquetaTexto}</span>
                {activo
                    ? <X size={12} className="selectFiltroFlecha" onClick={limpiar} />
                    : <ChevronDown size={12} className={`selectFiltroFlecha ${abierto ? 'selectFiltroFlechaAbierta' : ''}`} />
                }
            </BotonBase>

            {abierto && (
                <div className="selectFiltroMenu selectorBPMMenu">
                    <div className="selectorBPMCampos">
                        <label className="selectorBPMLabel">
                            <span>Min</span>
                            <CampoTexto
                                type="number"
                                variante="desnudo"
                                className="selectorBPMInput"
                                value={minLocal}
                                onChange={(e) => setMinLocal((e.target as HTMLInputElement).value)}
                                onKeyDown={manejarKeyDown}
                                placeholder="60"
                                min={0}
                                max={300}
                            />
                        </label>
                        <span className="selectorBPMSeparador">—</span>
                        <label className="selectorBPMLabel">
                            <span>Max</span>
                            <CampoTexto
                                type="number"
                                variante="desnudo"
                                className="selectorBPMInput"
                                value={maxLocal}
                                onChange={(e) => setMaxLocal((e.target as HTMLInputElement).value)}
                                onKeyDown={manejarKeyDown}
                                placeholder="200"
                                min={0}
                                max={300}
                            />
                        </label>
                    </div>
                    <BotonBase variante="ghost"
                        type="button"
                        className="selectorBPMAplicar"
                        onClick={aplicarYCerrar}
                    >
                        Aplicar
                    </BotonBase>
                </div>
            )}
        </div>
    );
};

export default SelectorBPM;
