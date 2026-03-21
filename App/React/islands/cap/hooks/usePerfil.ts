/**
 * [2003A-12] Hook para gestión de perfil de usuario.
 * Permite obtener y actualizar nombre, email y contraseña.
 */

import {useState, useCallback} from 'react';
import {API_BASE} from '../constants/cap-constants';

interface DatosPerfil {
    nombre: string;
    email: string;
    contrasenaActual: string;
    contrasenaNueva: string;
    confirmarContrasena: string;
}

interface UsePerfil {
    datos: DatosPerfil;
    guardando: boolean;
    error: string | null;
    exito: string | null;
    setDatos: (parcial: Partial<DatosPerfil>) => void;
    guardar: () => Promise<boolean>;
    limpiarMensajes: () => void;
}

export function usePerfil(nombreInicial: string, emailInicial: string): UsePerfil {
    const [datos, setDatosState] = useState<DatosPerfil>({
        nombre: nombreInicial,
        email: emailInicial,
        contrasenaActual: '',
        contrasenaNueva: '',
        confirmarContrasena: '',
    });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);

    const setDatos = useCallback((parcial: Partial<DatosPerfil>) => {
        setDatosState(prev => ({...prev, ...parcial}));
    }, []);

    const limpiarMensajes = useCallback(() => {
        setError(null);
        setExito(null);
    }, []);

    const guardar = useCallback(async (): Promise<boolean> => {
        limpiarMensajes();

        /* Validaciones locales */
        if (!datos.nombre.trim()) {
            setError('El nombre no puede estar vacío.');
            return false;
        }
        if (datos.contrasenaNueva && datos.contrasenaNueva !== datos.confirmarContrasena) {
            setError('Las contraseñas no coinciden.');
            return false;
        }

        const body: Record<string, string> = {};
        if (datos.nombre !== nombreInicial) body.nombre = datos.nombre;
        if (datos.email !== emailInicial) body.email = datos.email;
        if (datos.contrasenaNueva) {
            body.contrasenaActual = datos.contrasenaActual;
            body.contrasenaNueva = datos.contrasenaNueva;
        }

        if (Object.keys(body).length === 0) {
            setError('No hay cambios para guardar.');
            return false;
        }

        setGuardando(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const resp = await fetch(`${API_BASE}/perfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as {wpApiSettings?: {nonce?: string}}).wpApiSettings?.nonce || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            const json = await resp.json();

            if (!resp.ok) {
                setError(json.error || 'Error al actualizar el perfil.');
                return false;
            }

            setExito(json.mensaje || 'Perfil actualizado.');
            /* Limpiar contraseñas tras éxito */
            setDatosState(prev => ({...prev, contrasenaActual: '', contrasenaNueva: '', confirmarContrasena: ''}));
            return true;
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') {
                setError('La solicitud tardó demasiado. Intenta de nuevo.');
            } else {
                setError('Error de conexión al actualizar el perfil.');
            }
            return false;
        } finally {
            clearTimeout(timeout);
            setGuardando(false);
        }
    }, [datos, nombreInicial, emailInicial, limpiarMensajes]);

    return {datos, guardando, error, exito, setDatos, guardar, limpiarMensajes};
}
