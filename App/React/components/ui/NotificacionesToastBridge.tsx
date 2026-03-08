import { useEffect } from 'react';
import { useNavigationStore } from '@/core/router';
import { useToastStore } from '@app/stores/toastStore';
import { useNotificacionesStore } from '@app/stores/notificacionesStore';
import { obtenerTipoToastParaPrioridad } from '@app/utils/notificaciones';

export const NotificacionesToastBridge = (): null => {
    const navegar = useNavigationStore(s => s.navegar);
    const colaToasts = useNotificacionesStore(s => s.colaToasts);
    const consumirSiguienteToast = useNotificacionesStore(s => s.consumirSiguienteToast);
    const agregarToast = useToastStore(s => s.agregar);

    useEffect(() => {
        if (colaToasts.length === 0) return;

        const siguiente = consumirSiguienteToast();
        if (!siguiente) return;

        const destino = siguiente.enlace
            ?? (typeof siguiente.datos?.sampleSlug === 'string' ? `/sample/${siguiente.datos.sampleSlug}/` : null);

        agregarToast({
            mensaje: siguiente.toastMensaje,
            tipo: obtenerTipoToastParaPrioridad(siguiente.prioridad),
            duracion: siguiente.prioridad === 'critica' ? 6500 : 4500,
            acciones: destino ? [{
                etiqueta: 'Ver',
                variante: 'primario',
                onClick: () => navegar(destino),
            }] : undefined,
        });
    }, [agregarToast, colaToasts, consumirSiguienteToast, navegar]);

    return null;
};

export default NotificacionesToastBridge;