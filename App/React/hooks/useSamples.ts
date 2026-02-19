/*
 * Hook: useSamples — Kamples
 * Interfaz simplificada para operaciones comunes con samples.
 * Combina búsqueda, feed y detalle con estado de carga.
 */

import { useState, useCallback, useRef } from 'react';
import {
    listarSamples,
    obtenerSample,
    obtenerFeed,
    type FiltrosSamples,
} from '@app/services/apiSamples';
import { crearLogger } from '@app/services/logger';
import type { SampleResumen, Sample } from '@app/types';

const log = crearLogger('useSamples');

interface EstadoSamples {
    samples: SampleResumen[];
    cargando: boolean;
    error: string | null;
    pagina: number;
    totalPaginas: number;
    hayMas: boolean;
}

export const useSamples = () => {
    const [estado, setEstado] = useState<EstadoSamples>({
        samples: [],
        cargando: false,
        error: null,
        pagina: 1,
        totalPaginas: 1,
        hayMas: false,
    });

    const [sampleDetalle, setSampleDetalle] = useState<Sample | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    /* Referencia para evitar llamadas duplicadas */
    const cargandoRef = useRef(false);

    /*
     * Buscar samples con filtros.
     * Si reiniciar=true, reemplaza los resultados actuales.
     */
    const buscar = useCallback(async (filtros: FiltrosSamples = {}, reiniciar = true) => {
        if (cargandoRef.current) return;
        cargandoRef.current = true;
        setEstado(prev => ({ ...prev, cargando: true, error: null }));

        try {
            const resp = await listarSamples(filtros);

            if (resp.ok && resp.data) {
                const { data, pagination } = resp.data;
                setEstado(prev => ({
                    samples: reiniciar ? data : [...prev.samples, ...data],
                    cargando: false,
                    error: null,
                    pagina: pagination.page,
                    totalPaginas: pagination.pages,
                    hayMas: pagination.page < pagination.pages,
                }));
            } else {
                setEstado(prev => ({
                    ...prev,
                    cargando: false,
                    error: resp.error ?? 'Error al cargar samples',
                }));
            }
        } catch (err) {
            log.error('Error buscando samples', err);
            setEstado(prev => ({
                ...prev,
                cargando: false,
                error: 'Error de conexión',
            }));
        } finally {
            cargandoRef.current = false;
        }
    }, []);

    /*
     * Cargar feed por tipo (descubrir, trending, recientes).
     */
    const cargarFeed = useCallback(async (
        tipo: 'descubrir' | 'trending' | 'recientes' = 'descubrir',
        pagina = 1,
        reiniciar = true
    ) => {
        if (cargandoRef.current) return;
        cargandoRef.current = true;
        setEstado(prev => ({ ...prev, cargando: true, error: null }));

        try {
            const resp = await obtenerFeed(tipo, pagina);

            if (resp.ok && resp.data) {
                setEstado(prev => ({
                    samples: reiniciar ? resp.data! : [...prev.samples, ...resp.data!],
                    cargando: false,
                    error: null,
                    pagina,
                    totalPaginas: pagina + 1, /* Feed infinito, siempre hay más páginas en teoría */
                    hayMas: resp.data!.length >= 20,
                }));
            } else {
                setEstado(prev => ({
                    ...prev,
                    cargando: false,
                    error: resp.error ?? 'Error al cargar feed',
                }));
            }
        } catch (err) {
            log.error('Error cargando feed', err);
            setEstado(prev => ({
                ...prev,
                cargando: false,
                error: 'Error al cargar feed',
            }));
        } finally {
            cargandoRef.current = false;
        }
    }, []);

    /*
     * Cargar detalle de un sample por slug.
     */
    const cargarDetalle = useCallback(async (slug: string) => {
        setCargandoDetalle(true);
        try {
            const resp = await obtenerSample(slug);
            if (resp.ok && resp.data) {
                setSampleDetalle(resp.data);
            }
        } catch (err) {
            log.error('Error cargando detalle', err);
        } finally {
            setCargandoDetalle(false);
        }
    }, []);

    return {
        ...estado,
        sampleDetalle,
        cargandoDetalle,
        buscar,
        cargarFeed,
        cargarDetalle,
    };
};
