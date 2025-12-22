/*
 * ContenedorAlertas
 * Contenedor que renderiza todos los toasts activos
 * Se posiciona en esquina inferior derecha
 */

import {AlertaToast} from './AlertaToast';
import type {AlertaToast as TipoAlertaToast} from '../../hooks/useAlertas';

interface ContenedorAlertasProps {
    toasts: TipoAlertaToast[];
    onCerrarToast: (id: string) => void;
}

export function ContenedorAlertas({toasts, onCerrarToast}: ContenedorAlertasProps): JSX.Element | null {
    if (toasts.length === 0) return null;

    return (
        <div id="contenedor-alertas" className="contenedorAlertas">
            {toasts.map(toast => (
                <AlertaToast key={toast.id} id={toast.id} tipo={toast.tipo} mensaje={toast.mensaje} onCerrar={onCerrarToast} />
            ))}
        </div>
    );
}
