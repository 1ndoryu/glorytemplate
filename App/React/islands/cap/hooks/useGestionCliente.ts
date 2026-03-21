/* [2003A-15] Hook para gestionar un cliente desde el panel admin.
 * Cubre: editar datos de usuario, cambiar estado de plan, bloquear/desbloquear
 * acceso y eliminar cuenta con borrado en cascada.
 * El admin no necesita la contraseña actual del usuario para cambiarla. */

import {useState, useCallback, useRef} from 'react';
import {API_BASE} from '../constants/cap-constants';

interface DatosUsuario {
    nombre: string;
    email: string;
    contrasena: string;
}

interface UseGestionClienteReturn {
    guardando: boolean;
    error: string;
    exito: string;
    limpiarMensajes: () => void;
    actualizarUsuario: (userId: number, datos: DatosUsuario) => Promise<boolean>;
    cambiarPlan: (centroId: number, accion: 'activar' | 'desactivar') => Promise<boolean>;
    cambiarAcceso: (userId: number, bloqueado: boolean) => Promise<boolean>;
    eliminarUsuario: (userId: number) => Promise<boolean>;
}

function getNonce(): string {
    return (window as any).wpApiSettings?.nonce || '';
}

export function useGestionCliente(): UseGestionClienteReturn {
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const limpiarMensajes = useCallback(() => {
        setError('');
        setExito('');
    }, []);

    const peticion = useCallback(
        async (url: string, method: string, body?: object): Promise<{ok: boolean; data: any}> => {
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            setGuardando(true);
            setError('');
            setExito('');

            try {
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce(),
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: abortRef.current.signal,
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    setError(data.error || data.message || 'Error en la operación');
                    return {ok: false, data};
                }

                return {ok: true, data};
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError('Error de conexión. Intenta de nuevo.');
                }
                return {ok: false, data: null};
            } finally {
                setGuardando(false);
            }
        },
        [],
    );

    const actualizarUsuario = useCallback(
        async (userId: number, datos: DatosUsuario): Promise<boolean> => {
            const body: Record<string, string> = {};

            const nombre = datos.nombre.trim();
            const email = datos.email.trim();
            const contrasena = datos.contrasena.trim();

            if (!nombre && !email && !contrasena) {
                setError('Modifica al menos un campo');
                return false;
            }

            if (nombre) body.nombre = nombre;
            if (email) body.email = email;
            if (contrasena) {
                if (contrasena.length < 8) {
                    setError('La contraseña debe tener al menos 8 caracteres');
                    return false;
                }
                body.contrasena = contrasena;
            }

            const {ok, data} = await peticion(`${API_BASE}/admin/clientes/${userId}/usuario`, 'PUT', body);
            if (ok) setExito(data.mensaje || 'Datos actualizados');
            return ok;
        },
        [peticion],
    );

    const cambiarPlan = useCallback(
        async (centroId: number, accion: 'activar' | 'desactivar'): Promise<boolean> => {
            const {ok, data} = await peticion(`${API_BASE}/admin/clientes/${centroId}/plan`, 'PUT', {accion});
            if (ok) setExito(data.mensaje || 'Plan actualizado');
            return ok;
        },
        [peticion],
    );

    const cambiarAcceso = useCallback(
        async (userId: number, bloqueado: boolean): Promise<boolean> => {
            const {ok, data} = await peticion(`${API_BASE}/admin/clientes/${userId}/acceso`, 'PUT', {bloqueado});
            if (ok) setExito(data.mensaje || (bloqueado ? 'Acceso bloqueado' : 'Acceso restaurado'));
            return ok;
        },
        [peticion],
    );

    const eliminarUsuario = useCallback(
        async (userId: number): Promise<boolean> => {
            const {ok, data} = await peticion(`${API_BASE}/admin/clientes/${userId}`, 'DELETE');
            if (ok) setExito(data.mensaje || 'Usuario eliminado');
            return ok;
        },
        [peticion],
    );

    return {
        guardando,
        error,
        exito,
        limpiarMensajes,
        actualizarUsuario,
        cambiarPlan,
        cambiarAcceso,
        eliminarUsuario,
    };
}
