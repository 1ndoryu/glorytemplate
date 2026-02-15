/*
 * Componente: BotonLike — Kamples (Fase 4.2)
 * Botón de like con optimistic UI y animación.
 */

import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { darLike, quitarLike } from '@app/services/apiSocial';
import '../../styles/componentes/botonLike.css';

interface BotonLikeProps {
    tipo: 'sample' | 'publicacion';
    targetId: number;
    liked?: boolean;
    totalLikes?: number;
    mostrarContador?: boolean;
    tamano?: 'sm' | 'md';
    className?: string;
}

export const BotonLike = ({
    tipo,
    targetId,
    liked: likedInicial = false,
    totalLikes: totalInicial = 0,
    mostrarContador = true,
    tamano = 'md',
    className = '',
}: BotonLikeProps): JSX.Element => {
    const [liked, setLiked] = useState(likedInicial);
    const [total, setTotal] = useState(totalInicial);
    const [animando, setAnimando] = useState(false);
    const [cargando, setCargando] = useState(false);

    const manejarClick = useCallback(async () => {
        if (cargando) return;
        setCargando(true);

        /* Optimistic UI */
        const likedAnterior = liked;
        const totalAnterior = total;
        setLiked(!liked);
        setTotal(liked ? total - 1 : total + 1);

        if (!liked) {
            setAnimando(true);
            setTimeout(() => setAnimando(false), 300);
        }

        const resp = liked
            ? await quitarLike(tipo, targetId)
            : await darLike(tipo, targetId);

        if (!resp.ok) {
            setLiked(likedAnterior);
            setTotal(totalAnterior);
        }

        setCargando(false);
    }, [liked, total, tipo, targetId, cargando]);

    const iconSize = tamano === 'sm' ? 12 : 16;
    const clases = [
        'botonLike',
        liked ? 'botonLikeActivo' : '',
        animando ? 'botonLikeAnimando' : '',
        `botonLike-${tamano}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={clases}
            onClick={manejarClick}
            disabled={cargando}
            type="button"
            aria-label={liked ? 'Quitar like' : 'Dar like'}
        >
            <Heart size={iconSize} fill={liked ? 'currentColor' : 'none'} />
            {mostrarContador && total > 0 && (
                <span className="botonLikeContador">{total}</span>
            )}
        </button>
    );
};

export default BotonLike;
