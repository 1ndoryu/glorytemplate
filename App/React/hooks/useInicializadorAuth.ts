/*
 * Hook: useInicializadorAuth
 * Lógica extraída de InicializadorAuth (SRP).
 * Lee GLORY_CONTEXT para detectar sesión de WordPress y sincroniza el authStore.
 * Preserva patrón cancelado/cleanup de sesión anterior.
 */

import { useEffect } from 'react';
import { useAuthStore } from '@app/stores/authStore';
import { obtenerUsuarioActual } from '@app/services/apiAuth';
import { crearLogger } from '@app/services/logger';

const log = crearLogger('InicializadorAuth');

interface GloryContextUser {
    id: number;
    username: string;
    email: string;
    nombreVisible: string;
    avatarUrl: string | null;
}

interface GloryContext {
    isLoggedIn?: boolean;
    userId?: number;
    currentUser?: GloryContextUser;
}

const obtenerContexto = (): GloryContext | null => {
    return (window as unknown as Record<string, unknown>).GLORY_CONTEXT as GloryContext | null;
};

export const useInicializadorAuth = (): void => {
    const autenticado = useAuthStore(s => s.autenticado);
    const setUsuario = useAuthStore(s => s.setUsuario);
    const setCargando = useAuthStore(s => s.setCargando);

    useEffect(() => {
        let cancelado = false;
        const inicializar = async () => {
            const ctx = obtenerContexto();

            /* Si PHP dice que no hay sesión, marcar como no autenticado */
            if (!ctx?.isLoggedIn || !ctx.userId) {
                if (!cancelado) setUsuario(null);
                return;
            }

            /*
             * PHP dice que hay sesión. Intentar obtener perfil completo de Kamples.
             * Si la API falla (usuario no tiene perfil Kamples aún), usar datos básicos de WP.
             */
            try {
                const resp = await obtenerUsuarioActual();
                if (cancelado) return;
                if (resp.ok && resp.data) {
                    setUsuario(resp.data);
                    log.debug('Sesión Kamples verificada', resp.data);
                    return;
                }
            } catch (err) {
                if (cancelado) return;
                log.debug('API /me no disponible, usando datos de WP');
            }

            if (cancelado) return;

            /* Fallback: usar datos inyectados por PHP */
            if (ctx.currentUser) {
                /* Normalizar avatarUrl: cadena vacía → null para que Avatar muestre iniciales */
                const avatarNormalizado = ctx.currentUser.avatarUrl?.trim() || null;
                setUsuario({
                    id: ctx.currentUser.id,
                    wpUserId: ctx.currentUser.id,
                    username: ctx.currentUser.username,
                    email: ctx.currentUser.email,
                    nombreVisible: ctx.currentUser.nombreVisible,
                    avatarUrl: avatarNormalizado,
                    plan: 'free',
                    verificado: false,
                } as never);
                log.debug('Sesión WP detectada (sin perfil Kamples)', ctx.currentUser.username);
            } else {
                setUsuario(null);
            }
        };

        if (!autenticado) {
            inicializar();
        } else {
            setCargando(false);
        }
        return () => { cancelado = true; };
    }, []);
};
