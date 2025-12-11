import type {LucideIcon} from 'lucide-react';
import {Badge} from './Badge';

/**
 * Props para el componente FeatureCard.
 */
interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    badge?: string;
}

/**
 * Tarjeta de caracteristica/servicio.
 * Se usa en la pagina de Services para mostrar canales disponibles.
 */
export function FeatureCard({icon: Icon, title, description, badge}: FeatureCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-lg border p-6 transition-all hover:shadow-md" style={{borderColor: 'var(--color-border-primary)', backgroundColor: 'var(--color-bg-surface)'}}>
            <div className="flex items-start justify-between mb-4">
                <div className="rounded-md p-2 transition-colors group-hover:bg-[#e7e5e4]" style={{backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)'}}>
                    <Icon className="h-5 w-5" />
                </div>
                {badge && <Badge>{badge}</Badge>}
            </div>
            <h3 className="mb-2 text-base font-semibold tracking-tight" style={{color: 'var(--color-text-primary)'}}>
                {title}
            </h3>
            <p className="text-sm leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                {description}
            </p>
        </div>
    );
}
