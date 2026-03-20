/*
 * Componente: InputBusqueda
 * Input de búsqueda con debounce, ícono y botón de limpiar.
 * Lógica extraída a useInputBusqueda hook.
 */

import { Search, X } from 'lucide-react';
import { useInputBusqueda } from '../../hooks/useInputBusqueda';
import '../../styles/componentes/inputBusqueda.css';
import { BotonBase } from './BotonBase';
import { CampoTexto } from './CampoTexto';
import { useT } from '@app/utils/i18n/useT';

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
    placeholder,
    valor: valorExterno,
    onChange,
    debounceMs = 300,
    compacto = false,
    className = '',
    autoFocus = false,
}: InputBusquedaProps): JSX.Element => {
    const { t } = useT();
    const resolvedPlaceholder = placeholder ?? t('comun.buscar') + '...';
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
            <CampoTexto
                ref={inputRef}
                className="inputBusqueda"
                placeholder={resolvedPlaceholder}
                value={valorInterno}
                onChange={manejarCambio}
             />
            {valorInterno && (
                <BotonBase variante="ghost"
                    className="botonLimpiar"
                    onClick={limpiar}
                    aria-label="Limpiar búsqueda"
                    type="button"
                >
                    <X size={14} />
                </BotonBase>
            )}
        </div>
    );
};

export default InputBusqueda;
