/*
 * Hook: usePanelDuplicados — D5
 * Logica para el tab de moderacion de duplicados en el panel admin.
 * Maneja: carga, filtros, paginacion y acciones de resolucion.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    listarDuplicados,
    contarDuplicados,
    fusionarDuplicado,
    aprobarDuplicado,
    rechazarDuplicado,
    intercambiarDuplicado,
    ejecutarBackfillHash,
    type DuplicadoAdmin,
    type StatsBackfill,
} from '../services/apiAdmin';
import { crearLogger } from '../services/logger';

const log = crearLogger('usePanelDuplicados');

/* Acciones disponibles para un duplicado */
type AccionDuplicado = 'fusionar' | 'aprobar' | 'rechazar' | 'intercambiar';

const ACCIONES: Record<AccionDuplicado, (id: number) => ReturnType<typeof fusionarDuplicado>> = {
    fusionar: fusionarDuplicado,
    aprobar: aprobarDuplicado,
    rechazar: rechazarDuplicado,
    intercambiar: intercambiarDuplicado,
};

export interface UsePanelDuplicadosReturn {
    /* Datos */
    duplicados: DuplicadoAdmin[];
    total: number;
    cargando: boolean;
    procesandoId: number | null;

    /* Filtros */
    filtroEstado: string;
    filtroTipo: string;
    pagina: number;
    setFiltroEstado: (v: string) => void;
    setFiltroTipo: (v: string) => void;
    setPagina: (p: number) => void;

    /* Acciones */
    ejecutarAccion: (id: number, accion: AccionDuplicado) => Promise<void>;
    recargar: () => Promise<void>;
    ejecutarBackfill: () => Promise<void>;
    backfillStats: StatsBackfill | null;
    backfillEnCurso: boolean;
}

export function usePanelDuplicados(): UsePanelDuplicadosReturn {
    const [duplicados, setDuplicados] = useState<DuplicadoAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [procesandoId, setProcesandoId] = useState<number | null>(null);
    const [filtroEstado, setFiltroEstado] = useState('pendiente');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [pagina, setPagina] = useState(1);
    const [backfillStats, setBackfillStats] = useState<StatsBackfill | null>(null);
    const [backfillEnCurso, setBackfillEnCurso] = useState(false);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [resList, resTotal] = await Promise.all([
                listarDuplicados(filtroEstado, filtroTipo || undefined, pagina),
                contarDuplicados(),
            ]);

            if (resList.ok && resList.data) {
                setDuplicados(resList.data.duplicados ?? []);
            } else {
                log.error('Error cargando duplicados', resList.error);
                setDuplicados([]);
            }

            if (resTotal.ok && resTotal.data) {
                setTotal(resTotal.data.total ?? 0);
            }
        } catch (err) {
            log.error('Error inesperado cargando duplicados', err);
            setDuplicados([]);
        }
        setCargando(false);
    }, [filtroEstado, filtroTipo, pagina]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    /* Reset pagina al cambiar filtros */
    const cambiarFiltroEstado = useCallback((v: string) => {
        setFiltroEstado(v);
        setPagina(1);
    }, []);

    const cambiarFiltroTipo = useCallback((v: string) => {
        setFiltroTipo(v);
        setPagina(1);
    }, []);

    const ejecutarAccion = useCallback(async (id: number, accion: AccionDuplicado) => {
        const handler = ACCIONES[accion];
        if (!handler) return;

        setProcesandoId(id);
        try {
            const res = await handler(id);
            if (res.ok) {
                /* Eliminar de la lista local para feedback inmediato */
                setDuplicados(prev => prev.filter(d => d.id !== id));
                setTotal(prev => Math.max(0, prev - 1));
            } else {
                log.error(`Error en accion ${accion}`, res.error);
            }
        } catch (err) {
            log.error(`Error inesperado en accion ${accion}`, err);
        }
        setProcesandoId(null);
    }, []);

    const ejecutarBackfill = useCallback(async () => {
        setBackfillEnCurso(true);
        setBackfillStats(null);
        try {
            const res = await ejecutarBackfillHash(100);
            if (res.ok && res.data) {
                setBackfillStats(res.data.stats);
                /* Recargar lista por si se encontraron nuevos duplicados */
                await cargarDatos();
            } else {
                log.error('Error en backfill', res.error);
            }
        } catch (err) {
            log.error('Error inesperado en backfill', err);
        }
        setBackfillEnCurso(false);
    }, [cargarDatos]);

    return {
        duplicados,
        total,
        cargando,
        procesandoId,
        filtroEstado,
        filtroTipo,
        pagina,
        setFiltroEstado: cambiarFiltroEstado,
        setFiltroTipo: cambiarFiltroTipo,
        setPagina,
        ejecutarAccion,
        recargar: cargarDatos,
        ejecutarBackfill,
        backfillStats,
        backfillEnCurso,
    };
}
