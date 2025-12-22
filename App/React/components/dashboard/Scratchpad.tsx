/*
 * Scratchpad
 * Componente para notas rápidas
 * Responsabilidad única: área de texto para notas con guardado automático
 * Incluye límite de caracteres y contador visual
 */

import {useState, useEffect, useCallback} from 'react';
import {useDebounceCallback} from '../../hooks/useDebounce';
import type {TamanoFuente, AlturaScratchpad} from '../../hooks/useConfiguracionScratchpad';

/* Límite de caracteres para el scratchpad */
const LIMITE_CARACTERES = 20000;
const UMBRAL_ADVERTENCIA = 0.9; /* 90% del límite */

interface ScratchpadProps {
    valorInicial?: string;
    placeholder?: string;
    onChange?: (valor: string) => void;
    delayGuardado?: number;
    tamanoFuente?: TamanoFuente;
    altura?: AlturaScratchpad;
}

type EstadoGuardado = 'guardado' | 'guardando' | 'inactivo';

export function Scratchpad({valorInicial = '', placeholder = '// Escribe tus notas rapidas aqui...', onChange, delayGuardado = 1500, tamanoFuente = 'normal', altura = '100%'}: ScratchpadProps): JSX.Element {
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
        let nuevoValor = e.target.value;

        /* Truncar si excede el límite */
        if (nuevoValor.length > LIMITE_CARACTERES) {
            nuevoValor = nuevoValor.slice(0, LIMITE_CARACTERES);
        }

        setValor(nuevoValor);
        setEstadoGuardado('guardando');
        guardarConDebounce(nuevoValor);
    };

    /* Calcular estado del contador */
    const caracteresUsados = valor.length;
    const porcentajeUso = caracteresUsados / LIMITE_CARACTERES;
    const cercaDelLimite = porcentajeUso >= UMBRAL_ADVERTENCIA;
    const enLimite = caracteresUsados >= LIMITE_CARACTERES;

    return (
        <div id="scratchpad" className="scratchpadContenedor">
            <div className="dashboardPanel scratchpadPanel">
                <div className="scratchpadBarra"></div>
                <div className="scratchpadBarra"></div>
                <textarea className={`scratchpadTextarea scratchpadFuente-${tamanoFuente}`} style={{height: altura}} placeholder={placeholder} value={valor} onChange={manejarCambio} maxLength={LIMITE_CARACTERES} />

                {/* Barra de estado con contador y guardado */}
                <div className="scratchpadBarraEstado">
                    {/* Indicador de guardado (a la izquierda) */}
                    <div className={`scratchpadEstado ${estadoGuardado !== 'inactivo' ? 'scratchpadEstadoVisible' : ''}`}>
                        {estadoGuardado === 'guardando' && (
                            <span className="scratchpadGuardando">
                                <span className="scratchpadSpinner"></span>
                                Guardando...
                            </span>
                        )}
                        {estadoGuardado === 'guardado' && <span className="scratchpadGuardado">Guardado</span>}
                    </div>

                    {/* Contador de caracteres (a la derecha, siempre visible) */}
                    <span className={`scratchpadContador ${cercaDelLimite ? 'scratchpadContadorAdvertencia' : ''} ${enLimite ? 'scratchpadContadorLimite' : ''}`}>
                        {caracteresUsados.toLocaleString()}/{LIMITE_CARACTERES.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
