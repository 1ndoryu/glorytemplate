/*
 * InputTempo — Control de BPM estilo FL Studio.
 * Componente de vista. Lógica en useInputTempo.
 */

import { useInputTempo } from '../hooks/useInputTempo';
import { CampoTexto } from '@app/components/ui/CampoTexto';

interface InputTempoProps {
    valor: number;
    onChange: (nuevoValor: number) => void;
    min?: number;
    max?: number;
    etiqueta?: string;
    paso?: number;
    pasoFino?: number;
}

export const InputTempo = ({
    valor,
    onChange,
    min = 40,
    max = 300,
    etiqueta = 'BPM',
    paso = 1,
    pasoFino = 0.1,
}: InputTempoProps): JSX.Element => {
    const {
        editando, valorTexto, setValorTexto, inputRef,
        iniciarDrag, alDobleClick, confirmarEdicion, alPresionarTecla, alScroll,
    } = useInputTempo({ valor, onChange, min, max, paso, pasoFino });

    return (
        <div className="inputTempo" onWheel={alScroll}>
            {editando ? (
                <CampoTexto
                    ref={inputRef}
                    type="number"
                    className="inputTempoEdicion"
                    value={valorTexto}
                    onChange={(e) => setValorTexto(e.target.value)}
                    onBlur={confirmarEdicion}
                    onKeyDown={alPresionarTecla}
                />
            ) : (
                <div
                    className="inputTempoValor"
                    onMouseDown={iniciarDrag}
                    onDoubleClick={alDobleClick}
                    title="Arrastrar para cambiar, doble click para editar"
                >
                    {valor}
                </div>
            )}
            <span className="inputTempoEtiqueta">{etiqueta}</span>
        </div>
    );
};
