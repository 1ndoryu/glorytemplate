/* sentinel-disable-file limite-lineas — hook cohesivo: fetch de alumnos con cleanup, exclusiones por slot, accordeon, resolucion aleatoria/proximidad estan acoplados */
/**
 * useConflictoAforo
 *
 * Hook para lógica del modal de resolución de conflictos de aforo.
 * Maneja la carga de info de alumnos, estado de exclusiones por slot,
 * normalización de IDs, y resolución automática (aleatoria o por proximidad).
 */

import {useState, useEffect, useCallback} from 'react';
import type {ConflictoAforo, ExclusionesConflicto, Alumno} from '../types';
import {priorizarPorProximidad} from '../utils/priorizacionAforo';
import {API_BASE} from '../constants/cap-constants';
/* TO-DO: tipos @dnd-kit no resuelven desde hooks/ - verificar tsconfig paths */

interface UseConflictoAforoParams {
    abierto: boolean;
    conflictos: ConflictoAforo[];
    onConfirmar: (exclusiones: ExclusionesConflicto) => void;
}

/**
 * Normaliza listas de IDs de alumnos que pueden venir en formatos
 * heterogéneos desde la API (number, string, object con id/alumnoId/alumno_id).
 */
function normalizarIdsAlumnos(lista: unknown): number[] {
    if (!Array.isArray(lista)) return [];

    return lista
        .map(item => {
            if (typeof item === 'number') return item;
            if (typeof item === 'string') {
                const parsed = Number(item);
                return Number.isFinite(parsed) ? parsed : null;
            }
            if (item && typeof item === 'object') {
                const candidato = (item as {id?: number; alumnoId?: number; alumno_id?: number}).id
                    ?? (item as {id?: number; alumnoId?: number; alumno_id?: number}).alumnoId
                    ?? (item as {id?: number; alumnoId?: number; alumno_id?: number}).alumno_id;
                return typeof candidato === 'number' ? candidato : null;
            }
            return null;
        })
        .filter((id): id is number => Number.isFinite(id));
}

