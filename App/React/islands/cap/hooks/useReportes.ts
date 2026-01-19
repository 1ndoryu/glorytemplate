/**
 * useReportes
 *
 * Hook personalizado para la generación y descarga de reportes PDF.
 * Gestiona el estado de generación y las descargas.
 */

import {useState, useCallback} from 'react';
import type {Alumno} from '../types';

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
            const response = await fetch(`/wp-json/cap/v1/reportes/plan-alumno/${alumnoId}`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': nonce
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al generar el reporte');
            }

            /* Obtener el blob del PDF */
            const blob = await response.blob();

            /* Crear URL temporal y descargar */
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `plan-formacion-${nombreAlumno.replace(/\s+/g, '-').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setEstado(prev => ({
                ...prev,
                generando: false,
                tipoGenerando: null,
                exito: `Reporte de ${nombreAlumno} descargado correctamente`
            }));
        } catch (err) {
            const mensaje = err instanceof Error ? err.message : 'Error desconocido';
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
            const response = await fetch(`/wp-json/cap/v1/reportes/control-horas?semana=${semana}`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': nonce
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al generar el reporte');
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
            const mensaje = err instanceof Error ? err.message : 'Error desconocido';
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
