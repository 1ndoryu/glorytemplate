/*
 * CampoTexto
 * Campo de texto reutilizable con soporte para errores y validacion
 * Usa SeccionPanel internamente para consistencia visual
 */

import {SeccionPanel} from './SeccionPanel';

interface CampoTextoProps {
    id?: string;
    titulo: string;
    valor: string;
    onChange: (valor: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    tipo?: 'texto' | 'textarea';
    filas?: number;
}

export function CampoTexto({id, titulo, valor, onChange, placeholder, error, disabled = false, autoFocus = false, tipo = 'texto', filas = 3}: CampoTextoProps): JSX.Element {
    const claseInput = `formularioInput ${error ? 'formularioInputError' : ''}`;

    return (
        <SeccionPanel titulo={titulo}>
            {tipo === 'textarea' ? <textarea id={id} className={`${claseInput} formularioTextarea`} value={valor} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} rows={filas} /> : <input id={id} type="text" className={claseInput} value={valor} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} disabled={disabled} />}
            {error && <span className="formularioMensajeError">{error}</span>}
        </SeccionPanel>
    );
}
