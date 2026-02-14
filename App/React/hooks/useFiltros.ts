/*
 * Hook: useFiltros
 * Interfaz para los filtros de búsqueda de samples.
 * Conecta filtrosStore con la API.
 */

import { useCallback } from 'react';
import { useFiltrosStore } from '../stores/filtrosStore';
import type { SampleResumen } from '../types/sample';
import { listarSamples } from '../services/apiSamples';
import type { FiltrosSamples } from '../services/apiSamples';
import { crearLogger } from '../services/logger';
import { useState } from 'react';

const log = crearLogger('useFiltros');

export const useFiltros = () => {
    const filtros = useFiltrosStore();
    const [resultados, setResultados] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(false);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const buscar = useCallback(async () => {
        setCargando(true);
        try {
            const params: FiltrosSamples = {
                busqueda: filtros.busqueda || undefined,
                genero: filtros.genero || undefined,
                bpmMin: filtros.bpmMin,
                bpmMax: filtros.bpmMax,
                key: filtros.key || undefined,
                tipo: filtros.tipo || undefined,
                page: filtros.pagina,
            };
            const resp = await listarSamples(params);

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
    }, [filtros.busqueda, filtros.genero, filtros.bpmMin, filtros.bpmMax, filtros.key, filtros.tipo, filtros.ordenar, filtros.pagina]);

    return {
        ...filtros,
        resultados,
        cargando,
        totalPaginas,
        buscar,
    };
};
