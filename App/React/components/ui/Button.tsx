// Componente Button reutilizable
// Soporta tres variantes: primary, outline y ghost
// Puede renderizarse como boton o como enlace si se proporciona href

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost' | 'white';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    className?: string;
    href?: string;
    icon?: React.ComponentType<{className?: string}>;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

export function Button({children, variant = 'primary', size = 'md', className = '', href, icon: Icon, onClick, type = 'button', disabled = false}: ButtonProps) {
    const baseClass = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 disabled:opacity-50 disabled:pointer-events-none tracking-tight shadow-sm';

    const sizeClasses = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-11 px-6 text-sm', // 44px height (Phase 1.1 requirement)
        lg: 'h-12 px-8 text-base',
        icon: 'h-9 w-9'
    };

    const variantClasses = {
        primary: 'bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white border border-transparent',
        outline: 'border border-[var(--color-border-secondary)] bg-surface text-secondary hover:bg-[var(--color-bg-secondary)]',
        ghost: 'text-muted hover:bg-[var(--color-bg-secondary)] hover:text-primary border border-transparent shadow-none',
        white: 'bg-white text-[var(--color-accent-primary)] border border-transparent shadow-sm hover:bg-gray-50'
    };

    const combinedClassName = `${baseClass} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

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
