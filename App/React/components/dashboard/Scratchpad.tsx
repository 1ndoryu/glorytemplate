/*
 * Scratchpad
 * Componente para notas rápidas
 * Responsabilidad única: área de texto para notas con guardado automático
 */

import {useState, useEffect, useCallback} from 'react';
import {useDebounceCallback} from '../../hooks/useDebounce';

interface ScratchpadProps {
    valorInicial?: string;
    placeholder?: string;
    onChange?: (valor: string) => void;
    delayGuardado?: number;
}

type EstadoGuardado = 'guardado' | 'guardando' | 'inactivo';

export function Scratchpad({valorInicial = '', placeholder = '// Escribe tus notas rapidas aqui...', onChange, delayGuardado = 500}: ScratchpadProps): JSX.Element {
    const [valor, setValor] = useState(valorInicial);
    const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('inactivo');

    /* Sincronizar con valor externo cuando cambia */
    useEffect(() => {
        setValor(valorInicial);
    }, [valorInicial]);

    /* Callback debounceado para guardar */
    const guardarNotas = useCallback(
        (nuevoValor: string) => {
            onChange?.(nuevoValor);
            setEstadoGuardado('guardado');

            /* Ocultar indicador después de 2 segundos */
            setTimeout(() => {
                setEstadoGuardado('inactivo');
            }, 2000);
        },
        [onChange]
    );

    const {ejecutar: guardarConDebounce} = useDebounceCallback(guardarNotas, delayGuardado);

    const manejarCambio = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const nuevoValor = e.target.value;
        setValor(nuevoValor);
        setEstadoGuardado('guardando');
        guardarConDebounce(nuevoValor);
    };

    return (
        <div id="scratchpad" className="scratchpadContenedor">
            <div className="dashboardPanel scratchpadPanel">
                <div className="scratchpadBarra"></div>
                <textarea className="scratchpadTextarea" placeholder={placeholder} value={valor} onChange={manejarCambio} />

                {/* Indicador de estado de guardado */}
                <div className={`scratchpadEstado ${estadoGuardado !== 'inactivo' ? 'scratchpadEstadoVisible' : ''}`}>
                    {estadoGuardado === 'guardando' && (
                        <span className="scratchpadGuardando">
                            <span className="scratchpadSpinner"></span>
                            Guardando...
                        </span>
                    )}
                    {estadoGuardado === 'guardado' && <span className="scratchpadGuardado">Guardado</span>}
                </div>
            </div>
        </div>
    );
}
