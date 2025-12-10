// Componente Badge reutilizable
// Muestra etiquetas o indicadores de estado con estilo consistente

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function Badge({children, className = ''}: BadgeProps) {
    return <span className={`inline-flex items-center rounded-md border border-[#e5e5e0] bg-white px-2 py-0.5 text-[11px] font-medium text-[#79716b] font-mono transition-colors ${className}`}>{children}</span>;
}
