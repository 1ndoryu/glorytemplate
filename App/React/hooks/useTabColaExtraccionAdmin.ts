/*
 * Hook: useTabColaExtraccionAdmin — QK40+QK52
 * Logica de la tabla de cola de extraccion del panel admin.
 * Carga paginada con busqueda, filtro por estado/lado, ordenamiento.
 */

import { useState, useEffect, useCallback } from 'react';
import { listarColaExtraccionAdmin, type ColaExtraccionItemAdmin } from '../services/apiAdmin';
import { crearLogger } from '../services/logger';

const log = crearLogger('useTabColaExtraccionAdmin');

export function useTabColaExtraccionAdmin() {
    const [items, setItems] = useState<ColaExtraccionItemAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [estadosCuenta, setEstadosCuenta] = useState<Record<string, number>>({});
    const [pagina, setPagina] = useState(1);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroLado] = useState('');
    const [filtrosColumna, setFiltrosColumna] = useState<Record<string, Set<string>>>({});
    const [cargando, setCargando] = useState(false);
    const [columnasOcultas, setColumnasOcultas] = useState<Set<string>>(new Set());
    const [sortCol, setSortCol] = useState('');
    const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

    /* Componer estado final: prioriza filtrosColumna.estado sobre filtroEstado si hay */
    const estadoFinal = filtrosColumna.estado?.size
        ? Array.from(filtrosColumna.estado).join(',')
        : filtroEstado;

    const ladoFinal = filtrosColumna.lado?.size
        ? Array.from(filtrosColumna.lado).join(',')
        : filtroLado;

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await listarColaExtraccionAdmin(pagina, busqueda, estadoFinal, sortCol, sortDir, ladoFinal);
            if (res.ok && res.data) {
                setItems(res.data);
                setTotal(res.total ?? 0);
                if (res.estadosCuenta) setEstadosCuenta(res.estadosCuenta);
            }
        } catch (err) {
            log.error('Error cargando cola extraccion', err);
        }
        setCargando(false);
    }, [pagina, busqueda, estadoFinal, ladoFinal, sortCol, sortDir]);

    useEffect(() => { cargar(); }, [cargar]);

    const toggleColumna = useCallback((col: string) => {
        setColumnasOcultas(prev => {
            const next = new Set(prev);
            if (next.has(col)) next.delete(col);
            else next.add(col);
            return next;
        });
    }, []);

    const cambiarBusqueda = useCallback((valor: string) => {
        setBusqueda(valor);
        setPagina(1);
    }, []);

    const cambiarFiltroEstado = useCallback((valor: string) => {
        setFiltroEstado(valor);
        setFiltrosColumna(prev => ({ ...prev, estado: new Set() }));
        setPagina(1);
    }, []);

    const cambiarFiltroColumna = useCallback((columna: string, activos: Set<string>) => {
        setFiltrosColumna(prev => ({ ...prev, [columna]: activos }));
        setPagina(1);
    }, []);

    const cambiarOrden = useCallback((col: string) => {
        if (col === sortCol) {
            setSortDir(prev => prev === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortCol(col);
            setSortDir('ASC');
        }
        setPagina(1);
    }, [sortCol]);

    return {
        items, total, pagina, busqueda, filtroEstado, filtroLado,
        filtrosColumna, cargando, columnasOcultas, sortCol, sortDir,
        estadosCuenta,
        setPagina, cambiarBusqueda, cambiarFiltroEstado,
        cambiarFiltroColumna, toggleColumna, refrescar: cargar, cambiarOrden,
    };
}
