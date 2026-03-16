/*
 * Hook: useBotonLike
 * Lógica de like con optimistic UI, rollback, y reacciones (like/encanta/dislike).
 * Extraído de BotonLike para cumplir SRP (max 3 useState).
 */

import { useState, useCallback, useEffect } from 'react';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoLikeable } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import { EVENTO_LIKE_CAMBIADO } from '@app/hooks/useFeedLikes';

interface UseBotonLikeParams {
    tipo: TipoLikeable;
    targetId: number;
    liked?: boolean;
    reaccion?: TipoReaccion | null;
    totalLikes?: number;
}

export const useBotonLike = ({
    tipo,
    targetId,
    liked: likedInicial = false,
    reaccion: reaccionInicial = null,
    totalLikes: totalInicial = 0,
}: UseBotonLikeParams) => {
    const [liked, setLiked] = useState(likedInicial);
    const [reaccion, setReaccion] = useState<TipoReaccion | null>(reaccionInicial);
    const [total, setTotal] = useState(totalInicial);
    const [animando, setAnimando] = useState(false);
    const [cargando, setCargando] = useState(false);

    /* QL56: Sincronizar likes desde reproductor/feed */
    useEffect(() => {
        if (tipo !== 'sample') return;
        const manejar = (e: Event) => {
            const { sampleId, liked: nuevoLiked } = (e as CustomEvent<{ sampleId: number; liked: boolean }>).detail;
            if (sampleId === targetId) {
                setLiked(prev => prev === nuevoLiked ? prev : nuevoLiked);
            }
        };
        window.addEventListener(EVENTO_LIKE_CAMBIADO, manejar);
        return () => window.removeEventListener(EVENTO_LIKE_CAMBIADO, manejar);
    }, [tipo, targetId]);

    /* Click directo: toggle like simple */
    const manejarClickDirecto = useCallback(async () => {
        if (cargando) return;
        setCargando(true);

        const snapshot = { liked, total, reaccion };

        if (liked) {
            setLiked(false);
            setReaccion(null);
            setTotal(total - 1);
            if (tipo === 'sample') window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId: targetId, liked: false, reaccion: null } }));
            try {
                const resp = await quitarLike(tipo, targetId);
                if (!resp.ok) {
                    setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total);
                    if (tipo === 'sample') window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId: targetId, liked: snapshot.liked, reaccion: snapshot.reaccion } }));
                }
            } catch {
                setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total);
                if (tipo === 'sample') window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId: targetId, liked: snapshot.liked, reaccion: snapshot.reaccion } }));
            }
        } else {
            setLiked(true);
            setReaccion('like');
            setTotal(total + 1);
            setAnimando(true);
            setTimeout(() => setAnimando(false), 300);
            if (tipo === 'sample') window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId: targetId, liked: true, reaccion: 'like' } }));
            try {
                const resp = await darLike(tipo, targetId, 'like');
                if (!resp.ok) {
                    setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total);
                    if (tipo === 'sample') window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId: targetId, liked: snapshot.liked, reaccion: snapshot.reaccion } }));
                }
            } catch {
                setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total);
                if (tipo === 'sample') window.dispatchEvent(new CustomEvent(EVENTO_LIKE_CAMBIADO, { detail: { sampleId: targetId, liked: snapshot.liked, reaccion: snapshot.reaccion } }));
            }
        }
        setCargando(false);
    }, [liked, total, reaccion, tipo, targetId, cargando]);

    /* Seleccionar reacción desde tooltip */
    const manejarReaccion = useCallback(async (nuevaReaccion: TipoReaccion) => {
        if (cargando) return;
        setCargando(true);

        const snapshot = { liked, total, reaccion };
        const nuevoLiked = nuevaReaccion !== 'dislike';
        const eraPositivo = reaccion === 'like' || reaccion === 'encanta';
        const esPositivo = nuevaReaccion !== 'dislike';
        const deltaTotal = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);

        setLiked(nuevoLiked);
        setReaccion(nuevaReaccion);
        setTotal(Math.max(0, total + deltaTotal));
        if (esPositivo) { setAnimando(true); setTimeout(() => setAnimando(false), 300); }

        try {
            const resp = await darLike(tipo, targetId, nuevaReaccion);
            if (!resp.ok) { setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total); }
        } catch {
            setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total);
        }
        setCargando(false);
    }, [liked, total, reaccion, tipo, targetId, cargando]);

    /* Quitar reacción desde tooltip */
    const manejarQuitar = useCallback(async () => {
        if (cargando) return;
        setCargando(true);

        const snapshot = { liked, total, reaccion };
        const eraPositivo = reaccion === 'like' || reaccion === 'encanta';

        setLiked(false);
        setReaccion(null);
        setTotal(Math.max(0, total - (eraPositivo ? 1 : 0)));

        try {
            const resp = await quitarLike(tipo, targetId);
            if (!resp.ok) { setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total); }
        } catch {
            setLiked(snapshot.liked); setReaccion(snapshot.reaccion); setTotal(snapshot.total);
        }
        setCargando(false);
    }, [liked, total, reaccion, tipo, targetId, cargando]);

    return {
        liked, reaccion, total, animando, cargando,
        manejarClickDirecto, manejarReaccion, manejarQuitar,
    };
};
