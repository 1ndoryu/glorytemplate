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
import { esNativo } from '@app/utils/plataforma';

const log = crearLogger('InicializadorAuth');
const LS_KEY_TOKEN = 'kamples_auth_token';

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
    const perfilVerificado = useAuthStore(s => s.perfilVerificado);
    const setUsuario = useAuthStore(s => s.setUsuario);
    const setCargando = useAuthStore(s => s.setCargando);

    useEffect(() => {
        let cancelado = false;
        const inicializar = async () => {
            const ctx = obtenerContexto();

            /* Si PHP dice que no hay sesión, verificar token nativo antes de cerrar */
            if (!ctx?.isLoggedIn || !ctx.userId) {
                /* [183A-41] En Capacitor/Tauri, la sesión PHP puede expirar entre reinicios
                 * pero el JWT persiste en localStorage. Intentar restaurar sesión desde el
                 * token antes de mostrar el modal de login. apiCliente ya adjunta el Bearer
                 * automáticamente en plataformas nativas. */
                if (esNativo()) {
                    try {
                        const tokenGuardado = localStorage.getItem(LS_KEY_TOKEN);
                        if (tokenGuardado) {
                            const resp = await obtenerUsuarioActual();
                            if (cancelado) return;
                            if (resp.ok && resp.data) {
                                setUsuario(resp.data);
                                /* Sincronizar GLORY_CONTEXT para evitar desync */
                                const ctxMutable = window.GLORY_CONTEXT as Record<string, unknown> | undefined;
                                if (ctxMutable) {
                                    ctxMutable.isLoggedIn = true;
                                    ctxMutable.userId = resp.data.wpUserId ?? resp.data.id;
                                }
                                log.debug('Sesión restaurada desde token nativo persistido');
                                return;
                            }
                        }
                    } catch {
                        log.debug('Token nativo expirado o inválido, mostrando login');
                    }
                }
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
                } as never, false /* QK3: datos parciales de WP, no API /me */);
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

    /*
     * QK3: Refetch silencioso de /me cuando hay pre-autenticación
     * con datos parciales (desktop Tauri Store cache, WP fallback).
     * Obtiene datos completos (generosPreferidos, etc.) y marca perfilVerificado=true.
     * Sin esto, el modal de generos no sabe si los datos son completos.
     */
    useEffect(() => {
        if (!autenticado || perfilVerificado) return;

        let cancelado = false;
        const verificar = async () => {
            try {
                const resp = await obtenerUsuarioActual();
                if (cancelado) return;
                if (resp.ok && resp.data) {
                    setUsuario(resp.data);
                    log.debug('Perfil completo obtenido (refetch)', resp.data);
                }
            } catch {
                if (cancelado) return;
                log.debug('Refetch /me falló — datos parciales se mantienen');
            }
        };
        verificar();
        return () => { cancelado = true; };
    }, [autenticado, perfilVerificado, setUsuario]);
};
