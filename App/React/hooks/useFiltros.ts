/*
 * Hook: useFiltros
 * Puente entre filtrosStore (toggles globales) y la API de samples.
 * Los filtros toggle (yaReproducidos, likeados, deSeguidos, descargados)
 * se envían como parámetros de la API cuando esté lista; por ahora
 * se usa solo busqueda + pagina + ordenamiento.
 */

import { useCallback, useState } from 'react';
import { useFiltrosStore } from '../stores/filtrosStore';
import type { SampleResumen } from '../types/sample';
import { listarSamples } from '../services/apiSamples';
import { crearLogger } from '../services/logger';

const log = crearLogger('useFiltros');

export const useFiltros = () => {
    const filtros = useFiltrosStore();
    const [resultados, setResultados] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(false);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const buscar = useCallback(async () => {
        setCargando(true);
        try {
            const resp = await listarSamples({
                busqueda: filtros.busqueda || undefined,
                page: filtros.pagina,
                /* TO-DO: enviar filtros toggle al backend cuando los endpoints los soporten */
            });

            if (resp.ok && resp.data) {
                const datos = resp.data;
                setResultados(datos.data ?? []);
                setTotalPaginas(datos.pagination?.pages ?? 1);
            }
        } catch (err) {
            log.error('Error buscando samples', err);
        } finally {
            setCargando(false);
        }
    }, [filtros.busqueda, filtros.pagina, filtros.ordenamiento]);

    return {
        ...filtros,
        resultados,
        cargando,
        totalPaginas,
        buscar,
    };
};
