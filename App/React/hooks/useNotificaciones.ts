/*
 * Hook useNotificaciones
 *
 * Gestiona el estado y las operaciones del sistema de notificaciones.
 * Proporciona polling cada 30 segundos para actualizaciones en tiempo real.
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import type {Notificacion, RespuestaNotificaciones, PaginacionNotificaciones} from '../types/dashboard';

interface EstadoNotificaciones {
    notificaciones: Notificacion[];
    noLeidas: number;
    total: number;
    paginacion: PaginacionNotificaciones;
    cargando: boolean;
    error: string | null;
}

interface AccionesNotificaciones {
    cargarNotificaciones: (pagina?: number, soloNoLeidas?: boolean) => Promise<void>;
    marcarLeida: (id: number) => Promise<boolean>;
    marcarTodasLeidas: () => Promise<boolean>;
    eliminar: (id: number) => Promise<boolean>;
    refrescar: () => Promise<void>;
}

interface HookNotificaciones extends EstadoNotificaciones, AccionesNotificaciones {}

const INTERVALO_POLLING = 30000;
const BASE_URL = '/wp-json/glory/v1';

export function useNotificaciones(habilitado: boolean = true): HookNotificaciones {
    const [estado, setEstado] = useState<EstadoNotificaciones>({
        notificaciones: [],
        noLeidas: 0,
        total: 0,
        paginacion: {pagina: 1, porPagina: 20, totalPaginas: 0},
        cargando: false,
        error: null
    });

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const montadoRef = useRef(true);

    /* Cargar notificaciones con paginación opcional */
    const cargarNotificaciones = useCallback(
        async (pagina: number = 1, soloNoLeidas: boolean = false): Promise<void> => {
            if (!habilitado) return;

            setEstado(prev => ({...prev, cargando: true, error: null}));

            try {
                const params = new URLSearchParams({
                    pagina: pagina.toString(),
                    porPagina: '20',
                    soloNoLeidas: soloNoLeidas.toString()
                });

                const respuesta = await fetch(`${BASE_URL}/notificaciones?${params}`, {
                    headers: {
                        'X-WP-Nonce': (window as unknown as {gloryNonce?: string}).gloryNonce || ''
                    }
                });

                if (!respuesta.ok) {
                    throw new Error(`Error HTTP: ${respuesta.status}`);
                }

                const json = await respuesta.json();

                if (!montadoRef.current) return;

                if (json.success && json.data) {
                    const datos = json.data as RespuestaNotificaciones;
                    setEstado(prev => ({
                        ...prev,
                        notificaciones: datos.notificaciones,
                        total: datos.total,
                        paginacion: datos.paginacion,
                        cargando: false
                    }));
                } else {
                    throw new Error(json.message || 'Error al cargar notificaciones');
                }
            } catch (err) {
                if (!montadoRef.current) return;
                setEstado(prev => ({
                    ...prev,
                    cargando: false,
                    error: err instanceof Error ? err.message : 'Error desconocido'
                }));
            }
        },
        [habilitado]
    );

    /* Cargar solo el contador de no leídas (para polling ligero) */
    const cargarContador = useCallback(async (): Promise<void> => {
        if (!habilitado) return;

        try {
            const respuesta = await fetch(`${BASE_URL}/notificaciones/no-leidas`, {
                headers: {
                    'X-WP-Nonce': (window as unknown as {gloryNonce?: string}).gloryNonce || ''
                }
            });

            if (!respuesta.ok) return;

            const json = await respuesta.json();

            if (!montadoRef.current) return;

            if (json.success && json.data) {
                setEstado(prev => ({
                    ...prev,
                    noLeidas: json.data.noLeidas || 0
                }));
            }
        } catch {
            /* Silenciar errores de polling */
        }
    }, [habilitado]);

    /* Marcar una notificación como leída */
    const marcarLeida = useCallback(async (id: number): Promise<boolean> => {
        try {
            const respuesta = await fetch(`${BASE_URL}/notificaciones/${id}/leer`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as unknown as {gloryNonce?: string}).gloryNonce || ''
                }
            });

            const json = await respuesta.json();

            if (json.success) {
                setEstado(prev => ({
                    ...prev,
                    notificaciones: prev.notificaciones.map(n => (n.id === id ? {...n, leida: true, fechaLectura: new Date().toISOString()} : n)),
                    noLeidas: Math.max(0, prev.noLeidas - 1)
                }));
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }, []);

    /* Marcar todas las notificaciones como leídas */
    const marcarTodasLeidas = useCallback(async (): Promise<boolean> => {
        try {
            const respuesta = await fetch(`${BASE_URL}/notificaciones/leer-todas`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as unknown as {gloryNonce?: string}).gloryNonce || ''
                }
            });

            const json = await respuesta.json();

            if (json.success) {
                setEstado(prev => ({
                    ...prev,
                    notificaciones: prev.notificaciones.map(n => ({
                        ...n,
                        leida: true,
                        fechaLectura: n.fechaLectura || new Date().toISOString()
                    })),
                    noLeidas: 0
                }));
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }, []);

    /* Eliminar una notificación */
    const eliminar = useCallback(async (id: number): Promise<boolean> => {
        try {
            const respuesta = await fetch(`${BASE_URL}/notificaciones/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': (window as unknown as {gloryNonce?: string}).gloryNonce || ''
                }
            });

            const json = await respuesta.json();

            if (json.success) {
                setEstado(prev => {
                    const notificacionEliminada = prev.notificaciones.find(n => n.id === id);
                    const eraNoLeida = notificacionEliminada && !notificacionEliminada.leida;

                    return {
                        ...prev,
                        notificaciones: prev.notificaciones.filter(n => n.id !== id),
                        total: Math.max(0, prev.total - 1),
                        noLeidas: eraNoLeida ? Math.max(0, prev.noLeidas - 1) : prev.noLeidas
                    };
                });
                return true;
            }

            return false;
        } catch {
            return false;
        }
    }, []);

    /* Refrescar todo */
    const refrescar = useCallback(async (): Promise<void> => {
        await Promise.all([cargarNotificaciones(1), cargarContador()]);
    }, [cargarNotificaciones, cargarContador]);

    /* Efecto: Carga inicial y polling */
    useEffect(() => {
        montadoRef.current = true;

        if (habilitado) {
            cargarContador();
            cargarNotificaciones(1);

            intervalRef.current = setInterval(() => {
                cargarContador();
            }, INTERVALO_POLLING);
        }

        return () => {
            montadoRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [habilitado, cargarContador, cargarNotificaciones]);

    return {
        ...estado,
        cargarNotificaciones,
        marcarLeida,
        marcarTodasLeidas,
        eliminar,
        refrescar
    };
}
