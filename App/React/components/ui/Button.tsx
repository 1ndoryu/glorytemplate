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

    // Mapeo de clases por variante
    const variantClasses = {
        primary: 'bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white border border-transparent',
        outline: 'border border-[var(--color-border-secondary)] bg-surface text-secondary hover:bg-[var(--color-bg-secondary)]',
        ghost: 'text-muted hover:bg-[var(--color-bg-secondary)] hover:text-primary border border-transparent shadow-none',
        white: 'bg-white text-[var(--color-accent-primary)] border border-transparent shadow-sm hover:bg-gray-50'
    };

    const combinedClassName = `${baseClass} ${variantClasses[variant]} ${className}`;

    const content = (
        <>
            {children}
            {Icon && <Icon className="ml-2 h-3.5 w-3.5" />}
        </>
    );

    if (href) {
        return (
            <a href={href} className={combinedClassName}>
                {content}
            </a>
        );
    }

    return (
        <button type={type} disabled={disabled} onClick={onClick} className={combinedClassName}>
            {content}
        </button>
    );
}
