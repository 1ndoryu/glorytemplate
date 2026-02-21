/*
 * Componente: InputBusqueda
 * Input de búsqueda con debounce, ícono y botón de limpiar.
 * Lógica extraída a useInputBusqueda hook.
 */

import { Search, X } from 'lucide-react';
import { useInputBusqueda } from '../../hooks/useInputBusqueda';
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
    const {
        valorInterno,
        inputRef,
        manejarCambio,
        limpiar,
    } = useInputBusqueda({ valorExterno, onChange, debounceMs, autoFocus });

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
