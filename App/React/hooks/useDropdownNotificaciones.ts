/*
 * Hook: useDropdownNotificaciones
 * Lógica de fetch de notificaciones, navegación y conteo de no leídas.
 * Extraído de DropdownNotificaciones para cumplir SRP.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigationStore } from '@/core/router';
import { obtenerNotificaciones, type Notificacion } from '@app/services/apiNotificaciones';

interface UseDropdownNotificacionesParams {
    onCerrar: () => void;
}

export const useDropdownNotificaciones = ({ onCerrar }: UseDropdownNotificacionesParams) => {
    const navegar = useNavigationStore(s => s.navegar);
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let cancelado = false;
        obtenerNotificaciones().then((resp) => {
            if (!cancelado && resp.ok && resp.data) {
                setNotificaciones(resp.data);
            }
            if (!cancelado) setCargando(false);
        }).catch(() => {
            if (!cancelado) setCargando(false);
        });
        return () => { cancelado = true; };
    }, []);

    const irANotificaciones = useCallback(() => {
        navegar('/notificaciones');
        onCerrar();
    }, [navegar, onCerrar]);

    const manejarClickNotif = useCallback((noti: Notificacion) => {
        if (noti.enlace) {
            navegar(noti.enlace);
            onCerrar();
        } else if (noti.datos?.sampleSlug) {
            navegar(`/sample/${noti.datos.sampleSlug}/`);
            onCerrar();
        }
    }, [navegar, onCerrar]);

    const noLeidas = notificaciones.filter((n) => !n.leida).length;

    return {
        notificaciones,
        cargando,
        noLeidas,
        irANotificaciones,
        manejarClickNotif,
    };
};
