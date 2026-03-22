/* useLikeCancion — Kamples
 * [223A-3-G] Like de canciones con rollback optimista.
 * Reutilizable en CancionDetalleIsland y ModalCancionAleatoria. */

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore, type EstadoAuth } from '@app/stores/authStore';
import { darLike, quitarLike } from '@app/services/apiSocial';

export function useLikeCancion(cancionId: number | undefined, initialLiked: boolean) {
    const autenticado = useAuthStore((s: EstadoAuth) => s.autenticado);
    const [liked, setLiked] = useState(initialLiked);
    const [likeando, setLikeando] = useState(false);

    useEffect(() => { setLiked(initialLiked); }, [cancionId]);

    const toggleLike = useCallback(async () => {
        if (!autenticado || likeando || !cancionId) return;
        const anterior = liked;
        setLikeando(true);
        setLiked(!anterior);
        const resp = anterior
            ? await quitarLike('cancion', cancionId)
            : await darLike('cancion', cancionId);
        if (!resp.ok) setLiked(anterior);
        else if (resp.data && typeof resp.data.liked === 'boolean') setLiked(resp.data.liked);
        setLikeando(false);
    }, [autenticado, likeando, liked, cancionId]);

    return { liked, likeando, toggleLike, autenticado };
}
