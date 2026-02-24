/*
 * Componente: BotonFollow — Kamples (Fase 4.1)
 * Toggle de follow/unfollow con optimistic UI.
 */

import { UserPlus, UserCheck } from 'lucide-react';
import { useBotonFollow } from '@app/hooks/useBotonFollow';
import '../../styles/componentes/botonFollow.css';
import { BotonBase } from '../ui/BotonBase';

interface BotonFollowProps {
    usuarioId: number;
    siguiendo?: boolean;
    tamano?: 'sm' | 'md';
    className?: string;
}

export const BotonFollow = ({
    usuarioId,
    siguiendo: siguiendoInicial = false,
    tamano = 'md',
    className = '',
}: BotonFollowProps): JSX.Element => {
    const { siguiendo, cargando, manejarClick, clases } = useBotonFollow({
        usuarioId, siguiendoInicial, tamano, className,
    });

    return (
        <BotonBase variante="ghost"
            className={clases}
            onClick={manejarClick}
            disabled={cargando}
            type="button"
            aria-label={siguiendo ? 'Dejar de seguir' : 'Seguir'}
        >
            {siguiendo ? <UserCheck size={tamano === 'sm' ? 12 : 14} /> : <UserPlus size={tamano === 'sm' ? 12 : 14} />}
            <span>{siguiendo ? 'Siguiendo' : 'Seguir'}</span>
        </BotonBase>
    );
};

export default BotonFollow;
