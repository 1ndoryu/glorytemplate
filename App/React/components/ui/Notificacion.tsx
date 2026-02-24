/*
 * Componente: Notificacion (Toast)
 * Toast global para feedback al usuario.
 * Se usa con el store de notificaciones.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import '../../styles/componentes/notificacion.css';
import { BotonBase } from './BotonBase';

export type TipoToast = 'exito' | 'error' | 'advertencia' | 'info';

export interface DatosToast {
    id: string;
    tipo: TipoToast;
    titulo: string;
    mensaje?: string;
    duracionMs?: number;
}

interface NotificacionItemProps {
    toast: DatosToast;
    onCerrar: (id: string) => void;
}

const iconosPorTipo: Record<TipoToast, React.ReactNode> = {
    exito: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    advertencia: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

const clasePorTipo: Record<TipoToast, string> = {
    exito: 'notificacionExito',
    error: 'notificacionError',
    advertencia: 'notificacionAdvertencia',
    info: 'notificacionInfo',
};

const NotificacionItem = ({ toast, onCerrar }: NotificacionItemProps): JSX.Element => {
    const [saliendo, setSaliendo] = useState(false);

    useEffect(() => {
        const duracion = toast.duracionMs ?? 4000;
        const timerSalida = setTimeout(() => {
            setSaliendo(true);
        }, duracion);

        const timerEliminar = setTimeout(() => {
            onCerrar(toast.id);
        }, duracion + 250);

        return () => {
            clearTimeout(timerSalida);
            clearTimeout(timerEliminar);
        };
    }, [toast.id, toast.duracionMs, onCerrar]);

    const manejarCerrar = () => {
        setSaliendo(true);
        setTimeout(() => onCerrar(toast.id), 250);
    };

    const clases = [
        'notificacionToast',
        clasePorTipo[toast.tipo],
        saliendo ? 'notificacionSaliendo' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={clases} role="alert">
            <span className="notificacionIcono">{iconosPorTipo[toast.tipo]}</span>
            <div className="notificacionContenido">
                <div className="notificacionTitulo">{toast.titulo}</div>
                {toast.mensaje && <div className="notificacionMensaje">{toast.mensaje}</div>}
            </div>
            <BotonBase variante="ghost"
                className="notificacionCerrar"
                onClick={manejarCerrar}
                aria-label="Cerrar notificación"
                type="button"
            >
                <X size={14} />
            </BotonBase>
        </div>
    );
};

/* Contenedor global de toasts */
interface ContenedorNotificacionesProps {
    toasts: DatosToast[];
    onCerrar: (id: string) => void;
}

export const ContenedorNotificaciones = ({
    toasts,
    onCerrar,
}: ContenedorNotificacionesProps): JSX.Element | null => {
    if (toasts.length === 0) return null;

    return createPortal(
        <div className="contenedorNotificaciones">
            {toasts.map((toast) => (
                <NotificacionItem key={toast.id} toast={toast} onCerrar={onCerrar} />
            ))}
        </div>,
        document.body
    );
};

/* Helper para generar IDs únicos de toast */
let contadorToast = 0;
export const crearToast = (
    tipo: TipoToast,
    titulo: string,
    mensaje?: string,
    duracionMs?: number
): DatosToast => ({
    id: `toast-${++contadorToast}-${Date.now()}`,
    tipo,
    titulo,
    mensaje,
    duracionMs,
});

export default ContenedorNotificaciones;
