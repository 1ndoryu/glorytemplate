/*
 * Hook: useTabColaExtraccionAdmin — QK40
 * Lógica de la tabla de cola de extracción del panel admin.
 * Carga paginada con búsqueda y filtro por estado.
 */

import { useState, useEffect, useCallback } from 'react';
import { listarColaExtraccionAdmin, type ColaExtraccionItemAdmin } from '../services/apiAdmin';
import { crearLogger } from '../services/logger';

const log = crearLogger('useTabColaExtraccionAdmin');

export function useTabColaExtraccionAdmin() {
    const [items, setItems] = useState<ColaExtraccionItemAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [cargando, setCargando] = useState(false);
    const [columnasOcultas, setColumnasOcultas] = useState<Set<string>>(new Set());
    const [sortCol, setSortCol] = useState('');
    const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await listarColaExtraccionAdmin(pagina, busqueda, filtroEstado, sortCol, sortDir);
            if (res.ok && res.data) {
                setItems(res.data);
                setTotal(res.total ?? 0);
            }
        } catch (err) {
            log.error('Error cargando cola extraccion', err);
        }
        setCargando(false);
    }, [pagina, busqueda, filtroEstado, sortCol, sortDir]);

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
        items, total, pagina, busqueda, filtroEstado,
        cargando, columnasOcultas, sortCol, sortDir,
        setPagina, cambiarBusqueda, cambiarFiltroEstado,
        toggleColumna, refrescar: cargar, cambiarOrden,
    };
}
