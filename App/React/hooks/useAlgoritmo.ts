/*
 * Hook: useAlgoritmo — Kamples (Fase 3)
 * Abstrae la carga del feed algorítmico multi-señal.
 * Combina tipo de feed + paginación infinita + refresh.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { obtenerFeed } from '@app/services/apiSamples';
import { crearLogger } from '@app/services/logger';
import type { SampleResumen } from '@app/types';

const log = crearLogger('useAlgoritmo');

type TipoFeed = 'descubrir' | 'trending' | 'recientes';

interface ConfigAlgoritmo {
    tipoInicial?: TipoFeed;
    autoCargar?: boolean;
    porPagina?: number;
}

interface EstadoAlgoritmo {
    items: SampleResumen[];
    tipo: TipoFeed;
    cargando: boolean;
    cargandoMas: boolean;
    pagina: number;
    hayMas: boolean;
    ultimaActualizacion: number;
}

export const useAlgoritmo = (config: ConfigAlgoritmo = {}) => {
    const {
        tipoInicial = 'descubrir',
        autoCargar = true,
        porPagina = 12,
    } = config;

    const [estado, setEstado] = useState<EstadoAlgoritmo>({
        items: [],
        tipo: tipoInicial,
        cargando: false,
        cargandoMas: false,
        pagina: 1,
        hayMas: true,
        ultimaActualizacion: 0,
    });

    const cargandoRef = useRef(false);

    /*
     * Carga principal del feed (reemplaza items).
     */
    const cargar = useCallback(async (tipo?: TipoFeed) => {
        if (cargandoRef.current) return;
        cargandoRef.current = true;

        const tipoActual = tipo ?? estado.tipo;
        setEstado(prev => ({
            ...prev,
            cargando: true,
            tipo: tipoActual,
        }));

        try {
            const resp = await obtenerFeed(tipoActual, 1);

            if (resp.ok && resp.data) {
                setEstado(prev => ({
                    ...prev,
                    items: resp.data!,
                    cargando: false,
                    pagina: 1,
                    hayMas: resp.data!.length >= porPagina,
                    ultimaActualizacion: Date.now(),
                }));
            }
        } catch (err) {
            log.error('Error cargando feed algorítmico', err);
            setEstado(prev => ({ ...prev, cargando: false }));
        } finally {
            cargandoRef.current = false;
        }
    }, [estado.tipo, porPagina]);

    /*
     * Paginación infinita: carga la siguiente página.
     */
    const cargarMas = useCallback(async () => {
        if (cargandoRef.current || !estado.hayMas) return;
        cargandoRef.current = true;

        const siguientePagina = estado.pagina + 1;
        setEstado(prev => ({ ...prev, cargandoMas: true }));

        try {
            const resp = await obtenerFeed(estado.tipo, siguientePagina);

            if (resp.ok && resp.data) {
                setEstado(prev => ({
                    ...prev,
                    items: [...prev.items, ...resp.data!],
                    cargandoMas: false,
                    pagina: siguientePagina,
                    hayMas: resp.data!.length >= porPagina,
                }));
            }
        } catch (err) {
            log.error('Error cargando más items', err);
            setEstado(prev => ({ ...prev, cargandoMas: false }));
        } finally {
            cargandoRef.current = false;
        }
    }, [estado.pagina, estado.tipo, estado.hayMas, porPagina]);

    /*
     * Cambiar tipo de feed y recargar.
     */
    const cambiarTipo = useCallback((tipo: TipoFeed) => {
        if (tipo === estado.tipo) return;
        cargar(tipo);
    }, [estado.tipo, cargar]);

    /*
     * Refresh manual del feed actual.
     */
    const refrescar = useCallback(() => {
        cargar(estado.tipo);
    }, [estado.tipo, cargar]);

    /* Auto-cargar al montar si está habilitado */
    useEffect(() => {
        if (autoCargar && estado.items.length === 0) {
            cargar();
        }
    }, [autoCargar]);

    return {
        items: estado.items,
        tipo: estado.tipo,
        cargando: estado.cargando,
        cargandoMas: estado.cargandoMas,
        hayMas: estado.hayMas,
        ultimaActualizacion: estado.ultimaActualizacion,
        cargar,
        cargarMas,
        cambiarTipo,
        refrescar,
    };
};
