/* sentinel-disable-file limite-lineas — hook cohesivo: dos descargas de PDF (plan + control horas)
 * con decodificación base64/blob, creación de link temporal y cleanup. */

/**
 * useReportes
 *
 * Hook personalizado para la generación y descarga de reportes PDF.
 * Gestiona el estado de generación y las descargas.
 */

import {useState, useCallback} from 'react';
import type {Alumno} from '../types';
import {API_BASE} from '../constants/cap-constants';
import {obtenerMensajeContextual, interpretarErrorHttp, formatearMensajeError} from '../constants/cap-errores';

interface EstadoReportes {
    generando: boolean;
    tipoGenerando: 'plan-alumno' | 'control-horas' | null;
    error: string | null;
    exito: string | null;
}

interface UseReportesReturn extends EstadoReportes {
    descargarPlanAlumno: (alumnoId: number, nombreAlumno: string) => Promise<void>;
    descargarControlHoras: (semana: string) => Promise<void>;
    limpiarMensajes: () => void;
}

export function useReportes(): UseReportesReturn {
    const [estado, setEstado] = useState<EstadoReportes>({
        generando: false,
        tipoGenerando: null,
        error: null,
        exito: null
    });

    const limpiarMensajes = useCallback(() => {
        setEstado(prev => ({...prev, error: null, exito: null}));
    }, []);

    /**
     * Descarga el PDF del plan de formación de un alumno
     */
    const descargarPlanAlumno = useCallback(async (alumnoId: number, nombreAlumno: string) => {
        setEstado(prev => ({
            ...prev,
            generando: true,
            tipoGenerando: 'plan-alumno',
            error: null,
            exito: null
        }));

        try {
            const nonce = (window as any).wpApiSettings?.nonce || '';
            const response = await fetch(`${API_BASE}/reportes/plan-alumno/${alumnoId}`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': nonce
                }
            });

            let data: any = null;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('[useReportes] Error parseando respuesta JSON:', parseError);
                throw new Error('La respuesta del servidor no tiene un formato válido');
            }

            if (!response.ok || data?.error) {
                const contextual = obtenerMensajeContextual('reportes', 'generar');
                const mensajeBackend = data?.error || data?.message;
                if (mensajeBackend) {
                    const interpretado = interpretarErrorHttp(response.status, mensajeBackend);
                    throw new Error(formatearMensajeError(interpretado));
                }
                throw new Error(`${contextual.fallback} ${contextual.sugerencia}`);
            }

            if (!data?.pdf) {
                throw new Error('El servidor no devolvió el PDF correctamente');
            }

            /* Decodificar base64 a blob */
            const binaryString = atob(data.pdf);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], {type: data.tipo || 'application/pdf'});

            /* Crear URL temporal y descargar */
            const blobUrl = window.URL.createObjectURL(blob);
            const nombreArchivo = data.nombre || `plan-formacion-${nombreAlumno.replace(/\s+/g, '-').toLowerCase()}.pdf`;

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();

            /* Limpiar después de un breve delay */
            setTimeout(() => {
                if (a.parentNode) {
                    document.body.removeChild(a);
                }
                window.URL.revokeObjectURL(blobUrl);
            }, 150);

            setEstado(prev => ({
                ...prev,
                generando: false,
                tipoGenerando: null,
                exito: `Reporte de ${nombreAlumno} descargado correctamente`
            }));
        } catch (err) {
            const contextual = obtenerMensajeContextual('reportes', 'generar');
            const mensaje = err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`;
            setEstado(prev => ({
                ...prev,
                generando: false,
                tipoGenerando: null,
                error: mensaje
            }));
        }
    }, []);

    /**
     * Descarga el PDF de control de horas de una semana
     */
    const descargarControlHoras = useCallback(async (semana: string) => {
        setEstado(prev => ({
            ...prev,
            generando: true,
            tipoGenerando: 'control-horas',
            error: null,
            exito: null
        }));

        try {
            const nonce = (window as any).wpApiSettings?.nonce || '';
            const response = await fetch(`${API_BASE}/reportes/control-horas?semana=${semana}`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': nonce
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const contextual = obtenerMensajeContextual('reportes', 'generar');
                const mensajeBackend = errorData.error || errorData.message;
                if (mensajeBackend) {
                    const interpretado = interpretarErrorHttp(response.status, mensajeBackend);
                    throw new Error(formatearMensajeError(interpretado));
                }
                throw new Error(`${contextual.fallback} ${contextual.sugerencia}`);
            }

            /* Obtener el blob del PDF */
            const blob = await response.blob();

            /* Crear URL temporal y descargar */
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `control-horas-${semana}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setEstado(prev => ({
                ...prev,
                generando: false,
                tipoGenerando: null,
                exito: 'Reporte semanal descargado correctamente'
            }));
        } catch (err) {
            const contextual = obtenerMensajeContextual('reportes', 'generar');
            const mensaje = err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`;
            setEstado(prev => ({
                ...prev,
                generando: false,
                tipoGenerando: null,
                error: mensaje
            }));
        }
    }, []);

    return {
        ...estado,
        descargarPlanAlumno,
        descargarControlHoras,
        limpiarMensajes
    };
}

export default useReportes;
