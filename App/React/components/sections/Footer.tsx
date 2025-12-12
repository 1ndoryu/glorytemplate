// Componente Footer
// Pie de pagina con columnas de enlaces, redes sociales y creditos

import {Linkedin, Twitter, Youtube, Instagram} from 'lucide-react';
import {useActiveSocialProfiles, useSiteIdentity, useSiteImages, type SocialProfiles} from '../../hooks/useSiteConfig';

interface FooterColumn {
    title: string;
    links: {
        label: string;
        href: string;
    }[];
}

interface FooterProps {
    columns: FooterColumn[];
    copyrightText: string;
}

// Mapa de iconos para redes sociales
const socialIcons: Record<keyof SocialProfiles, React.ComponentType<{className?: string}>> = {
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
    instagram: Instagram
};

// Logo SVG por defecto
function DefaultFooterLogo() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" fillOpacity="0.1" />
            <path d="M12 7V17M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function Footer({columns, copyrightText}: FooterProps) {
    const socialProfiles = useActiveSocialProfiles();
    const identity = useSiteIdentity();
    const images = useSiteImages();

    // Determinar que logo mostrar
    const logoMode = images.logoMode || 'text';
    const logoImageUrl = images.logo;
    const displayLogoText = images.logoText || identity.name;

    return (
        <footer className="w-full border-t bg-surface border-primary">
            <div className="mx-auto w-full max-w-7xl px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[13px]">
                    {columns.map((column, index) => (
                        <div key={index} className="flex flex-col gap-3">
                            <h3 className="font-semibold uppercase tracking-wide text-xs text-primary">{column.title}</h3>
                            {column.links.map((link, linkIndex) => (
                                <a key={linkIndex} href={link.href} className="hover:opacity-80 text-muted">
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="pt-8 mt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs border-subtle text-subtle">
                    <a href="/" className="font-bold text-lg tracking-tighter flex items-center gap-2 opacity-80 text-primary">
                        {logoMode === 'image' && logoImageUrl ? <img src={logoImageUrl} alt={displayLogoText} className="h-6 w-auto" /> : displayLogoText ? <span>{displayLogoText}</span> : <DefaultFooterLogo />}
                    </a>

                    {/* Redes sociales */}
                    {socialProfiles.length > 0 && (
                        <div className="flex items-center gap-4">
                            {socialProfiles.map(({platform, url}) => {
                                const Icon = socialIcons[platform];
                                return (
                                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors" aria-label={`Ir a ${platform}`}>
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    <p>{copyrightText}</p>
                </div>
            </div>
        </footer>
    );
}
