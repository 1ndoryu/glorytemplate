/*
 * Componente: Badge (Tag)
 * Etiqueta reutilizable para mostrar categorÃ­as o estados.
 */
import './Badge.css';

interface BadgeProps {
    label: string;
    className?: string;
}

export const Badge = ({label, className = ''}: BadgeProps) => {
    return <span className={`badge ${className}`}>{label}</span>;
};
