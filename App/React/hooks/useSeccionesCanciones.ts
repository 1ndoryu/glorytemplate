/*
 * Hook: useSeccionesCanciones — QK18/QK22
 * Fetch de secciones estilo Spotify para la pagina de musica.
 * Like optimista con rollback en error (cross-section).
 */

import { useState, useEffect, useCallback } from 'react';
import { seccionesCanciones } from '@app/services/apiCanciones';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { toast } from '@app/stores/toastStore';
import type { SeccionMusica, Cancion } from '@app/types/cancion';

export function useSeccionesCanciones() {
    const [secciones, setSecciones] = useState<SeccionMusica[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let cancelado = false;
        seccionesCanciones().then(resp => {
            if (cancelado) return;
            if (resp.ok && resp.data) {
                setSecciones(resp.data);
            }
            setCargando(false);
        });
        return () => { cancelado = true; };
    }, []);

    /* Like optimista: busca la cancion en cualquier seccion y actualiza */
    const manejarLike = useCallback(async (cancionId: number) => {
        let anterior: Cancion | null = null;
        for (const sec of secciones) {
            if (!sec.canciones) continue;
            const encontrada = sec.canciones.find(c => c.id === cancionId);
            if (encontrada) { anterior = encontrada; break; }
        }
        if (!anterior) return;

        const nuevoLiked = !anterior.liked;

        setSecciones(prev => prev.map(sec => ({
            ...sec,
            canciones: sec.canciones?.map(c =>
                c.id === cancionId ? { ...c, liked: nuevoLiked } : c
            ),
        })));

        const resp = nuevoLiked
            ? await darLike('cancion', cancionId)
            : await quitarLike('cancion', cancionId);

        if (!resp.ok) {
            setSecciones(prev => prev.map(sec => ({
                ...sec,
                canciones: sec.canciones?.map(c =>
                    c.id === cancionId ? { ...c, liked: anterior!.liked } : c
                ),
            })));
            toast.error('Error al dar like');
        }
    }, [secciones]);

    return { secciones, cargando, manejarLike };
}
