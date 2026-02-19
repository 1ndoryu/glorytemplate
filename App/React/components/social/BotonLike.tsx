/*
 * Componente: BotonLike — Kamples
 * Boton de like con optimistic UI, animacion y soporte de reacciones.
 * Envuelto en TooltipReacciones para permitir like, encanta y dislike.
 */

import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { TooltipReacciones } from '@app/components/ui/TooltipReacciones';
import type { TipoReaccion } from '@app/types';
import '../../styles/componentes/botonLike.css';

interface BotonLikeProps {
    tipo: 'sample' | 'publicacion';
    targetId: number;
    liked?: boolean;
    reaccion?: TipoReaccion | null;
    totalLikes?: number;
    mostrarContador?: boolean;
    tamano?: 'sm' | 'md';
    className?: string;
}

export const BotonLike = ({
    tipo,
    targetId,
    liked: likedInicial = false,
    reaccion: reaccionInicial = null,
    totalLikes: totalInicial = 0,
    mostrarContador = true,
    tamano = 'md',
    className = '',
}: BotonLikeProps): JSX.Element => {
    const [liked, setLiked] = useState(likedInicial);
    const [reaccion, setReaccion] = useState<TipoReaccion | null>(reaccionInicial);
    const [total, setTotal] = useState(totalInicial);
    const [animando, setAnimando] = useState(false);
    const [cargando, setCargando] = useState(false);

    /* Click directo en el boton principal: toggle like simple */
    const manejarClickDirecto = useCallback(async () => {
        if (cargando) return;
        setCargando(true);

        const likedAnterior = liked;
        const totalAnterior = total;
        const reaccionAnterior = reaccion;

        if (liked) {
            setLiked(false);
            setReaccion(null);
            setTotal(total - 1);
            try {
                const resp = await quitarLike(tipo, targetId);
                if (!resp.ok) {
                    setLiked(likedAnterior);
                    setReaccion(reaccionAnterior);
                    setTotal(totalAnterior);
                }
            } catch {
                setLiked(likedAnterior);
                setReaccion(reaccionAnterior);
                setTotal(totalAnterior);
            }
        } else {
            setLiked(true);
            setReaccion('like');
            setTotal(total + 1);
            setAnimando(true);
            setTimeout(() => setAnimando(false), 300);
            try {
                const resp = await darLike(tipo, targetId, 'like');
                if (!resp.ok) {
                    setLiked(likedAnterior);
                    setReaccion(reaccionAnterior);
                    setTotal(totalAnterior);
                }
            } catch {
                setLiked(likedAnterior);
                setReaccion(reaccionAnterior);
                setTotal(totalAnterior);
            }
        }

        setCargando(false);
    }, [liked, total, reaccion, tipo, targetId, cargando]);

    /* Seleccionar una reaccion especifica desde el tooltip */
    const manejarReaccion = useCallback(async (nuevaReaccion: TipoReaccion) => {
        if (cargando) return;
        setCargando(true);

        const likedAnterior = liked;
        const totalAnterior = total;
        const reaccionAnterior = reaccion;

        const nuevoLiked = nuevaReaccion !== 'dislike';
        /* Ajustar total: solo like y encanta cuentan */
        const eraPositivo = reaccion === 'like' || reaccion === 'encanta';
        const esPositivo = nuevaReaccion !== 'dislike';
        const deltaTotal = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);

        setLiked(nuevoLiked);
        setReaccion(nuevaReaccion);
        setTotal(Math.max(0, total + deltaTotal));
        if (esPositivo) {
            setAnimando(true);
            setTimeout(() => setAnimando(false), 300);
        }

        try {
            const resp = await darLike(tipo, targetId, nuevaReaccion);
            if (!resp.ok) {
                setLiked(likedAnterior);
                setReaccion(reaccionAnterior);
                setTotal(totalAnterior);
            }
        } catch {
            setLiked(likedAnterior);
            setReaccion(reaccionAnterior);
            setTotal(totalAnterior);
        }

        setCargando(false);
    }, [liked, total, reaccion, tipo, targetId, cargando]);

    /* Quitar reaccion (desde tooltip, re-click sobre la activa) */
    const manejarQuitar = useCallback(async () => {
        if (cargando) return;
        setCargando(true);

        const likedAnterior = liked;
        const totalAnterior = total;
        const reaccionAnterior = reaccion;
        const eraPositivo = reaccion === 'like' || reaccion === 'encanta';

        setLiked(false);
        setReaccion(null);
        setTotal(Math.max(0, total - (eraPositivo ? 1 : 0)));

        try {
            const resp = await quitarLike(tipo, targetId);
            if (!resp.ok) {
                setLiked(likedAnterior);
                setReaccion(reaccionAnterior);
                setTotal(totalAnterior);
            }
        } catch {
            setLiked(likedAnterior);
            setReaccion(reaccionAnterior);
            setTotal(totalAnterior);
        }

        setCargando(false);
    }, [liked, total, reaccion, tipo, targetId, cargando]);

    const iconSize = tamano === 'sm' ? 12 : 16;
    const clases = [
        'botonLike',
        liked ? 'botonLikeActivo' : '',
        animando ? 'botonLikeAnimando' : '',
        `botonLike-${tamano}`,
        reaccion === 'encanta' ? 'reaccionPrincipalEncanta' : '',
        reaccion === 'dislike' ? 'reaccionPrincipalDislike' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <TooltipReacciones
            reaccionActual={reaccion}
            onReaccionar={manejarReaccion}
            onQuitar={manejarQuitar}
        >
            <button
                className={clases}
                onClick={manejarClickDirecto}
                disabled={cargando}
                type="button"
                aria-label={liked ? 'Quitar like' : 'Dar like'}
            >
                <Heart size={iconSize} fill={liked ? 'currentColor' : 'none'} />
                {mostrarContador && total > 0 && (
                    <span className="botonLikeContador">{total}</span>
                )}
            </button>
        </TooltipReacciones>
    );
};

export default BotonLike;
