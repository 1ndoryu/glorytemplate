// Componente TopBanner
// Banner superior promocional con enlace a accion

import {ArrowRight} from 'lucide-react';

interface TopBannerProps {
    text: string;
    linkText: string;
    linkHref: string;
}

export function TopBanner({text, linkText, linkHref}: TopBannerProps) {
    return (
        <div
            className="w-full py-2 px-6 relative text-[11px] md:text-xs font-mono border-b"
            style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--color-border-secondary)'
            }}>
            <div className="mx-auto w-full max-w-7xl flex items-center justify-center gap-3">
                <span className="opacity-100 font-medium">{text}</span>
                <span className="opacity-30">|</span>
                <a href={linkHref} className="font-semibold underline underline-offset-2 transition-colors flex items-center" style={{color: 'inherit'}} onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')} onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}>
                    {linkText} <ArrowRight className="w-3 h-3 ml-1" />
                </a>
            </div>
        </div>
    );
}
