/*
 * Hook: useDropdownMensajes
 * Lógica de fetch SWR de conversaciones, apertura de chat, conteo no leídos.
 * C192: Stale-while-revalidate — primera vez spinner, luego cache instantáneo.
 * Extraído de DropdownMensajes para cumplir SRP.
 */

import { useCallback, useEffect, useState } from 'react';
import { useChatFlotanteStore } from '@app/stores/chatFlotanteStore';
import { useMensajesStore } from '@app/stores/mensajesStore';
import { obtenerConversaciones, marcarTodasConversacionesLeidas } from '@app/services/apiMensajes';
import type { Conversacion } from '@app/types';

type TabMensajes = 'principal' | 'solicitudes';

interface UseDropdownMensajesParams {
    onCerrar: () => void;
}

export const useDropdownMensajes = ({ onCerrar }: UseDropdownMensajesParams) => {
    const abrirChat = useChatFlotanteStore(s => s.abrirChat);
    const conversaciones = useMensajesStore(s => s.conversaciones);
    const cargando = useMensajesStore(s => s.cargandoConversaciones);
    const conversacionesCargadas = useMensajesStore(s => s.conversacionesCargadas);
    const setConversaciones = useMensajesStore(s => s.setConversaciones);
    const setCargandoConversaciones = useMensajesStore(s => s.setCargandoConversaciones);
    const necesitaRefrescar = useMensajesStore(s => s.necesitaRefrescar);
    const marcarTodasLeidas = useMensajesStore(s => s.marcarTodasLeidas);

    /* QQ52: Tab activa — principal (mutuos) / solicitudes (no mutuos) */
    const [tabActiva, setTabActiva] = useState<TabMensajes>('principal');

    /*
     * C192: Stale-while-revalidate.
     * Primera vez: muestra Cargando, fetch, guardar en store.
     * Siguientes: muestra cache al instante. Si TTL expiró, refresca en background.
     */
    useEffect(() => {
        let cancelado = false;
        const debeRefrescar = necesitaRefrescar();
        if (!debeRefrescar) return;

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
    }, []);

    /*
     * QQ86+QQ91: Al abrir/recargar conversaciones, marcar como leídas.
     * Usa ultimaCargaConversaciones para detectar re-fetches (no solo el flag booleano).
     * Store local inmediato (optimistic), + API con rollback si falla.
     */
    const ultimaCarga = useMensajesStore(s => s.ultimaCargaConversaciones);

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

    const abrirConversacion = useCallback((conv: Conversacion) => {
        abrirChat({
            conversacionId: conv.id,
            participanteId: conv.participante.id,
            participanteUsername: conv.participante.username,
            nombreParticipante: conv.participante.nombreVisible,
            avatarUrl: conv.participante.avatarUrl,
        });
        onCerrar();
    }, [abrirChat, onCerrar]);

    const sinLeer = conversaciones.filter((c) => c.noLeidos > 0).length;

    /* QK60: Principal = mutuos O aceptadas. Solicitudes = no mutuos Y no aceptadas */
    const conversacionesFiltradas = conversaciones.filter((c) =>
        tabActiva === 'principal' ? (c.esMutuo || c.aceptada) : (!c.esMutuo && !c.aceptada)
    );

    const totalSolicitudes = conversaciones.filter((c) => !c.esMutuo && !c.aceptada).length;

    return {
        conversaciones: conversacionesFiltradas,
        todasConversaciones: conversaciones,
        cargando,
        conversacionesCargadas,
        sinLeer,
        tabActiva,
        setTabActiva,
        totalSolicitudes,
        abrirConversacion,
    };
};
