// Componente Button reutilizable
// Soporta tres variantes: primary, outline y ghost
// Puede renderizarse como boton o como enlace si se proporciona href
// Incluye tracking automatico para WhatsApp y Calendly (FASE 8)

import {analytics} from '../../hooks/useAnalytics';

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

/**
 * Detecta si un href es de WhatsApp o Calendly y trackea el evento correspondiente.
 */
function trackLinkClick(href: string, ctaText: string): void {
    if (href.includes('wa.me') || href.includes('api.whatsapp.com')) {
        analytics.trackWhatsAppClick(ctaText);
    } else if (href.includes('calendly.com')) {
        analytics.trackCalendlyClick(ctaText);
    }
}

export function Button({children, variant = 'primary', size = 'md', className = '', href, icon: Icon, onClick, type = 'button', disabled = false}: ButtonProps) {
    const baseClass = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-1 disabled:opacity-50 disabled:pointer-events-none tracking-tight shadow-sm';

    const sizeClasses = {
        sm: 'h-auto min-h-[32px] px-3 py-1 text-xs',
        md: 'h-auto min-h-[44px] px-6 py-2 text-sm', // 44px min-height (Phase 1.1 requirement)
        lg: 'h-auto min-h-[48px] px-8 py-3 text-base',
        icon: 'h-9 w-9'
    };

    const variantClasses = {
        primary: 'bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white border border-transparent',
        outline: 'border border-[var(--color-border-secondary)] bg-surface text-secondary hover:bg-[var(--color-bg-secondary)]',
        ghost: 'text-muted hover:bg-[var(--color-bg-secondary)] hover:text-primary border border-[var(--color-border-secondary)] shadow-none',
        white: 'bg-white text-[var(--color-accent-primary)] border border-transparent shadow-sm hover:bg-gray-50'
    };

    const combinedClassName = `${baseClass} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

    // Extraer texto del CTA para tracking
    const ctaText = typeof children === 'string' ? children : 'CTA Button';

    const content = (
        <>
            {children}
            {Icon && <Icon className="ml-2 h-3.5 w-3.5" />}
        </>
    );

    if (href) {
        const handleClick = () => {
            trackLinkClick(href, ctaText);
        };

        return (
            <a href={href} className={combinedClassName} onClick={handleClick}>
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
