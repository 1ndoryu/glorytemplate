/*
 * Hook: useHistorialLotes — [223A-3] Estado y gestión del historial de lotes automáticos.
 * Carga estado de automatización + historial paginado + reactivación.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    obtenerEstadoAutomatizacion,
    obtenerHistorialLotes,
    reactivarProceso,
} from '../services/apiAutomatizacion';
import type {
    EstadoAutomatizacion,
    LoteResumen,
    TipoProceso,
} from '../services/apiAutomatizacion';

export function useHistorialLotes() {
    const [estado, setEstado] = useState<EstadoAutomatizacion | null>(null);
    const [lotes, setLotes] = useState<LoteResumen[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [filtroTipo, setFiltroTipo] = useState<TipoProceso | ''>('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const cargarEstado = useCallback(async () => {
        try {
            const resp = await obtenerEstadoAutomatizacion();
            if (resp.ok && resp.data?.estado) {
                setEstado(resp.data.estado);
            }
        } catch {
            /* silencioso — estado inicial null */
        }
    }, []);

    const cargarHistorial = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const tipo = filtroTipo || undefined;
            const resp = await obtenerHistorialLotes(tipo, pagina);
            if (resp.ok && resp.data) {
                setLotes(resp.data.items);
                setTotal(resp.data.total);
            } else {
                setError(resp.error ?? 'Error cargando historial');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setCargando(false);
        }
    }, [filtroTipo, pagina]);

    const manejarReactivar = useCallback(async (tipo: TipoProceso) => {
        try {
            const resp = await reactivarProceso(tipo);
            if (resp.ok) {
                await cargarEstado();
            }
            return resp;
        } catch {
            return { ok: false, error: 'Error de conexión' };
        }
    }, [cargarEstado]);

    useEffect(() => {
        cargarEstado();
        cargarHistorial();
    }, [cargarEstado, cargarHistorial]);

    return {
        estado,
        lotes,
        total,
        pagina,
        setPagina,
        filtroTipo,
        setFiltroTipo,
        cargando,
        error,
        refrescar: cargarHistorial,
        refrescarEstado: cargarEstado,
        reactivar: manejarReactivar,
    };
}
