/*
 * Componente: BotonLike — Kamples
 * Boton de like con optimistic UI, animacion y soporte de reacciones.
 * Lógica extraída a useBotonLike (SRP).
 */

import { Heart } from 'lucide-react';
import { TooltipReacciones } from '@app/components/ui/TooltipReacciones';
import { useBotonLike } from '@app/hooks/useBotonLike';
import type { TipoReaccion } from '@app/types';
import type { TipoLikeable } from '@app/services/apiSocial';
import '../../styles/componentes/botonLike.css';
import { BotonBase } from '../ui/BotonBase';

interface BotonLikeProps {
    tipo: TipoLikeable;
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
    const {
        liked, reaccion, total, animando, cargando,
        manejarClickDirecto, manejarReaccion, manejarQuitar,
    } = useBotonLike({ tipo, targetId, liked: likedInicial, reaccion: reaccionInicial, totalLikes: totalInicial });

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
        <TooltipReacciones reaccionActual={reaccion} onReaccionar={manejarReaccion} onQuitar={manejarQuitar}>
            <BotonBase variante="ghost" className={clases} onClick={manejarClickDirecto} disabled={cargando}
                type="button" aria-label={liked ? 'Quitar like' : 'Dar like'}>
                <Heart size={iconSize} fill={liked ? 'currentColor' : 'none'} />
                {mostrarContador && total > 0 && <span className="botonLikeContador">{total}</span>}
            </BotonBase>
        </TooltipReacciones>
    );
};

export default BotonLike;
