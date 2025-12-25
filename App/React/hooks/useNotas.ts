/**
 * Hook para el sistema de notas del Scratchpad
 *
 * Sistema de notas persistentes donde:
 * - Siempre hay una "nota activa" siendo editada
 * - Al guardar, se actualiza la nota activa (no se crea una nueva)
 * - Al seleccionar otra nota, esa se convierte en la activa
 * - El título se extrae de la primera línea con #
 *
 * @package App/React/hooks
 */

import {useState, useCallback, useRef, useEffect} from 'react';

/* Tipos para el sistema de notas */
export interface Nota {
    id: number;
    titulo: string;
    contenido: string;
    fechaCreacion: string;
    fechaModificacion: string;
}

/* Nota activa: puede tener ID (existente) o no (nueva) */
export interface NotaActiva {
    id: number | null;
    contenido: string;
    modificada: boolean;
}

interface EstadoNotas {
    cargando: boolean;
    guardando: boolean;
    eliminando: boolean;
    error: string | null;
    notas: Nota[];
    total: number;
    hayMas: boolean;
    notaActiva: NotaActiva;
}

interface UseNotasReturn {
    estado: EstadoNotas;
    cargarNotas: () => Promise<void>;
    guardarNotaActiva: () => Promise<Nota | null>;
    eliminarNota: (id: number) => Promise<boolean>;
    buscarNotas: (termino: string) => Promise<Nota[]>;
    cargarMas: () => Promise<void>;
    limpiarError: () => void;
    seleccionarNota: (nota: Nota) => void;
    crearNuevaNota: () => void;
    actualizarContenido: (contenido: string) => void;
    obtenerTituloDeContenido: (contenido: string) => string;
}

/* Base URL de la API */
const API_BASE = '/wp-json/glory/v1/notas';

/* Contenido inicial para una nota nueva */
const CONTENIDO_NOTA_NUEVA = '# Nueva nota\n\n';

/**
 * Obtiene el nonce de WordPress para autenticación
 */
function obtenerNonce(): string {
    const wpData = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard;
    return wpData?.nonce || '';
}

/**
 * Extrae el título de la primera línea con # del contenido
 */
