/**
 * PaginaLegal — Componente reutilizable para páginas legales.
 * Lee contenido HTML desde options.legal[contentKey] inyectado por ReactContext.
 */

import { useGloryOptions } from '@/hooks';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

interface LegalOptions {
    legal?: Record<string, string>;
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
        <div className="min-h-screen bg-white">
            <Header />

            <div className="pt-24 pb-20">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">{titulo}</h1>
                    {html ? (
                        <div
                            className="prose prose-gray prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-green-600"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    ) : (
                        <p className="text-gray-500">
                            Contenido en preparación. Contacta con nosotros para más información.
                        </p>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
