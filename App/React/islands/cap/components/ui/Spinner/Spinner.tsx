/**
 * Spinner Component
 *
 * Indicador de carga animado.
 */

import './Spinner.css';

type TamanoSpinner = 'sm' | 'md' | 'lg';

interface SpinnerProps {
    tamano?: TamanoSpinner;
    texto?: string;
    className?: string;
}

export function Spinner({tamano = 'md', texto, className = ''}: SpinnerProps): JSX.Element {
    const clases = ['capSpinner', `capSpinner--${tamano}`, className].filter(Boolean).join(' ');

    return (
        <div className={clases} role="status" aria-live="polite">
            <svg className="capSpinner__icono" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="capSpinner__circulo" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="capSpinner__arco" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {texto && <span className="capSpinner__texto">{texto}</span>}
            <span className="capSrOnly">Cargando...</span>
        </div>
    );
}

export default Spinner;
