/**
 * Hook para el sistema de mensajes (Timeline Chat + Historial)
 *
 * Maneja la comunicación con la API de mensajes:
 * - Obtener timeline de un elemento
 * - Enviar mensajes
 * - Estados de carga
 *
 * @package App/React/hooks
 */

import {useState, useCallback, useRef, useEffect} from 'react';

/* Tipos para el sistema de mensajes */
export type TipoMensaje = 'enviado' | 'recibido' | 'sistema';

export type AccionSistema = 'creado' | 'editado' | 'completado' | 'reabierto' | 'asignado' | 'desasignado' | 'adjunto_agregado' | 'adjunto_eliminado' | 'prioridad' | 'urgencia' | 'fecha_limite' | 'participante_agregado' | 'participante_removido' | 'compartido' | 'descripcion' | 'nombre';

export interface MensajeTimeline {
    id: number;
    tipoElemento: 'tarea' | 'proyecto' | 'habito';
    elementoId: number;
    usuarioId: number;
    usuarioNombre: string;
    avatar: string;
    tipoMensaje: 'usuario' | 'sistema';
    contenido: string;
    accionSistema: AccionSistema | null;
    datosExtra: Record<string, unknown> | null;
    fechaCreacion: string;
    esPropio: boolean;
}

interface EstadoMensajes {
    cargando: boolean;
    enviando: boolean;
    error: string | null;
    mensajes: MensajeTimeline[];
    total: number;
    hayMas: boolean;
}

interface UseMensajesReturn {
    estado: EstadoMensajes;
    cargarMensajes: () => Promise<void>;
    enviarMensaje: (contenido: string) => Promise<boolean>;
    cargarMas: () => Promise<void>;
    limpiarError: () => void;
}

/* Base URL de la API */
const API_BASE = '/wp-json/glory/v1/mensajes';

/**
 * Obtiene el nonce de WordPress para autenticación
 */
function obtenerNonce(): string {
    const wpData = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard;
    return wpData?.nonce || '';
}

/**
 * Hook principal para el sistema de mensajes
 */
export function useMensajes(tipoElemento: 'tarea' | 'proyecto' | 'habito', elementoId: number): UseMensajesReturn {
    const [estado, setEstado] = useState<EstadoMensajes>({
        cargando: false,
        enviando: false,
        error: null,
        mensajes: [],
        total: 0,
        hayMas: false
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const offsetRef = useRef(0);
    const limiteRef = useRef(50);

    /**
     * Realiza una petición a la API de mensajes
     */
    const fetchApi = useCallback(async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
        const url = `${API_BASE}${endpoint}`;

        const defaultOptions: RequestInit = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': obtenerNonce()
            }
        };

        const response = await fetch(url, {...defaultOptions, ...options});

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No autenticado. Inicia sesión para continuar.');
            }
            if (response.status === 403) {
                throw new Error('Sin permisos para acceder a este elemento.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        return response.json();
    }, []);

    /**
     * Carga los mensajes del timeline
     */
    const cargarMensajes = useCallback(async (): Promise<void> => {
        /* Cancelar petición anterior */
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setEstado(prev => ({...prev, cargando: true, error: null}));
        offsetRef.current = 0;

        try {
            const response = await fetchApi<{
                success: boolean;
                mensajes: MensajeTimeline[];
                total: number;
            }>(`/${tipoElemento}/${elementoId}?limite=${limiteRef.current}&offset=0`);

            if (!response.success) {
                throw new Error('Error al cargar mensajes');
            }

            setEstado(prev => ({
                ...prev,
                cargando: false,
                mensajes: response.mensajes,
                total: response.total,
                hayMas: response.mensajes.length < response.total
            }));

            offsetRef.current = response.mensajes.length;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            const mensaje = error instanceof Error ? error.message : 'Error desconocido';
            setEstado(prev => ({...prev, cargando: false, error: mensaje}));
        }
    }, [fetchApi, tipoElemento, elementoId]);

    /**
     * Carga más mensajes (paginación)
     */
    const cargarMas = useCallback(async (): Promise<void> => {
        if (estado.cargando || !estado.hayMas) return;

        setEstado(prev => ({...prev, cargando: true}));

        try {
            const response = await fetchApi<{
                success: boolean;
                mensajes: MensajeTimeline[];
                total: number;
            }>(`/${tipoElemento}/${elementoId}?limite=${limiteRef.current}&offset=${offsetRef.current}`);

            if (!response.success) {
                throw new Error('Error al cargar más mensajes');
            }

            setEstado(prev => ({
                ...prev,
                cargando: false,
                mensajes: [...prev.mensajes, ...response.mensajes],
                hayMas: prev.mensajes.length + response.mensajes.length < response.total
            }));

            offsetRef.current += response.mensajes.length;
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error desconocido';
            setEstado(prev => ({...prev, cargando: false, error: mensaje}));
        }
    }, [fetchApi, tipoElemento, elementoId, estado.cargando, estado.hayMas]);

    /**
     * Envía un mensaje de usuario
     */
    const enviarMensaje = useCallback(
        async (contenido: string): Promise<boolean> => {
            if (!contenido.trim()) return false;

            setEstado(prev => ({...prev, enviando: true, error: null}));

            try {
                const response = await fetchApi<{
                    success: boolean;
                    mensaje: MensajeTimeline;
                }>('', {
                    method: 'POST',
                    body: JSON.stringify({
                        tipoElemento,
                        elementoId,
                        contenido
                    })
                });

                if (!response.success) {
                    throw new Error('Error al enviar mensaje');
                }

                /* Agregar mensaje al estado (optimistic update) */
                setEstado(prev => ({
                    ...prev,
                    enviando: false,
                    mensajes: [...prev.mensajes, response.mensaje],
                    total: prev.total + 1
                }));

                return true;
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                setEstado(prev => ({...prev, enviando: false, error: mensaje}));
                return false;
            }
        },
        [fetchApi, tipoElemento, elementoId]
    );

    /**
     * Limpia el error actual
     */
    const limpiarError = useCallback(() => {
        setEstado(prev => ({...prev, error: null}));
    }, []);

    /* Cargar mensajes al montar o cambiar elemento */
    useEffect(() => {
        if (elementoId > 0) {
            cargarMensajes();
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [tipoElemento, elementoId, cargarMensajes]);

    return {
        estado,
        cargarMensajes,
        enviarMensaje,
        cargarMas,
        limpiarError
    };
}

/**
 * Registra un evento del sistema en el timeline (historial de cambios)
 * Esta función es independiente del hook y puede usarse desde cualquier lugar
 *
 * @param tipoElemento - Tipo de elemento ('tarea', 'proyecto', 'habito')
 * @param elementoId - ID del elemento
 * @param accion - Tipo de acción (ver AccionSistema)
 * @param detalle - Detalle opcional del cambio
 * @returns Promise<boolean> - true si se registró correctamente
 */
export async function registrarEventoSistema(tipoElemento: 'tarea' | 'proyecto' | 'habito', elementoId: number, accion: AccionSistema, detalle?: string | null): Promise<boolean> {
    /* No registrar eventos para elementos que no existen (IDs negativos = hábitos virtuales) */
    if (elementoId <= 0) return false;

    try {
        const response = await fetch(`${API_BASE}/evento`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': obtenerNonce()
            },
            body: JSON.stringify({
                tipoElemento,
                elementoId,
                accion,
                detalle
            })
        });

        if (!response.ok) {
            console.warn('Error al registrar evento del sistema:', response.status);
            return false;
        }

        const data = (await response.json()) as {success: boolean};
        return data.success;
    } catch (error) {
        console.warn('Error al registrar evento del sistema:', error);
        return false;
    }
}

