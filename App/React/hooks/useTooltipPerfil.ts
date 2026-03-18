/*
 * Hook: useTooltipPerfil — Kamples
 * Logica del componente TooltipPerfil global.
 * Carga perfil (con cache), maneja follow/unfollow, posicionamiento, cierre.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { obtenerPerfil } from '@app/services/apiAuth';
import { seguirUsuario, dejarDeSeguir } from '@app/services/apiSocial';
import { useAuthStore } from '@app/stores/authStore';
import { useTooltipPerfilStore } from '@app/stores/tooltipPerfilStore';
import { useNavigationStore } from '@/core/router';
import type { Usuario } from '@app/types/usuario';

export function useTooltipPerfil() {
    const username = useTooltipPerfilStore(s => s.username);
    const ancla = useTooltipPerfilStore(s => s.ancla);
    const { programarCerrar, cancelarCerrar, cerrarInmediato, guardarEnCache, obtenerDeCache } =
        useTooltipPerfilStore.getState();

    const [perfil, setPerfil] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(false);
    const [siguiendo, setSiguiendo] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const usuarioActual = useAuthStore(s => s.usuario);
    const navegar = useNavigationStore(s => s.navegar);

    /* Cargar perfil cuando cambia el username, usando cache si disponible */
    useEffect(() => {
        if (!username) {
            setPerfil(null);
            setCargando(false);
            return;
        }

        const enCache = obtenerDeCache(username);
        if (enCache) {
            setPerfil(enCache);
            setSiguiendo(enCache.siguiendo ?? false);
            setCargando(false);
            return;
        }

        let activo = true;
        setCargando(true);
        obtenerPerfil(username)
            .then(resp => {
                if (!activo) return;
                const data = resp.data ?? null;
                setPerfil(data);
                setSiguiendo(data?.siguiendo ?? false);
                if (data) guardarEnCache(username, data);
            })
            .catch(() => { if (activo) setPerfil(null); })
            .finally(() => { if (activo) setCargando(false); });

        return () => { activo = false; };
    }, [username, obtenerDeCache, guardarEnCache]);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!username) return;
        const manejar = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrarInmediato(); };
        document.addEventListener('keydown', manejar);
        return () => document.removeEventListener('keydown', manejar);
    }, [username, cerrarInmediato]);

    /* Cerrar al hacer scroll (el ancla ya no esta en la posicion correcta) */
    useEffect(() => {
        if (!username) return;
        const manejar = () => cerrarInmediato();
        window.addEventListener('scroll', manejar, { capture: true, passive: true });
        return () => window.removeEventListener('scroll', manejar, { capture: true });
    }, [username, cerrarInmediato]);

    /* [183A-39] Cerrar al navegar (click en nombre de usuario fuera del tooltip) */
    const rutaActual = useNavigationStore(s => s.rutaActual);
    useEffect(() => {
        if (username) cerrarInmediato();
    }, [rutaActual, cerrarInmediato]);

    /* [183A-39] Cerrar al hacer click fuera del tooltip */
    useEffect(() => {
        if (!username) return;
        const manejar = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                cerrarInmediato();
            }
        };
        document.addEventListener('mousedown', manejar);
        return () => document.removeEventListener('mousedown', manejar);
    }, [username, cerrarInmediato]);

    const manejarSeguir = useCallback(async () => {
        if (!perfil) return;
        const estabaS = siguiendo;
        setSiguiendo(!estabaS);
        try {
            const resp = estabaS
                ? await dejarDeSeguir(perfil.id)
                : await seguirUsuario(perfil.id);
            if (!resp.ok) {
                setSiguiendo(estabaS);
            } else {
                /* QK2: Invalidar cache para que el próximo hover re-fetch
                 * el perfil con el estado de seguimiento actualizado. */
                useTooltipPerfilStore.getState().invalidarCache(perfil.username);
            }
        } catch {
            setSiguiendo(estabaS);
        }
    }, [perfil, siguiendo]);

    const irAPerfil = useCallback(() => {
        if (!perfil) return;
        cerrarInmediato();
        navegar(`/perfil/${perfil.username}/`);
    }, [perfil, cerrarInmediato, navegar]);

    /* Mouse enter/leave en el tooltip para mantenerlo abierto */
    const onTooltipMouseEnter = useCallback(() => {
        cancelarCerrar();
    }, [cancelarCerrar]);

    const onTooltipMouseLeave = useCallback(() => {
        programarCerrar();
    }, [programarCerrar]);

    const esPropio = perfil && usuarioActual && (
        String(perfil.wpUserId) === String(usuarioActual.wpUserId) ||
        String(perfil.id) === String(usuarioActual.id)
    );

    return {
        username, ancla, perfil, cargando, siguiendo, esPropio,
        tooltipRef, manejarSeguir, irAPerfil,
        onTooltipMouseEnter, onTooltipMouseLeave,
    };
}
