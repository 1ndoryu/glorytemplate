/*
 * Hook: usePanelDuplicados — D5
 * Logica para el tab de moderacion de duplicados en el panel admin.
 * Maneja: carga, filtros, paginacion y acciones de resolucion.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    listarDuplicados,
    contarDuplicados,
    fusionarDuplicado,
    aprobarDuplicado,
    rechazarDuplicado,
    intercambiarDuplicado,
    ejecutarBackfillHash,
    type DuplicadoAdmin,
    type GrupoDuplicados,
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
    grupos: GrupoDuplicados[];
    total: number;
    cargando: boolean;
    procesandoId: number | null;
    hayMas: boolean;

    /* Filtros */
    filtroEstado: string;
    filtroTipo: string;
    setFiltroEstado: (v: string) => void;
    setFiltroTipo: (v: string) => void;

    /* Acciones */
    ejecutarAccion: (id: number, accion: AccionDuplicado) => Promise<void>;
    recargar: () => Promise<void>;
    cargarMas: () => Promise<void>;
    ejecutarBackfill: () => Promise<void>;
    backfillStats: StatsBackfill | null;
    backfillEnCurso: boolean;
}

/*
 * QL70: Agrupa duplicados planos por original_id.
 * Cada grupo contiene la info del original + array de instancias duplicadas.
 * Preserva el orden de aparición del primer registro de cada grupo.
 */
function agruparPorOriginal(duplicados: DuplicadoAdmin[]): GrupoDuplicados[] {
    const mapa = new Map<number, GrupoDuplicados>();
    const orden: number[] = [];

    for (const d of duplicados) {
        const existente = mapa.get(d.original_id);
        if (existente) {
            existente.instancias.push(d);
        } else {
            orden.push(d.original_id);
            mapa.set(d.original_id, {
                originalId: d.original_id,
                originalTitulo: d.original_titulo,
                originalCreador: d.original_creador,
                originalCreadorId: d.original_creador_id,
                originalSubidoAt: d.original_subido_at,
                originalRutaPreview: d.original_ruta_preview,
                originalRutaWaveform: d.original_ruta_waveform,
                originalSlug: d.original_slug,
                originalHash: d.original_hash,
                instancias: [d],
            });
        }
    }

    return orden.map(id => mapa.get(id)!);
}

export function usePanelDuplicados(): UsePanelDuplicadosReturn {
    const [duplicados, setDuplicados] = useState<DuplicadoAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [procesandoId, setProcesandoId] = useState<number | null>(null);
    const [filtroEstado, setFiltroEstado] = useState('pendiente');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [hayMas, setHayMas] = useState(false);
    const [backfillStats, setBackfillStats] = useState<StatsBackfill | null>(null);
    const [backfillEnCurso, setBackfillEnCurso] = useState(false);
    /* Pagina interna — controlada por scroll, no expuesta */
    const paginaRef = useRef(1);
    const cargandoMasRef = useRef(false);

    const cargarDatos = useCallback(async (reiniciar = true) => {
        if (reiniciar) {
            paginaRef.current = 1;
        }
        setCargando(true);
        try {
            const [resList, resTotal] = await Promise.all([
                listarDuplicados(filtroEstado, filtroTipo || undefined, paginaRef.current),
                contarDuplicados(),
            ]);

            if (resList.ok && resList.data) {
                const nuevos = resList.data.duplicados ?? [];
                setDuplicados(reiniciar ? nuevos : prev => [...prev, ...nuevos]);
                setHayMas(nuevos.length >= 20);
            } else {
                log.error('Error cargando duplicados', resList.error);
                if (reiniciar) setDuplicados([]);
                setHayMas(false);
            }

            if (resTotal.ok && resTotal.data) {
                setTotal(resTotal.data.total ?? 0);
            }
        } catch (err) {
            log.error('Error inesperado cargando duplicados', err);
            if (reiniciar) setDuplicados([]);
            setHayMas(false);
        }
        setCargando(false);
    }, [filtroEstado, filtroTipo]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    /* Reset a primera pagina al cambiar filtros */
    const cambiarFiltroEstado = useCallback((v: string) => {
        setFiltroEstado(v);
    }, []);

    const cambiarFiltroTipo = useCallback((v: string) => {
        setFiltroTipo(v);
    }, []);

    const cargarMas = useCallback(async () => {
        if (cargandoMasRef.current || !hayMas) return;
        cargandoMasRef.current = true;
        paginaRef.current += 1;
        await cargarDatos(false);
        cargandoMasRef.current = false;
    }, [hayMas, cargarDatos]);

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

    /* QL70: Agrupación por original_id, reactiva a cambios en la lista plana */
    const grupos = useMemo(() => agruparPorOriginal(duplicados), [duplicados]);

    return {
        duplicados,
        grupos,
        total,
        cargando,
        procesandoId,
        hayMas,
        filtroEstado,
        filtroTipo,
        setFiltroEstado: cambiarFiltroEstado,
        setFiltroTipo: cambiarFiltroTipo,
        ejecutarAccion,
        recargar: cargarDatos,
        cargarMas,
        ejecutarBackfill,
        backfillStats,
        backfillEnCurso,
    };
}
