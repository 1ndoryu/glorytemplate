/*
 * SelectorBPM — Kamples (C116)
 * Selector de rango BPM con inputs min/max.
 * Estilo consistente con SelectFiltro (menu contextual style).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';
import '../../styles/componentes/selectFiltro.css';

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
    const [abierto, setAbierto] = useState(false);
    const [minLocal, setMinLocal] = useState(bpmMin?.toString() ?? '');
    const [maxLocal, setMaxLocal] = useState(bpmMax?.toString() ?? '');
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Sync cuando el store cambie externamente */
    useEffect(() => {
        setMinLocal(bpmMin?.toString() ?? '');
        setMaxLocal(bpmMax?.toString() ?? '');
    }, [bpmMin, bpmMax]);

    /* Cerrar al hacer click fuera */
    useEffect(() => {
        if (!abierto) return;
        const cerrar = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrar);
        return () => document.removeEventListener('mousedown', cerrar);
    }, [abierto]);

    const activo = bpmMin !== null || bpmMax !== null;

    const aplicar = useCallback(() => {
        const min = minLocal.trim() ? parseInt(minLocal, 10) : null;
        const max = maxLocal.trim() ? parseInt(maxLocal, 10) : null;
        onCambiar(
            min !== null && !isNaN(min) ? min : null,
            max !== null && !isNaN(max) ? max : null
        );
    }, [minLocal, maxLocal, onCambiar]);

    const limpiar = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMinLocal('');
        setMaxLocal('');
        onCambiar(null, null);
    }, [onCambiar]);

    /* Aplicar al presionar Enter */
    const manejarKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            aplicar();
            setAbierto(false);
        } else if (e.key === 'Escape') {
            setAbierto(false);
        }
    }, [aplicar]);

    /* Etiqueta dinámica */
    const etiquetaTexto = activo
        ? `BPM: ${bpmMin ?? '–'}–${bpmMax ?? '–'}`
        : 'BPM';

    return (
        <div className="selectFiltro" ref={contenedorRef}>
            <button
                type="button"
                className={`selectFiltroBoton ${activo ? 'selectFiltroBotonActivo' : ''}`}
                onClick={() => setAbierto(!abierto)}
                aria-expanded={abierto}
            >
                <span className="selectFiltroEtiqueta">{etiquetaTexto}</span>
                {activo
                    ? <X size={12} className="selectFiltroFlecha" onClick={limpiar} />
                    : <ChevronDown size={12} className={`selectFiltroFlecha ${abierto ? 'selectFiltroFlechaAbierta' : ''}`} />
                }
            </button>

            {abierto && (
                <div className="selectFiltroMenu selectorBPMMenu">
                    <div className="selectorBPMCampos">
                        <label className="selectorBPMLabel">
                            <span>Min</span>
                            <input
                                type="number"
                                className="selectorBPMInput"
                                value={minLocal}
                                onChange={(e) => setMinLocal(e.target.value)}
                                onKeyDown={manejarKeyDown}
                                placeholder="60"
                                min={0}
                                max={300}
                            />
                        </label>
                        <span className="selectorBPMSeparador">—</span>
                        <label className="selectorBPMLabel">
                            <span>Max</span>
                            <input
                                type="number"
                                className="selectorBPMInput"
                                value={maxLocal}
                                onChange={(e) => setMaxLocal(e.target.value)}
                                onKeyDown={manejarKeyDown}
                                placeholder="200"
                                min={0}
                                max={300}
                            />
                        </label>
                    </div>
                    <button
                        type="button"
                        className="selectorBPMAplicar"
                        onClick={() => { aplicar(); setAbierto(false); }}
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    );
};

export default SelectorBPM;
