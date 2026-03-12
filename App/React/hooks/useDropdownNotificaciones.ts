/*
 * Hook: useDropdownNotificaciones
 * Lógica de fetch de notificaciones, navegación y conteo de no leídas.
 * Extraído de DropdownNotificaciones para cumplir SRP.
 */

import { useCallback, useEffect } from 'react';
import { useNavigationStore } from '@/core/router';
import { marcarLeida, obtenerNotificaciones } from '@app/services/apiNotificaciones';
import { useNotificacionesStore } from '@app/stores/notificacionesStore';
import type { NotificacionUI } from '@app/types/notificaciones';

interface UseDropdownNotificacionesParams {
    onCerrar: () => void;
}

export const useDropdownNotificaciones = ({ onCerrar }: UseDropdownNotificacionesParams) => {
    const navegar = useNavigationStore(s => s.navegar);
    const notificaciones = useNotificacionesStore(s => s.notificaciones);
    const cargando = useNotificacionesStore(s => s.cargandoVisible);
    const notificacionesCargadas = useNotificacionesStore(s => s.notificacionesCargadas);
    const hidratarNotificaciones = useNotificacionesStore(s => s.hidratarNotificaciones);
    const setCargandoVisible = useNotificacionesStore(s => s.setCargandoVisible);
    const marcarLeidaLocal = useNotificacionesStore(s => s.marcarLeidaLocal);
    const necesitaRefrescar = useNotificacionesStore(s => s.necesitaRefrescar);

    useEffect(() => {
        let cancelado = false;
        const debeRefrescar = necesitaRefrescar();
        if (!debeRefrescar) return;

        if (!notificacionesCargadas) {
            setCargandoVisible(true);
        }

        obtenerNotificaciones().then((resp) => {
            if (!cancelado && resp.ok && resp.data) {
                hidratarNotificaciones(resp.data);
            }
            if (!cancelado) setCargandoVisible(false);
        }).catch(() => {
            if (!cancelado) setCargandoVisible(false);
        });
        return () => { cancelado = true; };
    }, [hidratarNotificaciones, necesitaRefrescar, notificacionesCargadas, setCargandoVisible]);

    const manejarClickNotif = useCallback((noti: NotificacionUI, soloMarcarLeida = false) => {
        if (!noti.leida) {
            marcarLeidaLocal(noti.id);
            void marcarLeida(noti.id);
        }

        /* Middle-click: solo marca leida, el navegador abre en nueva pestana */
        if (soloMarcarLeida) return;

        if (noti.enlace) {
            navegar(noti.enlace);
            onCerrar();
        } else if (noti.datos?.sampleSlug) {
            navegar(`/sample/${noti.datos.sampleSlug as string}/`);
            onCerrar();
        } else if (noti.tipo === 'follow' && noti.actor?.username) {
            navegar(`/perfil/${noti.actor.username}`);
            onCerrar();
        }
    }, [marcarLeidaLocal, navegar, onCerrar]);

    return {
        notificaciones,
        cargando,
        notificacionesCargadas,
        manejarClickNotif,
    };
};
