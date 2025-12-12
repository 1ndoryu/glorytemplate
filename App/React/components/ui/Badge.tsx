// Componente Badge reutilizable
// Muestra etiquetas o indicadores de estado con estilo consistente

type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'border-primary bg-surface text-muted',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    success: 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    error: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300'
};

const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm'
};

export function Badge({children, className = '', variant = 'default', size = 'md'}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center rounded-md border font-medium transition-colors
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `}>
            {children}
        </span>
    );
}
