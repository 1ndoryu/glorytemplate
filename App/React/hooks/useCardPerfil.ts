/*
 * Hook: useCardPerfil — Kamples
 * Logica de la mini card de perfil estilo Threads.
 * Carga perfil por username, maneja follow/unfollow, cierre con Escape.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { obtenerPerfil } from '@app/services/apiAuth';
import { seguirUsuario, dejarDeSeguir } from '@app/services/apiSocial';
import { useAuthStore } from '@app/stores/authStore';
import type { Usuario } from '@app/types/usuario';

interface UseCardPerfilParams {
    username: string;
    onCerrar: () => void;
    onNavegar: (ruta: string) => void;
}

export function useCardPerfil({ username, onCerrar, onNavegar }: UseCardPerfilParams) {
    const [perfil, setPerfil] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [siguiendo, setSiguiendo] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const usuarioActual = useAuthStore(s => s.usuario);

    /* Cargar perfil al montar */
    useEffect(() => {
        let activo = true;
        setCargando(true);
        obtenerPerfil(username)
            .then(resp => {
                if (!activo) return;
                setPerfil(resp.data ?? null);
                setSiguiendo(resp.data?.siguiendo ?? false);
            })
            .catch(() => { /* sin-op */ })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [username]);

    /* Cerrar con Escape. Click fuera se maneja con el overlay en el componente. */
    useEffect(() => {
        const manejarEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        document.addEventListener('keydown', manejarEscape);
        return () => { document.removeEventListener('keydown', manejarEscape); };
    }, [onCerrar]);

    const manejarSeguir = useCallback(async () => {
        if (!perfil) return;
        const estabaS = siguiendo;
        setSiguiendo(!estabaS);
        try {
            const resp = estabaS
                ? await dejarDeSeguir(perfil.id)
                : await seguirUsuario(perfil.id);
            if (!resp.ok) setSiguiendo(estabaS);
        } catch {
            setSiguiendo(estabaS);
        }
    }, [perfil, siguiendo]);

    const irAPerfil = useCallback(() => {
        if (!perfil) return;
        onNavegar(`/perfil/${perfil.username}/`);
        onCerrar();
    }, [perfil, onNavegar, onCerrar]);

    const esPropio = perfil && (
        String(perfil.wpUserId) === String(usuarioActual?.wpUserId) ||
        String(perfil.id) === String(usuarioActual?.id)
    );

    return { perfil, cargando, siguiendo, cardRef, esPropio, manejarSeguir, irAPerfil };
}
