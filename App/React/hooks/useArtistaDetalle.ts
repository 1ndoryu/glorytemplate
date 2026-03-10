/*
 * Hook: useArtistaDetalle — Kamples
 * Carga detalle completo de un artista: info, canciones, relaciones.
 * Lógica separada del componente (SRP).
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerArtistaDetalle } from '@app/services/apiCanciones';
import { useNavigationStore } from '@/core/router';
import type { ArtistaDetalle } from '@app/types/cancion';

interface UseArtistaDetalleParams {
    slug?: string;
}

export function useArtistaDetalle({ slug }: UseArtistaDetalleParams) {
    const [datos, setDatos] = useState<ArtistaDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const navegar = useNavigationStore((s) => s.navegar);

    useEffect(() => {
        if (!slug) {
            setCargando(false);
            setError('Slug de artista no válido');
            return;
        }

        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            setError('');

            const resp = await obtenerArtistaDetalle(slug);

            if (controller.signal.aborted) return;

            if (resp.ok && resp.data) {
                setDatos(resp.data);
            } else if (resp.status === 404) {
                setError('Artista no encontrado');
            } else {
                setError(resp.error ?? 'Error al cargar artista');
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

    const irARelacion = useCallback(
        (id: number) => navegar(`/sampleo/${id}`),
        [navegar]
    );

    return {
        datos,
        cargando,
        error,
        irACancion,
        irAArtista,
        irARelacion,
    };
}
