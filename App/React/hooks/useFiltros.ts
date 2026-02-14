/*
 * Hook: useFiltros
 * Interfaz para los filtros de búsqueda de samples.
 * Conecta filtrosStore con la API.
 */

import { useCallback } from 'react';
import { useFiltrosStore } from '../stores/filtrosStore';
import type { SampleResumen } from '../types/sample';
import { listarSamples } from '../services/apiSamples';
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
            const resp = await listarSamples({
                busqueda: filtros.busqueda || undefined,
                genero: filtros.genero || undefined,
                bpmMin: filtros.bpmMin || undefined,
                bpmMax: filtros.bpmMax || undefined,
                key: filtros.key || undefined,
                tipo: filtros.tipo || undefined,
                ordenar: filtros.ordenar,
                pagina: filtros.pagina,
            });

            if (resp.ok && resp.datos) {
                const datos = resp.datos as { items: SampleResumen[]; totalPaginas: number };
                setResultados(datos.items ?? []);
                setTotalPaginas(datos.totalPaginas ?? 1);
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
