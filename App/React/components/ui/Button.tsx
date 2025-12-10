// Componente Button reutilizable
// Soporta tres variantes: primary, outline y ghost
// Puede renderizarse como boton o como enlace si se proporciona href

interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'outline' | 'ghost';
    className?: string;
    href?: string;
    icon?: React.ComponentType<{className?: string}>;
    onClick?: () => void;
}

export function Button({children, variant = 'primary', className = '', href, icon: Icon, onClick}: ButtonProps) {
    const baseClass = 'inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#79716b] disabled:opacity-50 disabled:pointer-events-none tracking-tight shadow-sm';

    const variants = {
        primary: 'bg-[#292524] text-[#f8f8f6] hover:bg-[#1c1917] hover:shadow-md',
        outline: 'border border-[#e7e5e4] bg-white text-[#57534e] hover:bg-[#f5f5f4] hover:text-[#292524]',
        ghost: 'text-[#79716b] hover:bg-[#f0efeb] hover:text-[#292524]'
    };

    const content = (
        <>
            {children}
            {Icon && <Icon className="ml-2 h-3.5 w-3.5" />}
        </>
    );

    if (href) {
        return (
            <a href={href} className={`${baseClass} ${variants[variant]} ${className}`}>
                {content}
            </a>
        );
    }

    return (
        <button onClick={onClick} className={`${baseClass} ${variants[variant]} ${className}`}>
            {content}
        </button>
    );
}
