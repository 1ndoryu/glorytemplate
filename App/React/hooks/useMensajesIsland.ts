/*
 * Hook: useMensajesIsland
 * Lógica extraída de MensajesIsland (SRP).
 * Gestiona carga stale-while-revalidate, búsqueda y navegación de conversaciones.
 */

import { useEffect, useCallback, useState } from 'react';
import { obtenerConversaciones, marcarConversacionLeida, marcarTodasConversacionesLeidas } from '@app/services/apiMensajes';
import { useMensajesStore } from '@app/stores/mensajesStore';
import { useNavigationStore } from '@/core/router';
import type { Conversacion } from '@app/types';

export const useMensajesIsland = () => {
    const conversaciones = useMensajesStore(s => s.conversaciones);
    const cargandoConversaciones = useMensajesStore(s => s.cargandoConversaciones);
    const conversacionesCargadas = useMensajesStore(s => s.conversacionesCargadas);
    const setConversaciones = useMensajesStore(s => s.setConversaciones);
    const setCargandoConversaciones = useMensajesStore(s => s.setCargandoConversaciones);
    const necesitaRefrescar = useMensajesStore(s => s.necesitaRefrescar);
    const marcarTodasLeidas = useMensajesStore(s => s.marcarTodasLeidas);
    const ultimaCarga = useMensajesStore(s => s.ultimaCargaConversaciones);

    const navegar = useNavigationStore(s => s.navegar);
    const [busqueda, setBusqueda] = useState('');

    /*
     * C192: Stale-while-revalidate.
     * Solo muestra spinner si nunca se cargo. Si hay cache, muestra al instante
     * y refresca en background si el TTL expiro.
     */
    useEffect(() => {
        let cancelado = false;
        if (!necesitaRefrescar()) return;

        /* Solo spinner si no hay datos previos */
        if (!conversacionesCargadas) {
            setCargandoConversaciones(true);
        }

        obtenerConversaciones().then((resp) => {
            if (!cancelado && resp.ok && resp.data) {
                setConversaciones(resp.data);
            }
            if (!cancelado) setCargandoConversaciones(false);
        }).catch(() => {
            if (!cancelado) setCargandoConversaciones(false);
        });

        return () => { cancelado = true; };
    }, [setConversaciones, setCargandoConversaciones]);

    /*
     * QQ91: Al abrir la página de mensajes, marcar todas como leídas.
     * Mismo patrón que useDropdownMensajes (QQ86).
     * Store local inmediato (optimistic) + API con rollback si falla.
     */
    useEffect(() => {
        if (!conversacionesCargadas) return;
        const tieneNoLeidos = conversaciones.some((c) => c.noLeidos > 0);
        if (!tieneNoLeidos) return;

        const prevConversaciones = [...conversaciones];
        marcarTodasLeidas();

        marcarTodasConversacionesLeidas().then((resp) => {
            if (!resp.ok) {
                setConversaciones(prevConversaciones);
            }
        });
    }, [conversacionesCargadas, ultimaCarga]);

    /* Abrir una conversación */
    const abrirConversacion = useCallback(
        async (conv: Conversacion) => {
            try {
                if (conv.noLeidos > 0) {
                    useMensajesStore.getState().marcarConversacionLeida(conv.id);
                    await marcarConversacionLeida(conv.id);
                }
            } catch {
                /* Fallo al marcar leída no bloquea la navegación */
            }
            navegar(`/mensajes/${conv.id}/`);
        },
        [navegar]
    );

    /* Filtrar conversaciones por búsqueda */
    const filtradas = busqueda.trim()
        ? conversaciones.filter((c) =>
              c.participante.nombreVisible.toLowerCase().includes(busqueda.toLowerCase()) ||
              c.participante.username.toLowerCase().includes(busqueda.toLowerCase())
          )
        : conversaciones;

    const totalNoLeidos = conversaciones.reduce((acc, c) => acc + c.noLeidos, 0);

    return {
        cargandoConversaciones,
        conversacionesCargadas,
        busqueda,
        setBusqueda,
        abrirConversacion,
        filtradas,
        totalNoLeidos,
    };
};
