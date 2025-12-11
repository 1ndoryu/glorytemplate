// Componente Button reutilizable
// Soporta tres variantes: primary, outline y ghost
// Puede renderizarse como boton o como enlace si se proporciona href

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost' | 'white';
    className?: string;
    href?: string;
    icon?: React.ComponentType<{className?: string}>;
    onClick?: () => void;
    // Soporte para formularios
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

export function Button({children, variant = 'primary', className = '', href, icon: Icon, onClick, type = 'button', disabled = false}: ButtonProps) {
    const baseClass = 'inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 disabled:opacity-50 disabled:pointer-events-none tracking-tight shadow-sm';

    // Estilos base usando CSS variables
    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            backgroundColor: 'var(--color-accent-primary)',
            // Texto blanco fijo para contraste en ambos temas
            // Tema default: botones oscuros con texto blanco
            // Tema project: botones azules con texto blanco
            color: '#ffffff'
        },
        outline: {
            border: '1px solid var(--color-border-secondary)',
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-secondary)'
        },
        ghost: {
            color: 'var(--color-text-muted)',
            backgroundColor: 'transparent'
        },
        white: {
            backgroundColor: '#ffffff',
            color: 'var(--color-accent-primary)',
            border: '1px solid transparent',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
        }
    };

    const content = (
        <>
            {children}
            {Icon && <Icon className="ml-2 h-3.5 w-3.5" />}
        </>
    );

    if (href) {
        return (
            <a href={href} className={`${baseClass} ${className}`} style={variantStyles[variant]}>
                {content}
            </a>
        );
    }

    return (
        <button type={type} disabled={disabled} onClick={onClick} className={`${baseClass} ${className}`} style={variantStyles[variant]}>
            {content}
        </button>
    );
}