function extraerTitulo(contenido: string): string {
    const lineas = contenido.split('\n');
    const primeraLinea = lineas[0]?.trim() || '';

    /* Si empieza con #, extraer el texto después del # */
    if (primeraLinea.startsWith('#')) {
        const titulo = primeraLinea.replace(/^#+\s*/, '').trim();
        return titulo || 'Sin título';
    }

    /* Si no tiene #, usar las primeras palabras */
    const palabras = primeraLinea.split(' ').slice(0, 5).join(' ');
    return palabras || 'Sin título';
}

/**
 * Hook principal para el sistema de notas
 */
export function useNotas(): UseNotasReturn {
    const [estado, setEstado] = useState<EstadoNotas>({
        cargando: false,
        guardando: false,
        eliminando: false,
        error: null,
        notas: [],
        total: 0,
        hayMas: false,
        notaActiva: {
            id: null,
            contenido: CONTENIDO_NOTA_NUEVA,
            modificada: false
        }
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const offsetRef = useRef(0);
    const limiteRef = useRef(50);

    /**
     * Realiza una petición a la API de notas
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
                throw new Error('Sin permisos para acceder a las notas.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        return response.json();
    }, []);

    /**
     * Carga las notas del usuario
     */
    const cargarNotas = useCallback(async (): Promise<void> => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setEstado(prev => ({...prev, cargando: true, error: null}));
        offsetRef.current = 0;

        try {
            const response = await fetchApi<{
                success: boolean;
                notas: Nota[];
                total: number;
                hayMas: boolean;
            }>(`?limite=${limiteRef.current}&offset=0`);

            if (!response.success) {
                throw new Error('Error al cargar notas');
            }

            setEstado(prev => ({
                ...prev,
                cargando: false,
                notas: response.notas,
                total: response.total,
                hayMas: response.hayMas
            }));

            offsetRef.current = response.notas.length;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return;
            }
            const mensaje = error instanceof Error ? error.message : 'Error desconocido';
            setEstado(prev => ({...prev, cargando: false, error: mensaje}));
        }
    }, [fetchApi]);

    /**
     * Carga más notas (paginación)
     */
    const cargarMas = useCallback(async (): Promise<void> => {
        if (estado.cargando || !estado.hayMas) return;

        setEstado(prev => ({...prev, cargando: true}));

        try {
            const response = await fetchApi<{
                success: boolean;
                notas: Nota[];
                total: number;
                hayMas: boolean;
            }>(`?limite=${limiteRef.current}&offset=${offsetRef.current}`);

            if (!response.success) {
                throw new Error('Error al cargar más notas');
            }

            setEstado(prev => ({
                ...prev,
                cargando: false,
                notas: [...prev.notas, ...response.notas],
                hayMas: response.hayMas
            }));

            offsetRef.current += response.notas.length;
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error desconocido';
            setEstado(prev => ({...prev, cargando: false, error: mensaje}));
        }
    }, [fetchApi, estado.cargando, estado.hayMas]);

    /**
     * Guarda la nota activa (crea nueva o actualiza existente)
     */
    const guardarNotaActiva = useCallback(async (): Promise<Nota | null> => {
        const {notaActiva} = estado;

        if (!notaActiva.contenido.trim()) return null;

        setEstado(prev => ({...prev, guardando: true, error: null}));

        const titulo = extraerTitulo(notaActiva.contenido);

        try {
            let notaGuardada: Nota;

            if (notaActiva.id) {
                /* Actualizar nota existente */
                const response = await fetchApi<{
                    success: boolean;
                    nota: Nota;
                }>(`/${notaActiva.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        contenido: notaActiva.contenido,
                        titulo
                    })
                });

                if (!response.success) {
                    throw new Error('Error al actualizar nota');
                }

                notaGuardada = response.nota;

                /* Actualizar en la lista de notas */
                setEstado(prev => ({
                    ...prev,
                    guardando: false,
                    notas: prev.notas.map(n => (n.id === notaActiva.id ? notaGuardada : n)),
                    notaActiva: {
                        ...prev.notaActiva,
                        modificada: false
                    }
                }));
            } else {
                /* Crear nota nueva */
                const response = await fetchApi<{
                    success: boolean;
                    nota: Nota;
                }>('', {
                    method: 'POST',
                    body: JSON.stringify({
                        contenido: notaActiva.contenido,
                        titulo
                    })
                });

                if (!response.success) {
                    throw new Error('Error al guardar nota');
                }

                notaGuardada = response.nota;

                /* Agregar al inicio de la lista y establecer como activa */
                setEstado(prev => ({
                    ...prev,
                    guardando: false,
                    notas: [notaGuardada, ...prev.notas],
                    total: prev.total + 1,
                    notaActiva: {
                        id: notaGuardada.id,
                        contenido: notaGuardada.contenido,
                        modificada: false
                    }
                }));
            }

            return notaGuardada;
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error desconocido';
            setEstado(prev => ({...prev, guardando: false, error: mensaje}));
            return null;
        }
    }, [estado.notaActiva, fetchApi]);

    /**
     * Elimina una nota
     */
    const eliminarNota = useCallback(
        async (id: number): Promise<boolean> => {
            setEstado(prev => ({...prev, eliminando: true, error: null}));

            try {
                const response = await fetchApi<{
                    success: boolean;
                }>(`/${id}`, {
                    method: 'DELETE'
                });

                if (!response.success) {
                    throw new Error('Error al eliminar nota');
                }

                /* Remover nota del estado */
                setEstado(prev => {
                    const nuevasNotas = prev.notas.filter(n => n.id !== id);

                    /* Si la nota eliminada era la activa, crear una nueva */
                    const nuevaActiva = prev.notaActiva.id === id ? {id: null, contenido: CONTENIDO_NOTA_NUEVA, modificada: false} : prev.notaActiva;

                    return {
                        ...prev,
                        eliminando: false,
                        notas: nuevasNotas,
                        total: prev.total - 1,
                        notaActiva: nuevaActiva
                    };
                });

                return true;
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error desconocido';
                setEstado(prev => ({...prev, eliminando: false, error: mensaje}));
                return false;
            }
        },
        [fetchApi]
    );

    /**
     * Busca notas por término
     */
    const buscarNotas = useCallback(
        async (termino: string): Promise<Nota[]> => {
            if (!termino.trim()) return [];

            try {
                const response = await fetchApi<{
                    success: boolean;
                    notas: Nota[];
                }>(`/buscar?q=${encodeURIComponent(termino)}`);

                if (!response.success) {
                    return [];
                }

                return response.notas;
            } catch (error) {
                console.error('Error buscando notas:', error);
                return [];
            }
        },
        [fetchApi]
    );

    /**
     * Selecciona una nota existente como activa
     */
    const seleccionarNota = useCallback((nota: Nota) => {
        setEstado(prev => ({
            ...prev,
            notaActiva: {
                id: nota.id,
                contenido: nota.contenido,
                modificada: false
            }
        }));
    }, []);

    /**
     * Crea una nueva nota (limpia la activa)
     */
    const crearNuevaNota = useCallback(() => {
        setEstado(prev => ({
            ...prev,
            notaActiva: {
                id: null,
                contenido: CONTENIDO_NOTA_NUEVA,
                modificada: false
            }
        }));
    }, []);

    /**
     * Actualiza el contenido de la nota activa
     */
    const actualizarContenido = useCallback((contenido: string) => {
        setEstado(prev => ({
            ...prev,
            notaActiva: {
                ...prev.notaActiva,
                contenido,
                modificada: true
            }
        }));
    }, []);

    /**
     * Obtiene el título de un contenido (helper público)
     */
    const obtenerTituloDeContenido = useCallback((contenido: string): string => {
        return extraerTitulo(contenido);
    }, []);

    /**
     * Limpia el error actual
     */
    const limpiarError = useCallback(() => {
        setEstado(prev => ({...prev, error: null}));
    }, []);

    /* Cargar notas al montar */
    useEffect(() => {
        cargarNotas();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [cargarNotas]);

    return {
        estado,
        cargarNotas,
        guardarNotaActiva,
        eliminarNota,
        buscarNotas,
        cargarMas,
        limpiarError,
        seleccionarNota,
        crearNuevaNota,
        actualizarContenido,
        obtenerTituloDeContenido
    };
}
