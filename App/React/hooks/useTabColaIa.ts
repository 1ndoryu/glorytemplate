/*
 * Hook: useTabColaIa — C356
 * Logica para el tab de cola de procesamiento IA en el panel admin.
 * Maneja: carga de items, estadisticas, reintentos, procesamiento manual.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ItemColaIa, EstadisticasColaIa, ResultadoProcesamiento, CuotaGroq, EstadoKeysGroq } from '../services/apiColaIa';
import {
    listarColaIa,
    obtenerEstadisticasColaIa,
    reintentarItemColaIa,
    reintentarTodosColaIa,
    procesarColaIaAhora,
    obtenerCuotaGroq,
    obtenerEstadoKeys,
} from '../services/apiColaIa';

interface UseTabColaIaReturn {
    /* Datos */
    items: ItemColaIa[];
    estadisticas: EstadisticasColaIa | null;
    cuotaGroq: CuotaGroq | null;
    estadoKeys: EstadoKeysGroq | null;
    cargando: boolean;
    procesando: boolean;

    /* Filtros */
    filtroEstado: string;
    filtroTipo: string;
    busqueda: string;
    pagina: number;
    totalPaginas: number;
    total: number;
    setFiltroEstado: (v: string) => void;
    setFiltroTipo: (v: string) => void;
    setBusqueda: (v: string) => void;
    setPagina: (p: number) => void;

    /* Ordenamiento */
    sortCol: string;
    sortDir: 'ASC' | 'DESC';
    ordenarPor: (col: string) => void;

    /* Acciones */
    reintentarItem: (id: number) => Promise<void>;
    reintentarTodos: () => Promise<void>;
    procesarAhora: () => Promise<void>;
    recargar: () => Promise<void>;

    /* Resultado ultimo procesamiento */
    ultimoResultado: ResultadoProcesamiento | null;
}

export function useTabColaIa(): UseTabColaIaReturn {
    const [items, setItems] = useState<ItemColaIa[]>([]);
    const [estadisticas, setEstadisticas] = useState<EstadisticasColaIa | null>(null);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [total, setTotal] = useState(0);
    const [sortCol, setSortCol] = useState('');
    const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
    const [ultimoResultado, setUltimoResultado] = useState<ResultadoProcesamiento | null>(null);
    const [cuotaGroq, setCuotaGroq] = useState<CuotaGroq | null>(null);
    const [estadoKeys, setEstadoKeys] = useState<EstadoKeysGroq | null>(null);

    const ordenarPor = useCallback((col: string) => {
        setSortCol(prev => {
            if (prev === col) {
                setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
                return col;
            }
            setSortDir('DESC');
            return col;
        });
        setPagina(1);
    }, []);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [respItems, respStats, respCuota, respKeys] = await Promise.all([
                listarColaIa(
                    pagina, 25,
                    filtroEstado || undefined,
                    filtroTipo || undefined,
                    busqueda || undefined,
                    sortCol || undefined,
                    sortDir
                ),
                obtenerEstadisticasColaIa(),
                obtenerCuotaGroq(),
                obtenerEstadoKeys(),
            ]);

            if (respItems.ok && respItems.data) {
                /* respItems.data puede ser array directo o {data, pagination} */
                const payload = respItems.data as unknown as { data?: ItemColaIa[]; pagination?: { total: number; pages: number } };
                if (Array.isArray(payload)) {
                    setItems(payload);
                } else if (payload.data) {
                    setItems(payload.data);
                    setTotalPaginas(payload.pagination?.pages ?? 1);
                    setTotal(payload.pagination?.total ?? 0);
                }
            }
            if (respStats.ok && respStats.data) {
                setEstadisticas(respStats.data);
            }
            if (respCuota.ok && respCuota.data?.ok && respCuota.data.cuota) {
                setCuotaGroq(respCuota.data.cuota);
            }
            if (respKeys.ok && respKeys.data?.ok) {
                setEstadoKeys(respKeys.data);
            }
        } finally {
            setCargando(false);
        }
    }, [pagina, filtroEstado, filtroTipo, busqueda, sortCol, sortDir]);

    /* Carga inicial + polling cada 15s para mantener datos actualizados */
    useEffect(() => {
        cargarDatos();

        const intervalo = setInterval(() => {
            cargarDatos();
        }, 15000);

        return () => clearInterval(intervalo);
    }, [cargarDatos]);

    const reintentarItem = useCallback(async (id: number) => {
        const resp = await reintentarItemColaIa(id);
        if (resp.ok) {
            await cargarDatos();
        }
    }, [cargarDatos]);

    const reintentarTodos = useCallback(async () => {
        setProcesando(true);
        try {
            const resp = await reintentarTodosColaIa();
            if (resp.ok) {
                await cargarDatos();
            }
        } finally {
            setProcesando(false);
        }
    }, [cargarDatos]);

    const procesarAhora = useCallback(async () => {
        setProcesando(true);
        setUltimoResultado(null);
        try {
            const resp = await procesarColaIaAhora();
            if (resp.ok && resp.data) {
                setUltimoResultado(resp.data.resultado);
            }
            await cargarDatos();
        } finally {
            setProcesando(false);
        }
    }, [cargarDatos]);

    return {
        items,
        estadisticas,
        cuotaGroq,
        estadoKeys,
        cargando,
        procesando,
        filtroEstado,
        filtroTipo,
        busqueda,
        pagina,
        totalPaginas,
        total,
        sortCol,
        sortDir,
        setFiltroEstado,
        setFiltroTipo,
        setBusqueda,
        setPagina,
        ordenarPor,
        reintentarItem,
        reintentarTodos,
        procesarAhora,
        recargar: cargarDatos,
        ultimoResultado,
    };
}
