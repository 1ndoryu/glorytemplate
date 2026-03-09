/*
 * Hook: useCancionDetalle — Kamples
 * Carga detalle de canción con relaciones de sample.
 * Extraído de CancionDetalleIsland (SRP).
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerCancionDetalle } from '@app/services/apiCanciones';
import { useNavigationStore } from '@/core/router';
import type { CancionDetalle } from '@app/types/cancion';

interface UseCancionDetalleParams {
    slug?: string;
}

export function useCancionDetalle({ slug }: UseCancionDetalleParams) {
    const [detalle, setDetalle] = useState<CancionDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const navegar = useNavigationStore((s) => s.navegar);

    useEffect(() => {
        if (!slug) {
            setCargando(false);
            setError('No se especificó una canción');
            return;
        }

        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            setError('');

            const resp = await obtenerCancionDetalle(slug);

            if (controller.signal.aborted) return;

            if (resp.ok && resp.data) {
                setDetalle(resp.data);
            } else if (resp.status === 404) {
                setError('Canción no encontrada');
            } else {
                setError(resp.error ?? 'Error al cargar canción');
            }

            setCargando(false);
        };

        cargar();
        return () => { controller.abort(); };
    }, [slug]);

    const irACancion = useCallback(
        (cancionSlug: string) => navegar(`/cancion/${cancionSlug}`),
        [navegar]
    );

    const irAArtista = useCallback(
        (artistaSlug: string) => navegar(`/artista/${artistaSlug}`),
        [navegar]
    );

    return {
        detalle,
        cargando,
        error,
        irACancion,
        irAArtista,
    };
}
