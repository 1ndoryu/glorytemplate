/*
 * Hook: useAuth
 * Gestión centralizada de autenticación.
 * Conecta el store de auth con las llamadas a la API.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { obtenerUsuarioActual, login, registrar as apiRegistrar } from '../services/apiAuth';
import { crearLogger } from '../services/logger';
import type { UsuarioAutenticado } from '../types/usuario';

const log = crearLogger('useAuth');

interface DatosRegistro {
    nombreVisible: string;
    username: string;
    email: string;
    password: string;
}

export const useAuth = () => {
    const usuario = useAuthStore(s => s.usuario);
    const cargandoStore = useAuthStore(s => s.cargando);
    const autenticado = useAuthStore(s => s.autenticado);
    const setUsuario = useAuthStore(s => s.setUsuario);
    const cerrarSesion = useAuthStore(s => s.cerrarSesion);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* Cargar usuario actual al montar */
    useEffect(() => {
        const verificar = async () => {
            try {
                const resp = await obtenerUsuarioActual();
                if (resp.ok && resp.data) {
                    setUsuario(resp.data as unknown as UsuarioAutenticado);
                }
            } catch (err) {
                log.debug('No hay sesión activa');
            }
        };

        if (!autenticado) {
            verificar();
        }
    }, [autenticado, setUsuario]);

    const iniciarSesion = useCallback(async (email: string, password: string) => {
        setError(null);
        setCargando(true);

        try {
            const resp = await login(email, password);

            if (resp.ok && resp.data) {
                /* El backend retorna { token, usuario } dentro de data */
                const datos = resp.data as unknown as { token?: string; usuario?: UsuarioAutenticado };
                const usuarioResp = datos.usuario ?? (resp.data as unknown as UsuarioAutenticado);
                setUsuario(usuarioResp);

                /* En desktop (Tauri): guardar JWT ANTES de redirigir.
                 * El await es crítico: sin él, window.location.href recarga la página
                 * antes de que el token quede persistido en el Tauri Store,
                 * y configurarApiDesktop() lo lee como null en la siguiente carga. */
                if (datos.token && (window as Record<string, unknown>).__KAMPLES_DESKTOP__) {
                    try {
                        const m = await import('@desktop/services/authDesktopService');
                        await m.guardarToken(datos.token as string);
                        if (datos.usuario) await m.guardarUsuario(datos.usuario);
                    } catch {
                        /* Solo falla en web — ignorar */
                    }
                }

                /* Redirigir a inicio después del login (token ya guardado) */
                window.location.href = '/';
            } else {
                setError(resp.error ?? 'Credenciales incorrectas');
            }
        } catch (err) {
            log.error('Error en login', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, [setUsuario]);

    const registrar = useCallback(async (datos: DatosRegistro) => {
        setError(null);
        setCargando(true);

        try {
            const resp = await apiRegistrar({
                username: datos.username,
                email: datos.email,
                password: datos.password,
                nombreVisible: datos.nombreVisible,
            });

            if (resp.ok && resp.data) {
                /* El backend retorna { token, usuario } dentro de data */
                const datos = resp.data as unknown as { token?: string; usuario?: UsuarioAutenticado };
                const usuarioResp = datos.usuario ?? (resp.data as unknown as UsuarioAutenticado);
                setUsuario(usuarioResp);

                /* En desktop (Tauri): guardar JWT para auth cross-origin */
                if (datos.token && (window as Record<string, unknown>).__KAMPLES_DESKTOP__) {
                    import('@desktop/services/authDesktopService').then(m => {
                        m.guardarToken(datos.token as string);
                        if (datos.usuario) m.guardarUsuario(datos.usuario);
                    }).catch(() => {
                        /* Solo falla en web — ignorar */
                    });
                }

                window.location.href = '/';
            } else {
                setError(resp.error ?? 'Error al crear la cuenta');
            }
        } catch (err) {
            log.error('Error en registro', err);
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setCargando(false);
        }
    }, [setUsuario]);

    const iniciarSesionGoogle = useCallback(() => {
        /* TO-DO: redirigir al flujo OAuth de WordPress/Google */
        log.info('Iniciando flujo OAuth Google');
        window.location.href = '/wp-login.php?action=wordpress_social_authenticate&mode=login&provider=Google';
    }, []);

    const logout = useCallback(() => {
        cerrarSesion();
        window.location.href = '/';
    }, [cerrarSesion]);

    return {
        usuario,
        autenticado,
        cargando: cargando || cargandoStore,
        error,
        iniciarSesion,
        registrar,
        iniciarSesionGoogle,
        logout,
    };
};