/**
 * Convierte un mensaje del API al tipo visual del timeline
 */
export function obtenerTipoVisual(mensaje: MensajeTimeline): TipoMensaje {
    if (mensaje.tipoMensaje === 'sistema') {
        return 'sistema';
    }
    return mensaje.esPropio ? 'enviado' : 'recibido';
}

/**
 * Mapeo de iconos para mensajes del sistema
 */
export function obtenerIconoAccion(accion: AccionSistema | null): string {
    const iconos: Record<AccionSistema, string> = {
        creado: 'Plus',
        editado: 'Edit',
        completado: 'CheckCircle',
        reabierto: 'Clock',
        asignado: 'UserCheck',
        desasignado: 'UserMinus',
        adjunto_agregado: 'Paperclip',
        adjunto_eliminado: 'Trash2',
        prioridad: 'Tag',
        urgencia: 'Zap',
        fecha_limite: 'Calendar',
        participante_agregado: 'UserPlus',
        participante_removido: 'UserMinus',
        compartido: 'Share2',
        descripcion: 'FileText',
        nombre: 'Type'
    };

    return accion ? iconos[accion] || 'History' : 'History';
}

/*
 * Hook para obtener el conteo de mensajes no leídos de múltiples elementos
 * Optimizado para evitar múltiples llamadas a la API
 */

interface UseMensajesNoLeidosReturn {
    noLeidos: Record<number, number>;
    cargando: boolean;
    refrescar: () => Promise<void>;
}

export function useMensajesNoLeidos(tipoElemento: 'tarea' | 'proyecto' | 'habito', elementoIds: number[]): UseMensajesNoLeidosReturn {
    const [noLeidos, setNoLeidos] = useState<Record<number, number>>({});
    const [cargando, setCargando] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const refrescar = useCallback(async (): Promise<void> => {
        if (elementoIds.length === 0) {
            setNoLeidos({});
            return;
        }

        /* Cancelar petición anterior */
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setCargando(true);

        try {
            const response = await fetch(`${API_BASE}/no-leidos-masivo`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': obtenerNonce()
                },
                body: JSON.stringify({
                    tipoElemento,
                    elementoIds
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error('Error al obtener mensajes no leídos');
            }

            const data = (await response.json()) as {success: boolean; noLeidos: Record<string, number>};

            if (data.success) {
                /* Convertir claves de string a number */
                const resultado: Record<number, number> = {};
                for (const [key, value] of Object.entries(data.noLeidos)) {
                    resultado[parseInt(key, 10)] = value;
                }
                setNoLeidos(resultado);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            console.error('Error obteniendo mensajes no leídos:', error);
        } finally {
            setCargando(false);
        }
    }, [tipoElemento, JSON.stringify(elementoIds)]);

    /* Cargar al montar o cuando cambian los IDs */
    useEffect(() => {
        refrescar();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [refrescar]);

    return {noLeidos, cargando, refrescar};
}
