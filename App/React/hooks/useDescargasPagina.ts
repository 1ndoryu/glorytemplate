/*
 * Hook: useDescargasPagina — Kamples (C140)
 * Lógica de la página /descargas: carga lista completa (propios + descargados),
 * límites y provee sugerencias. Separado del componente para cumplir SRP.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { obtenerColeccionados } from '@app/services/apiExplorador';
import { obtenerLimites, obtenerComprados, type LimitesDescarga } from '@app/services/apiDescargas';
import { obtenerSugerenciasDescargas } from '@app/services/apiSugerencias';
import { obtenerMisFavoritos } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { SampleResumen, TipoReaccion } from '@app/types';
import type { ResultadoProveedor } from '@app/components/feed/FeedSamples';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
import type { TipoOrdenFeed } from '@app/components/feed/BarraControlFeed';

const log = crearLogger('useDescargasPagina');

export interface UseDescargasPaginaResultado {
    samples: SampleResumen[];
    comprados: SampleResumen[];
    limites: LimitesDescarga | null;
    cargando: boolean;
    cargandoComprados: boolean;
    proveedorColeccionados: (pagina: number) => Promise<ResultadoProveedor>;
    proveedorFavoritos: (pagina: number) => Promise<ResultadoProveedor>;
    ordenColeccionados: TipoOrdenFeed;
    setOrdenColeccionados: (orden: TipoOrdenFeed) => void;
    ordenFavoritos: TipoOrdenFeed;
    setOrdenFavoritos: (orden: TipoOrdenFeed) => void;
    proveedorSugerencias: (pagina: number) => Promise<ResultadoProveedor>;
    manejarLike: (sampleId: number, reaccion?: TipoReaccion) => Promise<void>;
}

export function useDescargasPagina(busqueda = '', soloEncantaColeccionados = false, soloEncantaFavoritos = false): UseDescargasPaginaResultado {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [comprados, setComprados] = useState<SampleResumen[]>([]);
    const [limites, setLimites] = useState<LimitesDescarga | null>(null);
    const [cargando, setCargando] = useState(true);
    const [cargandoComprados, setCargandoComprados] = useState(true);

    /* Carga inicial: limites + comprados (coleccionados ahora van por FeedSamples con scroll infinito) */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            setCargandoComprados(true);
            try {
                const [respLimites, respComprados] = await Promise.all([
                    obtenerLimites(),
                    obtenerComprados(),
                ]);
                if (respLimites.ok && respLimites.data) {
                    setLimites(respLimites.data);
                }
                if (respComprados.ok && respComprados.data) {
                    setComprados(respComprados.data);
                }
            } catch (err) {
                log.error('Error cargando descargas', err);
            }
            setCargando(false);
            setCargandoComprados(false);
        };
        cargar();
    }, []);

    /* QL53: Estado de ordenamiento por tab, gestionado en el hook para mantener isla limpia */
    const [ordenColeccionados, setOrdenColeccionados] = useState<TipoOrdenFeed>('recientes');
    const [ordenFavoritos, setOrdenFavoritos] = useState<TipoOrdenFeed>('recientes');

    /* QL53: Fábricas internas de proveedores que aceptan orden */
    const crearProveedorColeccionados = useCallback((orden: string, busq: string, soloEncanta: boolean) => {
        return async (pagina: number): Promise<ResultadoProveedor> => {
            try {
                const resp = await obtenerColeccionados(pagina, 30, '', orden, busq, soloEncanta);
                return {
                    ok: resp.ok,
                    data: resp.ok && resp.data?.data ? resp.data.data : [],
                    total: resp.ok && resp.data?.pagination ? resp.data.pagination.total : undefined,
                };
            } catch (err) {
                log.error('Error cargando coleccionados', err);
                return { ok: false, data: [] };
            }
        };
    }, []);

    /* QL53: Proveedor de favoritos con sorting */
    const crearProveedorFavoritos = useCallback((orden: string, busq: string, soloEncanta: boolean) => {
        return async (pagina: number): Promise<ResultadoProveedor> => {
            try {
                const resp = await obtenerMisFavoritos(pagina, 30, orden, busq, soloEncanta);
                return {
                    ok: resp.ok,
                    data: resp.ok && resp.data?.data ? resp.data.data : [],
                    total: resp.ok && resp.data?.pagination ? resp.data.pagination.total : undefined,
                };
            } catch (err) {
                log.error('Error cargando favoritos', err);
                return { ok: false, data: [] };
            }
        };
    }, []);

    /* QL53: Proveedores memoizados que se recrean cuando cambia el orden o busqueda */
    const proveedorColeccionados = useMemo(
        () => crearProveedorColeccionados(ordenColeccionados, busqueda, soloEncantaColeccionados),
        [crearProveedorColeccionados, ordenColeccionados, busqueda, soloEncantaColeccionados]
    );
    const proveedorFavoritos = useMemo(
        () => crearProveedorFavoritos(ordenFavoritos, busqueda, soloEncantaFavoritos),
        [crearProveedorFavoritos, ordenFavoritos, busqueda, soloEncantaFavoritos]
    );

    /* Proveedor paginado para tab "Más Ideas" */
    const proveedorSugerencias = useCallback(async (pagina: number): Promise<ResultadoProveedor> => {
        try {
            const resp = await obtenerSugerenciasDescargas(pagina);
            return { ok: resp.ok, data: resp.ok && resp.data ? resp.data : [] };
        } catch (err) {
            log.error('Error cargando sugerencias de descargas', err);
            return { ok: false, data: [] };
        }
    }, []);

    /* Like optimista sincronizado con la lista local */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const prevSamples = samples;
            /* [193A-32] Dislike oculta el sample del listado */
            if (!esPositivo) {
                setSamples(prev => prev.filter(s => s.id !== sampleId));
            } else {
                const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                setSamples((prev) =>
                    prev.map((s) =>
                        s.id === sampleId
                            ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                            : s
                    )
                );
            }
            try {
                const resp = await darLike('sample', sampleId, reaccion);
                /* FE02: Rollback si la API rechaza */
                if (!resp.ok) {
                    setSamples(prevSamples);
                    toast.error(getT()('error.reaccion'));
                }
            } catch (err) {
                setSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const prevSamples = samples;
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            try {
                const resp = await quitarLike('sample', sampleId);
                if (!resp.ok) {
                    setSamples(prevSamples);
                    toast.error(getT()('error.quitarReaccion'));
                }
            } catch (err) {
                setSamples(prevSamples);
                log.error('Error al quitar like', err);
            }
        } else {
            const prevSamples = samples;
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            try {
                const resp = await darLike('sample', sampleId, 'like');
                if (!resp.ok) {
                    setSamples(prevSamples);
                    toast.error(getT()('error.reaccion'));
                }
            } catch (err) {
                setSamples(prevSamples);
                log.error('Error al dar like', err);
            }
        }
    }, [samples]);

    return { samples, comprados, limites, cargando, cargandoComprados, proveedorColeccionados, proveedorFavoritos, ordenColeccionados, setOrdenColeccionados, ordenFavoritos, setOrdenFavoritos, proveedorSugerencias, manejarLike };
}
