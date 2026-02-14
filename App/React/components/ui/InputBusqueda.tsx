/*
 * Componente: InputBusqueda
 * Input de búsqueda con debounce, ícono y botón de limpiar.
 */

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';
import '../../styles/componentes/inputBusqueda.css';

interface InputBusquedaProps {
    placeholder?: string;
    valor?: string;
    onChange: (valor: string) => void;
    debounceMs?: number;
    compacto?: boolean;
    className?: string;
    autoFocus?: boolean;
}

export const InputBusqueda = ({
    placeholder = 'Buscar samples...',
    valor: valorExterno,
    onChange,
    debounceMs = 300,
    compacto = false,
    className = '',
    autoFocus = false,
}: InputBusquedaProps): JSX.Element => {
    const [valorInterno, setValorInterno] = useState(valorExterno ?? '');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Sincronizar valor externo */
    useEffect(() => {
        if (valorExterno !== undefined) {
            setValorInterno(valorExterno);
        }
    }, [valorExterno]);

    /* AutoFocus */
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const manejarCambio = (e: ChangeEvent<HTMLInputElement>) => {
        const nuevoValor = e.target.value;
        setValorInterno(nuevoValor);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            onChange(nuevoValor);
        }, debounceMs);
    };

    const limpiar = () => {
        setValorInterno('');
        onChange('');
        inputRef.current?.focus();
    };

    /* Limpiar timer al desmontar */
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const clases = [
        'contenedorInputBusqueda',
        compacto ? 'busquedaCompacta' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={clases}>
            <span className="iconoBusqueda">
                <Search size={16} />
            </span>
            <input
                ref={inputRef}
                type="text"
                className="inputBusqueda"
                placeholder={placeholder}
                value={valorInterno}
                onChange={manejarCambio}
            />
            {valorInterno && (
                <button
                    className="botonLimpiar"
                    onClick={limpiar}
                    aria-label="Limpiar búsqueda"
                    type="button"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export default InputBusqueda;
