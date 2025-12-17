import type {ReactNode} from 'react';

import {useTheme} from '../../hooks/useTheme';
import {useFontLoader, fontFamilyByTheme} from '../../hooks/useFontLoader';
import {useSiteUrls} from '../../hooks/useSiteConfig';

import {ThemeToggle, CookieBanner} from '../ui';
import {Header, Footer, TopBanner} from '../sections';

import {mainNavItems, logoText, footerColumns, getCopyrightText} from '../../config';

// Props para el TopBanner opcional
interface TopBannerConfig {
    text: string;
    linkText: string;
    linkHref: string;
}

// Props del layout de pagina
// Permite personalizar header y footer sin duplicar estructura
interface PageLayoutProps {
    children: ReactNode;
    // Texto del CTA del header (default: 'Agendar 1:1')
    headerCtaText?: string;
    // Tipo de copyright para getCopyrightText (default: 'default')
    copyrightType?: 'default' | 'consultoria';
    // Configuracion opcional del TopBanner (solo para Home)
    topBanner?: TopBannerConfig;
    // Clases CSS adicionales para el main (para variaciones de gap)
    mainClassName?: string;
}

/**
 * PageLayout: Componente de layout compartido por todas las islands.
 * Centraliza la estructura comun: Header, Footer y ThemeToggle.
 *
 * Beneficios:
 * - Elimina duplicacion de estructura en las islands
 * - Facilita cambios globales de layout
 * - Mantiene consistencia visual entre paginas
 */
export function PageLayout({children, headerCtaText = 'Agendar 1:1', copyrightType, topBanner, mainClassName = 'flex-1 flex flex-col gap-16 md:gap-24 px-6 py-12 md:py-20'}: PageLayoutProps): JSX.Element {
    const {theme, toggleTheme} = useTheme();
    const urls = useSiteUrls();

    // Carga dinamica de fuentes segun tema (hook reutilizable)
    useFontLoader(theme);

    const fontFamily = fontFamilyByTheme[theme];

    return (
        <div
            className="min-h-screen selection:bg-[var(--color-selection-bg)]"
            style={{
                backgroundColor: 'var(--color-bg-primary)',
                fontFamily,
                color: 'var(--color-text-primary)'
            }}>
            {/* TOP BANNER (opcional, usado en Home) - Se mueve con scroll */}
            {topBanner && <TopBanner text={topBanner.text} linkText={topBanner.linkText} linkHref={topBanner.linkHref} />}

            {/* HEADER FIJO - Banner + Navegacion como bloque unico sticky */}
            <div id="sticky-header-container" className="sticky top-0 z-[var(--z-sticky)]">
                {/* HEADER - Navegacion principal */}
                <Header logoText={logoText} navItems={mainNavItems} ctaText={headerCtaText} ctaHref={urls.calendly} />
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <main className={mainClassName}>{children}</main>

            {/* FOOTER */}
            <div id="footer-wrapper">
                <Footer columns={footerColumns} copyrightText={getCopyrightText(copyrightType)} />
            </div>

            {/* THEME TOGGLE - Boton flotante para cambiar de tema */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {/* COOKIE BANNER - Gestion de consentimiento y activacion de GTM */}
            <CookieBanner />
        </div>
    );
}
