/*
 * Componente: Badge
 * Etiquetas visuales para metadata: género, BPM, key, tipo, etc.
 */

import {type ReactNode} from 'react';
import '../../styles/componentes/badge.css';

type VarianteBadge = 'neutro' | 'acento' | 'exito' | 'error' | 'advertencia' | 'info' | 'premium';
type EstiloBadge = 'relleno' | 'borde';
type TamanoBadge = 'xs' | 'sm' | 'md';

interface BadgeProps {
    variante?: VarianteBadge;
    estilo?: EstiloBadge;
    tamano?: TamanoBadge;
    interactivo?: boolean;
    onClick?: (e: React.MouseEvent) => void;
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
    premium: 'badgePremium'
};

const mapaTamano: Record<TamanoBadge, string> = {
    xs: 'badgeXs',
    sm: '',
    md: 'badgeMd'
};

export const Badge = ({variante = 'neutro', estilo = 'relleno', tamano = 'sm', interactivo = false, onClick, children, className = ''}: BadgeProps): JSX.Element => {
    const clases = ['badge', mapaVariante[variante], mapaTamano[tamano], estilo === 'borde' ? 'badgeBorde' : '', interactivo ? 'badgeInteractivo' : '', className].filter(Boolean).join(' ');

    const Tag: React.ElementType = interactivo ? 'button' : 'span';

    return (
        <Tag className={clases} onClick={onClick} type={interactivo ? 'button' : undefined}>
            {children}
        </Tag>
    );
};

export default Badge;