export function useConflictoAforo({abierto, conflictos, onConfirmar}: UseConflictoAforoParams) {
    const [exclusiones, setExclusiones] = useState<ExclusionesConflicto>({});
    const [alumnosInfo, setAlumnosInfo] = useState<Map<number, Alumno>>(new Map());
    const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
    const [slotsAbiertos, setSlotsAbiertos] = useState<Record<string, boolean>>({});

    /* Cargar información de alumnos al abrir el modal */
    useEffect(() => {
        if (!abierto || conflictos.length === 0) return;

        const controller = new AbortController();

        const cargarAlumnos = async () => {
            setCargandoAlumnos(true);
            try {
                const alumnosIds = new Set<number>();
                conflictos.forEach(c => {
                    normalizarIdsAlumnos(c.alumnos).forEach(id => alumnosIds.add(id));
                });

                if (alumnosIds.size === 0) {
                    setAlumnosInfo(new Map());
                    return;
                }

                const idsQuery = Array.from(alumnosIds).join(',');
                const url = `${API_BASE}/alumnos/por-ids?ids=${encodeURIComponent(idsQuery)}`;

                const response = await fetch(url, {
                    headers: {'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''},
                    signal: controller.signal
                });

                if (response.ok) {
                    const data = await response.json();
                    const mapa = new Map<number, Alumno>();
                    (data.alumnos || []).forEach((a: any) => {
                        const alumnoId = typeof a.id === 'number' ? a.id : parseInt(a.id, 10);
                        if (alumnosIds.has(alumnoId)) {
                            mapa.set(alumnoId, {
                                id: alumnoId,
                                centroId: typeof a.centro_id === 'number' ? a.centro_id : parseInt(a.centro_id, 10),
                                nombre: a.nombre,
                                email: a.email,
                                telefono: a.telefono,
                                dni: a.dni,
                                horasCompletadas: parseFloat(a.horas_completadas) || 0,
                                estado: a.estado,
                                createdAt: a.created_at
                            });
                        }
                    });
                    setAlumnosInfo(mapa);
                } else {
                    console.error('[ModalConflictoAforo] Response no OK:', await response.text());
                    setAlumnosInfo(new Map());
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                console.error('[ModalConflictoAforo] Error cargando alumnos:', err);
            } finally {
                setCargandoAlumnos(false);
            }
        };

        cargarAlumnos();
        return () => controller.abort();
    }, [abierto, conflictos]);

    /* Inicializar exclusiones vacías al cambiar conflictos */
    useEffect(() => {
        const inicial: ExclusionesConflicto = {};
        conflictos.forEach(c => { inicial[c.slotKey] = []; });
        setExclusiones(inicial);
    }, [conflictos]);

    /* Inicializar todos los slots como abiertos */
    useEffect(() => {
        const inicial: Record<string, boolean> = {};
        conflictos.forEach(c => { inicial[c.slotKey] = true; });
        setSlotsAbiertos(inicial);
    }, [conflictos]);

    /* Toggle exclusión de un alumno en un slot */
    const toggleExclusion = useCallback((slotKey: string, alumnoId: number) => {
        setExclusiones(prev => {
            const actuales = prev[slotKey] || [];
            const yaExcluido = actuales.includes(alumnoId);
            return {
                ...prev,
                [slotKey]: yaExcluido ? actuales.filter(id => id !== alumnoId) : [...actuales, alumnoId]
            };
        });
    }, []);

    /* Toggle visual del acordeón de un slot */
    const toggleSlot = useCallback((slotKey: string) => {
        setSlotsAbiertos(prev => ({...prev, [slotKey]: !prev[slotKey]}));
    }, []);

    /* Verificar si todas las exclusiones resuelven los conflictos */
    const exclusionesValidas = useCallback((): boolean => {
        return conflictos.every(c => {
            const excluidos = exclusiones[c.slotKey]?.length || 0;
            return excluidos >= c.exceso;
        });
    }, [conflictos, exclusiones]);

    /* Obtener nombre legible de un alumno por ID */
    const getNombreAlumno = useCallback((id: number): string => {
        const alumno = alumnosInfo.get(id);
        return alumno?.nombre || `Alumno #${id}`;
    }, [alumnosInfo]);

    /* Formatear fecha legible sin desfase de zona horaria */
    const formatearFecha = useCallback((fecha: string): string => {
        const esFechaSimple = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
        const d = esFechaSimple
            ? (() => {
                const [anio, mes, dia] = fecha.split('-').map(Number);
                return new Date(anio, mes - 1, dia);
            })()
            : new Date(fecha);
        if (Number.isNaN(d.getTime())) return fecha;
        return d.toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'});
    }, []);

    /* Resolver excluyendo alumnos aleatoriamente por slot */
    const resolverAleatoriamente = useCallback(() => {
        const nuevasExclusiones: ExclusionesConflicto = {};

        conflictos.forEach(conflicto => {
            const alumnosConflicto = normalizarIdsAlumnos(conflicto.alumnos);
            const exceso = Math.max(conflicto.exceso, 0);

            if (exceso === 0 || alumnosConflicto.length === 0) {
                nuevasExclusiones[conflicto.slotKey] = [];
                return;
            }

            const mezcla = [...alumnosConflicto].sort(() => Math.random() - 0.5);
            nuevasExclusiones[conflicto.slotKey] = mezcla.slice(0, Math.min(exceso, mezcla.length));
        });

        setExclusiones(nuevasExclusiones);
        onConfirmar(nuevasExclusiones);
    }, [conflictos, onConfirmar]);

    /* Resolver priorizando por proximidad (horas restantes + continuidad) */
    const resolverPorProximidad = useCallback(() => {
        const alumnosConProgreso = new Map<number, any>();
        alumnosInfo.forEach((alumno, id) => {
            alumnosConProgreso.set(id, alumno);
        });

        const nuevasExclusiones = priorizarPorProximidad(conflictos, alumnosConProgreso);
        setExclusiones(nuevasExclusiones);
        onConfirmar(nuevasExclusiones);
    }, [conflictos, alumnosInfo, onConfirmar]);

    /* Confirmar exclusiones manuales */
    const handleConfirmar = useCallback(() => {
        if (exclusionesValidas()) {
            onConfirmar(exclusiones);
        }
    }, [exclusiones, exclusionesValidas, onConfirmar]);

    return {
        exclusiones,
        alumnosInfo,
        cargandoAlumnos,
        slotsAbiertos,
        toggleExclusion,
        toggleSlot,
        exclusionesValidas,
        getNombreAlumno,
        formatearFecha,
        resolverAleatoriamente,
        resolverPorProximidad,
        handleConfirmar,
        normalizarIdsAlumnos: normalizarIdsAlumnos,
    };
}
