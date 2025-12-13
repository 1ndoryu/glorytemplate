import {ReactNode} from 'react';
import {Badge} from './Badge';

interface SimulationCardProps {
    /** Texto del badge en la esquina superior derecha */
    badge?: string;
    /** Contenido dinamico de la simulacion */
    children: ReactNode;
    /** Clase adicional para el contenedor exterior */
    className?: string;
    /** Altura minima del area de contenido */
    minHeight?: string;
}

/**
 * SimulationCard - Tarjeta flotante reutilizable estilo ProcessWorkflow
 *
 * Estructura visual:
 * - Borde exterior con padding
 * - Header con placeholders rectangulares + badge opcional
 * - Area de contenido dinamico para animaciones
 *
 * Uso tipico: Envolver simulaciones animadas (chats, dashboards, etc.)
 */
export function SimulationCard({badge, children, className = '', minHeight = '150px'}: SimulationCardProps) {
    return (
        <div className={`w-full max-w-md ${className}`}>
            {/* Tarjeta con doble borde estilo ProcessWorkflow */}
            <div className="rounded-lg shadow-sm border p-2 bg-surface border-primary">
                <div className="rounded border p-5 flex flex-col gap-4 bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)]">
                    {/* Header - Placeholders rectangulares + Badge (oculto en móvil) */}
                    <div className="hidden sm:flex items-center justify-between border-b pb-4 border-[var(--color-border-subtle)]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border bg-secondary border-secondary"></div>
                            <div className="flex flex-col gap-1.5">
                                <div className="h-2.5 w-24 rounded-sm bg-[var(--color-border-secondary)]"></div>
                                <div className="h-2 w-16 rounded-sm bg-[var(--color-border-subtle)]"></div>
                            </div>
                        </div>
                        {badge && <Badge>{badge}</Badge>}
                    </div>

                    {/* Area de contenido dinamico */}
                    <div className="flex flex-col justify-center" style={{minHeight}}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
