/*
 * Hook: useTabColaIa — C356
 * Logica para el tab de cola de procesamiento IA en el panel admin.
 * Maneja: carga de items, estadisticas, reintentos, procesamiento manual.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ItemColaIa, EstadisticasColaIa, ResultadoProcesamiento } from '../services/apiColaIa';
import {
    listarColaIa,
    obtenerEstadisticasColaIa,
    reintentarItemColaIa,
    reintentarTodosColaIa,
    procesarColaIaAhora,
} from '../services/apiColaIa';

interface UseTabColaIaReturn {
    /* Datos */
    items: ItemColaIa[];
    estadisticas: EstadisticasColaIa | null;
    cargando: boolean;
    procesando: boolean;

    /* Filtros */
    filtroEstado: string;
    filtroTipo: string;
    pagina: number;
    setFiltroEstado: (v: string) => void;
    setFiltroTipo: (v: string) => void;
    setPagina: (p: number) => void;

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
    const [pagina, setPagina] = useState(1);
    const [ultimoResultado, setUltimoResultado] = useState<ResultadoProcesamiento | null>(null);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [respItems, respStats] = await Promise.all([
                listarColaIa(pagina, 20, filtroEstado || undefined, filtroTipo || undefined),
                obtenerEstadisticasColaIa(),
            ]);

            if (respItems.ok && respItems.data) {
                setItems(respItems.data);
            }
            if (respStats.ok && respStats.data) {
                setEstadisticas(respStats.data);
            }
        } finally {
            setCargando(false);
        }
    }, [pagina, filtroEstado, filtroTipo]);

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
        cargando,
        procesando,
        filtroEstado,
        filtroTipo,
        pagina,
        setFiltroEstado,
        setFiltroTipo,
        setPagina,
        reintentarItem,
        reintentarTodos,
        procesarAhora,
        recargar: cargarDatos,
        ultimoResultado,
    };
}
