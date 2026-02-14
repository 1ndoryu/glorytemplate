/*
 * Componente: Badge
 * Etiquetas visuales para metadata: género, BPM, key, tipo, etc.
 */

import { type ReactNode } from 'react';
import '../../styles/componentes/badge.css';

type VarianteBadge = 'neutro' | 'acento' | 'exito' | 'error' | 'advertencia' | 'info' | 'premium';
type EstiloBadge = 'relleno' | 'borde';

interface BadgeProps {
    variante?: VarianteBadge;
    estilo?: EstiloBadge;
    interactivo?: boolean;
    onClick?: () => void;
    children: ReactNode;
    className?: string;
}

const mapaVariante: Record<VarianteBadge, string> = {
    neutro: 'badgeNeutro',
    acento: 'badgeAcento',
    exito: 'badgeExito',
    error: 'badgeError',
    advertencia: 'badgeAdvertencia',
    info: 'badgeInfo',
    premium: 'badgePremium',
};

export const Badge = ({
    variante = 'neutro',
    estilo = 'relleno',
    interactivo = false,
    onClick,
    children,
    className = '',
}: BadgeProps): JSX.Element => {
    const clases = [
        'badge',
        mapaVariante[variante],
        estilo === 'borde' ? 'badgeBorde' : '',
        interactivo ? 'badgeInteractivo' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const Tag = interactivo ? 'button' : 'span';

    return (
        <Tag className={clases} onClick={onClick} type={interactivo ? 'button' : undefined}>
            {children}
        </Tag>
    );
};

export default Badge;
