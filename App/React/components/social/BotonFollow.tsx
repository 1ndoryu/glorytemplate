/*
 * Componente: BotonFollow — Kamples (Fase 4.1)
 * Toggle de follow/unfollow con optimistic UI.
 */

import { UserPlus, UserCheck } from 'lucide-react';
import { useBotonFollow } from '@app/hooks/useBotonFollow';
import { useT } from '@app/utils/i18n';
import '../../styles/componentes/botonFollow.css';
import { BotonBase } from '../ui/BotonBase';

interface BotonFollowProps {
    usuarioId: number;
    siguiendo?: boolean;
    tamano?: 'sm' | 'md';
    soloIcono?: boolean;
    className?: string;
}

export const BotonFollow = ({
    usuarioId,
    siguiendo: siguiendoInicial = false,
    tamano = 'md',
    soloIcono = false,
    className = '',
}: BotonFollowProps): JSX.Element => {
    const { siguiendo, cargando, manejarClick, clases } = useBotonFollow({
        usuarioId, siguiendoInicial, tamano, className,
    });

    const { t } = useT();
    /* [193A-78] Tamaño del ícono según tamano */
    const iconSize = tamano === 'sm' ? 12 : 14;

    return (
        <BotonBase variante="ghost"
            className={`${clases}${soloIcono ? ' botonFollowSoloIcono' : ''}`}
            onClick={manejarClick}
            disabled={cargando}
            type="button"
            aria-label={siguiendo ? t('comun.dejarDeSeguir') : t('comun.seguir')}
        >
            {siguiendo ? <UserCheck size={iconSize} /> : <UserPlus size={iconSize} />}
            {!soloIcono && <span>{siguiendo ? t('comun.siguiendo') : t('comun.seguir')}</span>}
        </BotonBase>
    );
};

export default BotonFollow;
