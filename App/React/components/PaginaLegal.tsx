/**
 * PaginaLegal — Componente reutilizable para páginas legales.
 * Lee contenido HTML desde options.legal[contentKey] inyectado por ReactContext.
 */

import { useGloryOptions } from '@/hooks';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

interface LegalOptions {
    legal?: Record<string, string>;
    [key: string]: unknown;
}

interface PaginaLegalProps {
    titulo: string;
    contentKey?: string;
    fallbackContent?: string;
}

export function PaginaLegal({ titulo, contentKey, fallbackContent }: PaginaLegalProps): JSX.Element {
    const { get } = useGloryOptions<LegalOptions>();
    const legal = get('legal', {} as Record<string, string>) as Record<string, string>;
    const html = (contentKey ? legal[contentKey] : '') || fallbackContent || '';

    return (
        <div className="legalContenido">
            <Header />

            <div className="reservarLayout">
                <div className="legalContenedor">
                    <h1 className="legalTitulo">{titulo}</h1>
                    {html ? (
                        <div
                            className="legalHtml"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    ) : (
                        <p className="legalPlaceholder">
                            Contenido en preparación. Contacta con nosotros para más información.
                        </p>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
