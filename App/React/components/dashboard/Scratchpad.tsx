/*
 * Scratchpad
 * Componente para notas rápidas
 * Responsabilidad única: área de texto para notas con guardado automático
 * Incluye límite de caracteres y contador visual
 */

import {useState, useEffect, useCallback, useRef} from 'react';
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
    onCambiarAltura?: (altura: string) => void;
}

type EstadoGuardado = 'guardado' | 'guardando' | 'inactivo';

export function Scratchpad({valorInicial = '', placeholder = '// Escribe tus notas rapidas aqui...', onChange, delayGuardado = 1500, tamanoFuente = 'normal', altura = '100%', onCambiarAltura}: ScratchpadProps): JSX.Element {
    const [valor, setValor] = useState(valorInicial);
    const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('inactivo');

    // Estados para resizing
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [localHeight, setLocalHeight] = useState<string>(altura);

    // Sincronizar altura si no se está redimensionando
    useEffect(() => {
        if (!isResizing) {
            setLocalHeight(altura);
        }
    }, [altura, isResizing]);

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

    // Manejo del Resizing
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const startY = e.clientY;
        const startHeight = textareaRef.current?.getBoundingClientRect().height || 300;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            // Limitar entre 100px y 600px según requerimiento
            const newHeight = Math.min(600, Math.max(100, startHeight + deltaY));
            setLocalHeight(`${newHeight}px`);
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setIsResizing(false);

            // Calcular altura final con los mismos límites
            const deltaY = upEvent.clientY - startY;
            const finalHeight = Math.min(600, Math.max(100, startHeight + deltaY));

            if (onCambiarAltura) {
                onCambiarAltura(`${finalHeight}px`);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    /* Calcular estado del contador */
    const caracteresUsados = valor.length;
    const porcentajeUso = caracteresUsados / LIMITE_CARACTERES;
    const cercaDelLimite = porcentajeUso >= UMBRAL_ADVERTENCIA;
    const enLimite = caracteresUsados >= LIMITE_CARACTERES;

    return (
        <div id="scratchpad" className="scratchpadContenedor">
            <div className={`dashboardPanel scratchpadPanel ${isResizing ? 'scratchpadResizing' : ''}`}>
                <div className="scratchpadBarra"></div>
                <div className="scratchpadBarra"></div>
                <textarea
                    ref={textareaRef}
                    className={`scratchpadTextarea scratchpadFuente-${tamanoFuente}`}
                    style={{
                        height: localHeight,
                        flex: localHeight === '100%' && !isResizing ? '1' : 'none',
                        transition: isResizing ? 'none' : undefined
                    }}
                    placeholder={placeholder}
                    value={valor}
                    onChange={manejarCambio}
                    maxLength={LIMITE_CARACTERES}
                />

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

            {/* Minimalist Resize Handle */}
            <div className="scratchpadResizeHandle" onMouseDown={handleMouseDown} title="Arrastrar para cambiar altura">
                <div className="scratchpadResizeLine"></div>
            </div>
        </div>
    );
}
