// Componente Badge reutilizable
// Muestra etiquetas o indicadores de estado con estilo consistente

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function Badge({children, className = ''}: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium font-mono transition-colors ${className}`}
            style={{
                borderColor: 'var(--color-border-primary)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-muted)'
            }}>
            {children}
        </span>
    );
}
