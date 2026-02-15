/*
 * Componente: InicializadorAuth
 * Se monta una sola vez en AppProvider.
 * Lee GLORY_CONTEXT para detectar sesión de WordPress y sincroniza el authStore.
 * Si hay sesión PHP, también intenta obtener datos completos del perfil Kamples via API.
 */

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { obtenerUsuarioActual } from '../../services/apiAuth';
import { crearLogger } from '../../services/logger';

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

interface Props {
    children: ReactNode;
}

export const InicializadorAuth = ({ children }: Props): JSX.Element => {
    const { autenticado, setUsuario, setCargando } = useAuthStore();

    useEffect(() => {
        const inicializar = async () => {
            const ctx = obtenerContexto();

            /* Si PHP dice que no hay sesión, marcar como no autenticado */
            if (!ctx?.isLoggedIn || !ctx.userId) {
                setUsuario(null);
                return;
            }

            /*
             * PHP dice que hay sesión. Intentar obtener perfil completo de Kamples.
             * Si la API falla (usuario no tiene perfil Kamples aún), usar datos básicos de WP.
             */
            try {
                const resp = await obtenerUsuarioActual();
                if (resp.ok && resp.data) {
                    setUsuario(resp.data);
                    log.debug('Sesión Kamples verificada', resp.data);
                    return;
                }
            } catch (err) {
                log.debug('API /me no disponible, usando datos de WP');
            }

            /* Fallback: usar datos inyectados por PHP */
            if (ctx.currentUser) {
                setUsuario({
                    id: ctx.currentUser.id,
                    wpUserId: ctx.currentUser.id,
                    username: ctx.currentUser.username,
                    email: ctx.currentUser.email,
                    nombreVisible: ctx.currentUser.nombreVisible,
                    avatarUrl: ctx.currentUser.avatarUrl,
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
    }, []);

    return <>{children}</>;
};

export default InicializadorAuth;
