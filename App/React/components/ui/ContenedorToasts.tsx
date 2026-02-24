/*
 * Componente: ContenedorToasts
 * Renderiza toasts en la esquina inferior derecha.
 * Soporta tipos: info, exito, error, confirmacion.
 * Cada toast puede tener acciones (botones) personalizadas.
 */

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore, type Toast } from '@app/stores/toastStore';
import '../../styles/componentes/toast.css';
import { BotonBase } from './BotonBase';

const ICONOS_TIPO = {
    info: Info,
    exito: CheckCircle,
    error: AlertCircle,
    confirmacion: AlertCircle,
} as const;

const ItemToast = ({ toast: t }: { toast: Toast }): JSX.Element => {
    const quitar = useToastStore(s => s.quitar);
    const Icono = ICONOS_TIPO[t.tipo];

    const manejarAccion = (onClick: () => void) => {
        onClick();
        quitar(t.id);
    };

    return (
        <div
            className={`toastItem toastItem${t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)} ${t.eliminando ? 'toastItemSaliendo' : ''}`}
            role="alert"
        >
            <div className="toastContenido">
                <Icono size={18} className="toastIcono" />
                <span className="toastMensaje">{t.mensaje}</span>
                {t.tipo !== 'confirmacion' && (
                    <BotonBase variante="ghost"
                        className="toastCerrar"
                        onClick={() => quitar(t.id)}
                        type="button"
                        aria-label="Cerrar notificación"
                    >
                        <X size={14} />
                    </BotonBase>
                )}
            </div>

            {t.acciones && t.acciones.length > 0 && (
                <div className="toastAcciones">
                    {t.acciones.map((accion) => (
                        <BotonBase variante="ghost"
                            key={accion.etiqueta}
                            className={`toastAccionBtn toastAccionBtn${(accion.variante ?? 'neutro').charAt(0).toUpperCase() + (accion.variante ?? 'neutro').slice(1)}`}
                            onClick={() => manejarAccion(accion.onClick)}
                            type="button"
                        >
                            {accion.etiqueta}
                        </BotonBase>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ContenedorToasts = (): JSX.Element | null => {
    const toasts = useToastStore(s => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="contenedorToasts" aria-live="polite">
            {toasts.map((t) => (
                <ItemToast key={t.id} toast={t} />
            ))}
        </div>
    );
};
