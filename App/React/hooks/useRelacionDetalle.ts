/*
 * Hook: useRelacionDetalle — Kamples
 * Carga detalle completo de una relación de sampleo (ambas canciones).
 * Extraído como hook independiente (SRP).
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerRelacionDetalle } from '@app/services/apiCanciones';
import { useNavigationStore } from '@/core/router';
import type { RelacionDetalleCompleta } from '@app/types/cancion';

interface UseRelacionDetalleParams {
    id?: string;
}

export function useRelacionDetalle({ id }: UseRelacionDetalleParams) {
    const [relacion, setRelacion] = useState<RelacionDetalleCompleta | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const navegar = useNavigationStore((s) => s.navegar);

    useEffect(() => {
        const idNumerico = id ? parseInt(id, 10) : NaN;

        if (!id || isNaN(idNumerico) || idNumerico <= 0) {
            setCargando(false);
            setError('ID de relación no válido');
            return;
        }

        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            setError('');

            const resp = await obtenerRelacionDetalle(idNumerico);

            if (controller.signal.aborted) return;

            if (resp.ok && resp.data) {
                setRelacion(resp.data);
            } else if (resp.status === 404) {
                setError('Relación no encontrada');
            } else {
                setError(resp.error ?? 'Error al cargar relación');
            }

            setCargando(false);
        };

        cargar();
        return () => { controller.abort(); };
    }, [id]);

    const irACancion = useCallback(
        (slug: string) => navegar(`/cancion/${slug}`),
        [navegar]
    );

    const irAArtista = useCallback(
        (slug: string) => navegar(`/artista/${slug}`),
        [navegar]
    );

    return {
        relacion,
        cargando,
        error,
        irACancion,
        irAArtista,
    };
}
