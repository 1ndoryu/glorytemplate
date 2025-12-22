/*
 * AlertaToast
 * Componente para notificaciones tipo toast
 * Muestra mensajes temporales con iconos segun tipo
 */

import {X, CheckCircle, XCircle, AlertTriangle, Info} from 'lucide-react';
import type {TipoAlerta} from '../../hooks/useAlertas';

interface AlertaToastProps {
    id: string;
    tipo: TipoAlerta;
    mensaje: string;
    onCerrar: (id: string) => void;
}

const ICONOS_POR_TIPO = {
    exito: CheckCircle,
    error: XCircle,
    advertencia: AlertTriangle,
    info: Info
};

export function AlertaToast({id, tipo, mensaje, onCerrar}: AlertaToastProps): JSX.Element {
    const Icono = ICONOS_POR_TIPO[tipo];

    return (
        <div id={`alerta-toast-${id}`} className={`alertaToast alertaToast--${tipo}`} role="alert">
            <div className="alertaToastIcono">
                <Icono size={16} />
            </div>
            <span className="alertaToastMensaje">{mensaje}</span>
            <button className="alertaToastCerrar" onClick={() => onCerrar(id)} type="button" aria-label="Cerrar alerta">
                <X size={14} />
            </button>
        </div>
    );
}
