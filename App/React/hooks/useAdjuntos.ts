/*
 * useAdjuntos
 * Hook para gestionar subida y descarga de adjuntos via API
 * Reemplaza la subida Base64 por multipart/form-data
 */

import {useState, useCallback} from 'react';
import type {Adjunto} from '../types/dashboard';
import {useAlmacenamiento} from './useAlmacenamiento';

interface EstadoSubida {
    subiendo: boolean;
    progreso: number;
    error: string | null;
}

interface UseAdjuntosReturn {
    estado: EstadoSubida;
    subirArchivo: (archivo: File) => Promise<Adjunto | null>;
    eliminarArchivo: (adjunto: Adjunto) => Promise<boolean>;
    descargarArchivo: (adjunto: Adjunto) => Promise<Blob | null>;
    verificarEspacio: (tamano: number) => Promise<boolean>;
    limpiarError: () => void;
}

/* Límite de tamaño por archivo (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* Tipos MIME permitidos */
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

/**
 * Hook para gestionar adjuntos con subida física al servidor
 */
export function useAdjuntos(): UseAdjuntosReturn {
    const [estado, setEstado] = useState<EstadoSubida>({
        subiendo: false,
        progreso: 0,
        error: null
    });

    const {cargar: refrescarAlmacenamiento} = useAlmacenamiento();

    /**
     * Obtiene las credenciales necesarias para la API
     */
    const obtenerCredenciales = useCallback((): {apiUrl: string; nonce: string} | null => {
        const gloryData = (window as any).gloryDashboard;

        if (!gloryData?.apiUrl || !gloryData?.nonce) {
            return null;
        }

        return {
            apiUrl: gloryData.apiUrl,
            nonce: gloryData.nonce
        };
    }, []);

    /**
     * Valida el archivo antes de subir
     */
    const validarArchivo = useCallback((archivo: File): string | null => {
        if (archivo.size > MAX_FILE_SIZE) {
            return `El archivo es demasiado grande (máx: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB)`;
        }

        if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
            return 'Tipo de archivo no permitido';
        }

        return null;
    }, []);

    /**
     * Sube un archivo al servidor
     */
    const subirArchivo = useCallback(
        async (archivo: File): Promise<Adjunto | null> => {
            const credenciales = obtenerCredenciales();

            if (!credenciales) {
                setEstado(prev => ({...prev, error: 'No autenticado'}));
                return null;
            }

            /* Validar archivo */
            const errorValidacion = validarArchivo(archivo);
            if (errorValidacion) {
                setEstado(prev => ({...prev, error: errorValidacion}));
                return null;
            }

            setEstado({subiendo: true, progreso: 0, error: null});

            try {
                const formData = new FormData();
                formData.append('archivo', archivo);

                const response = await fetch(`${credenciales.apiUrl}/adjuntos`, {
                    method: 'POST',
                    headers: {
                        'X-WP-Nonce': credenciales.nonce
                    },
                    body: formData,
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    const mensaje = data.error || 'Error al subir archivo';
                    setEstado({subiendo: false, progreso: 0, error: mensaje});
                    return null;
                }

                /* Refrescar información de almacenamiento */
                refrescarAlmacenamiento();

                setEstado({subiendo: false, progreso: 100, error: null});

                /* Convertir respuesta a tipo Adjunto */
                const adjunto: Adjunto = {
                    id: data.adjunto.id,
                    tipo: data.adjunto.tipo,
                    url: data.adjunto.url,
                    nombre: data.adjunto.nombre,
                    tamano: data.adjunto.tamano,
                    fechaSubida: data.adjunto.fechaSubida,
                    thumbnailUrl: data.adjunto.thumbnailUrl
                };

                return adjunto;
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error de conexión';
                setEstado({subiendo: false, progreso: 0, error: mensaje});
                return null;
            }
        },
        [obtenerCredenciales, validarArchivo, refrescarAlmacenamiento]
    );

    /**
     * Elimina un archivo del servidor
     */
    const eliminarArchivo = useCallback(
        async (adjunto: Adjunto): Promise<boolean> => {
            const credenciales = obtenerCredenciales();

            if (!credenciales) {
                setEstado(prev => ({...prev, error: 'No autenticado'}));
                return false;
            }

            /* Extraer nombre de archivo de la URL */
            const urlParams = new URL(adjunto.url, window.location.origin);
            const nombreArchivo = urlParams.searchParams.get('file');

            if (!nombreArchivo) {
                setEstado(prev => ({...prev, error: 'URL de archivo inválida'}));
                return false;
            }

            try {
                const response = await fetch(`${credenciales.apiUrl}/adjuntos/${adjunto.id}?file=${encodeURIComponent(nombreArchivo)}`, {
                    method: 'DELETE',
                    headers: {
                        'X-WP-Nonce': credenciales.nonce
                    },
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    setEstado(prev => ({...prev, error: data.error || 'Error al eliminar'}));
                    return false;
                }

                /* Refrescar información de almacenamiento */
                refrescarAlmacenamiento();

                return true;
            } catch (error) {
                const mensaje = error instanceof Error ? error.message : 'Error de conexión';
                setEstado(prev => ({...prev, error: mensaje}));
                return false;
            }
        },
        [obtenerCredenciales, refrescarAlmacenamiento]
    );

    /**
     * Descarga un archivo del servidor
     */
    const descargarArchivo = useCallback(
        async (adjunto: Adjunto): Promise<Blob | null> => {
            const credenciales = obtenerCredenciales();

            if (!credenciales) {
                return null;
            }

            try {
                const response = await fetch(adjunto.url, {
                    headers: {
                        'X-WP-Nonce': credenciales.nonce
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    return null;
                }

                return await response.blob();
            } catch {
                return null;
            }
        },
        [obtenerCredenciales]
    );

    /**
     * Verifica si hay espacio suficiente para subir
     */
    const verificarEspacio = useCallback(
        async (tamano: number): Promise<boolean> => {
            const credenciales = obtenerCredenciales();

            if (!credenciales) {
                return false;
            }

            try {
                const response = await fetch(`${credenciales.apiUrl}/adjuntos/verificar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': credenciales.nonce
                    },
                    body: JSON.stringify({tamano}),
                    credentials: 'same-origin'
                });

                const data = await response.json();
                return data.success && data.puedeSubir;
            } catch {
                return false;
            }
        },
        [obtenerCredenciales]
    );

    /**
     * Limpia el error actual
     */
    const limpiarError = useCallback(() => {
        setEstado(prev => ({...prev, error: null}));
    }, []);

    return {
        estado,
        subirArchivo,
        eliminarArchivo,
        descargarArchivo,
        verificarEspacio,
        limpiarError
    };
}
