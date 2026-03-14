/*
 * Hook: useTabScrapersAdmin — QK40
 * Lógica de la tabla de scrapers del panel admin.
 * Carga paginada de scraping_log con búsqueda y filtro por estado.
 */

import { useState, useEffect, useCallback } from 'react';
import { listarScrapersAdmin, type ScraperItemAdmin } from '../services/apiAdmin';
import { crearLogger } from '../services/logger';

const log = crearLogger('useTabScrapersAdmin');

export function useTabScrapersAdmin() {
    const [items, setItems] = useState<ScraperItemAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [estadosCuenta, setEstadosCuenta] = useState<Record<string, number>>({});
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
            const res = await listarScrapersAdmin(pagina, busqueda, filtroEstado, sortCol, sortDir);
            if (res.ok && res.data) {
                setItems(res.data);
                setTotal(res.total ?? 0);
                if (res.estadosCuenta) setEstadosCuenta(res.estadosCuenta);
            }
        } catch (err) {
            log.error('Error cargando scrapers', err);
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
        estadosCuenta,
        setPagina, cambiarBusqueda, cambiarFiltroEstado,
        toggleColumna, refrescar: cargar, cambiarOrden,
    };
}
