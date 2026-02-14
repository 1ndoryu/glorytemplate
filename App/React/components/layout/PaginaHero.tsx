import React from 'react';

interface PaginaHeroProps {
    textoScript: string;
    textoPrincipal: string;
    subtitulo?: string;
    className?: string;
}

/*
 * Hero de paginas internas (Servicios, Casos, About, Contacto).
 * Replica la estructura exacta de PageHero.php de App1.
 * Clases: page-hero, hero-content, hero-title, script-text, script-icon, hero-subtitle
 */
export function PaginaHero({
    textoScript,
    textoPrincipal,
    subtitulo,
    className = '',
}: PaginaHeroProps): React.JSX.Element {
    return (
        <section className={`page-hero ${className}`} style={{ minHeight: '500px' }}>
            <div className="hero-content">
                <h1 className="hero-title">
                    <span className="script-text">
                        {textoScript}
                        <svg className="script-icon" viewBox="0 0 26.19 26.19" fill="currentColor">
                            <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
                        </svg>
                    </span>
                    {textoPrincipal}
                </h1>
                {subtitulo && <p className="hero-subtitle">{subtitulo}</p>}
            </div>
        </section>
    );
}
