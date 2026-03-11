/*
 * Hook: useTabContribuciones — C807
 * Lógica del tab admin para moderar contribuciones pendientes.
 * Polling cada 30s para detectar nuevas contribuciones.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    listarContribucionesAdmin,
    moderarContribucionAdmin,
    type ContribucionAdmin,
} from '../services/apiContribuciones';
import { crearLogger } from '../services/logger';

const log = crearLogger('useTabContribuciones');
const INTERVALO_POLLING = 30_000;

export function useTabContribuciones() {
    const [contribuciones, setContribuciones] = useState<ContribucionAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cargar = useCallback(async (silencioso = false) => {
        if (!silencioso) setCargando(true);
        setError(null);
        try {
            const res = await listarContribucionesAdmin(pagina, 20);
            if (res.ok && res.data) {
                setContribuciones(res.data.items ?? []);
                setTotal(res.data.total ?? 0);
            } else {
                setError(res.error ?? 'Error al cargar contribuciones');
            }
        } catch (err) {
            log.error('Error cargando contribuciones admin', err);
            setError('Error de conexión');
        }
        if (!silencioso) setCargando(false);
    }, [pagina]);

    /* Carga inicial + polling */
    useEffect(() => {
        cargar();
        intervaloRef.current = setInterval(() => cargar(true), INTERVALO_POLLING);
        return () => {
            if (intervaloRef.current) clearInterval(intervaloRef.current);
        };
    }, [cargar]);

    /* Moderar: aprobar o rechazar */
    const moderar = useCallback(async (
        id: number,
        accion: 'aprobada' | 'rechazada',
        nota?: string
    ) => {
        setAccionEnCurso(id);
        try {
            const res = await moderarContribucionAdmin(id, accion, nota);
            if (res.ok) {
                await cargar(true);
            } else {
                setError(res.error ?? `Error al ${accion === 'aprobada' ? 'aprobar' : 'rechazar'}`);
            }
        } catch (err) {
            log.error('Error moderando contribución', err);
            setError('Error de conexión al moderar');
        }
        setAccionEnCurso(null);
    }, [cargar]);

    return {
        contribuciones,
        total,
        pagina,
        setPagina,
        cargando,
        accionEnCurso,
        error,
        moderar,
        recargar: cargar,
    };
}
