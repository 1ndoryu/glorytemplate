// Componente Badge reutilizable
// Muestra etiquetas o indicadores de estado con estilo consistente

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function Badge({children, className = ''}: BadgeProps) {
    return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium font-mono transition-colors border-primary bg-surface text-muted ${className}`}>{children}</span>;
}
