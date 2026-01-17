/**
 * Badge Component
 *
 * Etiqueta pequeña para estados y contadores.
 */

import {type ReactNode} from 'react';
import './Badge.css';

type VarianteBadge = 'default' | 'primario' | 'exito' | 'advertencia' | 'error' | 'info';
type TamanoBadge = 'sm' | 'md';

interface BadgeProps {
    variante?: VarianteBadge;
    tamano?: TamanoBadge;
    punto?: boolean;
    icono?: ReactNode;
    className?: string;
    children?: ReactNode;
}

export function Badge({variante = 'default', tamano = 'md', punto = false, icono, className = '', children}: BadgeProps): JSX.Element {
    const clases = ['capBadge', `capBadge--${variante}`, `capBadge--${tamano}`, punto && 'capBadge--punto', className].filter(Boolean).join(' ');

    if (punto) {
        return <span className={clases} />;
    }

    return (
        <span className={clases}>
            {icono && <span className="capBadge__icono">{icono}</span>}
            {children}
        </span>
    );
}

export default Badge;
