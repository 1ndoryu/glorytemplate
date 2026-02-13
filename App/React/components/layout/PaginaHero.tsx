import React from 'react';
import '@app/styles/pageHero.css';

interface PaginaHeroProps {
    titulo: string;
    /* Parte del titulo en tipografia script/italic */
    tituloScript?: string;
    subtitulo?: string;
    className?: string;
}

/*
 * Hero de paginas internas (Servicios, Casos, About, Contacto).
 * Fondo oscuro (#141414), titulo grande con acento opcional en cursiva.
 */
export function PaginaHero({
    titulo,
    tituloScript,
    subtitulo,
    className = '',
}: PaginaHeroProps): React.JSX.Element {
    return (
        <section className={`paginaHero ${className}`}>
            <div className="heroContenido">
                <h1 className="heroTitulo">
                    {titulo}
                    {tituloScript && (
                        <>
                            <br />
                            <span className="textoScript">{tituloScript}</span>
                        </>
                    )}
                </h1>
                {subtitulo && <p className="heroSubtitulo">{subtitulo}</p>}
            </div>
        </section>
    );
}
