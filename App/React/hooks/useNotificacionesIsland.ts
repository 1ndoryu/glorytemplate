/*
 * Hook: useNotificacionesIsland
 * Lógica extraída de NotificacionesIsland (SRP).
 * Gestiona carga, filtro, marcar leídas y navegación.
 * Preserva patrón cancelado/cleanup de sesión anterior.
 */

import { useEffect, useState, useCallback } from 'react';
import {
    obtenerNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
    type Notificacion,
    type TipoNotificacion,
} from '@app/services/apiNotificaciones';
import { useNavigationStore } from '@/core/router';

export const useNotificacionesIsland = () => {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [filtro, setFiltro] = useState<TipoNotificacion | 'todas'>('todas');
    const [cargando, setCargando] = useState(true);
    const navegar = useNavigationStore(s => s.navegar);

    useEffect(() => {
        let cancelado = false;
        const cargar = async () => {
            setCargando(true);
            try {
                const resp = await obtenerNotificaciones();
                if (!cancelado && resp.ok && resp.data) {
                    setNotificaciones(resp.data);
                }
            } catch {
                /* Fallo de carga — notificaciones quedan vacías */
            } finally {
                if (!cancelado) setCargando(false);
            }
        };
        cargar();
        return () => { cancelado = true; };
    }, []);

    const manejarMarcarLeida = useCallback(async (id: number) => {
        const snapshot = notificaciones;
        setNotificaciones((prev) =>
            prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
        );
        try {
            await marcarLeida(id);
        } catch {
            setNotificaciones(snapshot);
        }
    }, [notificaciones]);

    const manejarMarcarTodas = useCallback(async () => {
        const snapshot = notificaciones;
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
        try {
            await marcarTodasLeidas();
        } catch {
            setNotificaciones(snapshot);
        }
    }, [notificaciones]);

    /* Click en notificacion -> navegar al recurso via enlace o fallback */
    const manejarClick = useCallback(
        (notif: Notificacion) => {
            if (!notif.leida) manejarMarcarLeida(notif.id);

            /* Priorizar campo enlace del backend.
             * [193A-47] Normalizar URLs legacy /post/ → /publicacion/ */
            if (notif.enlace) {
                const enlaceNormalizado = notif.enlace.replace(/^\/post\//, '/publicacion/');
                navegar(enlaceNormalizado);
                return;
            }

            /* Fallback para notificaciones antiguas sin enlace */
            if (notif.tipo === 'follow' && notif.actor) {
                navegar(`/perfil/${notif.actor.username}/`);
            } else if (
                (notif.tipo === 'like' || notif.tipo === 'comentario' || notif.tipo === 'encanta') &&
                notif.datos.sampleSlug
            ) {
                navegar(`/sample/${notif.datos.sampleSlug}/`);
            }
        },
        [manejarMarcarLeida, navegar]
    );

    const filtradas =
        filtro === 'todas'
            ? notificaciones
            : notificaciones.filter((n) => n.tipo === filtro);

    const noLeidas = notificaciones.filter((n) => !n.leida).length;

    return {
        filtro,
        setFiltro,
        cargando,
        manejarMarcarTodas,
        manejarClick,
        filtradas,
        noLeidas,
    };
};
