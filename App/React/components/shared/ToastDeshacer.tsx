/*
 * ToastDeshacer
 * Componente toast para mostrar opcion de deshacer acciones
 * Responsabilidad única: UI de notificación con barra de progreso y botón deshacer
 */

import {Undo2, X} from 'lucide-react';

interface ToastDeshacerProps {
    mensaje: string;
    tiempoRestante: number;
    tiempoTotal: number;
    onDeshacer: () => void;
    onDescartar: () => void;
}

export function ToastDeshacer({mensaje, tiempoRestante, tiempoTotal, onDeshacer, onDescartar}: ToastDeshacerProps): JSX.Element {
    const porcentaje = (tiempoRestante / tiempoTotal) * 100;

    return (
        <div id="toast-deshacer" className="toastDeshacerContenedor">
            <div className="toastDeshacerContenido">
                <span className="toastDeshacerMensaje">{mensaje}</span>
                <div className="toastDeshacerAcciones">
                    <button className="toastDeshacerBoton toastDeshacerBotonUndo" onClick={onDeshacer} type="button">
                        <Undo2 size={12} />
                        <span>Deshacer</span>
                    </button>
                    <button className="toastDeshacerBoton toastDeshacerBotonCerrar" onClick={onDescartar} type="button" aria-label="Cerrar">
                        <X size={12} />
                    </button>
                </div>
            </div>
            <div className="toastDeshacerBarra">
                <div className="toastDeshacerBarraRelleno" style={{width: `${porcentaje}%`}} />
            </div>
        </div>
    );
}
