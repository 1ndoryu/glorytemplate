import {useState, useEffect} from 'react';
import {Button} from './Button';
import {useAnalyticsConfig} from '../../hooks/useSiteConfig';

const STORAGE_KEY = 'cookie_consent';

export function CookieBanner(): JSX.Element | null {
    const [isVisible, setIsVisible] = useState(false);
    const analyticsConfig = useAnalyticsConfig();
    const gtmId = analyticsConfig.gtmId;

    useEffect(() => {
        // Validar si ya hay consentimiento
        const consent = localStorage.getItem(STORAGE_KEY);
        if (!consent) {
            setIsVisible(true);
        } else if (consent === 'accepted') {
            loadGtm();
        }
    }, []);

    const loadGtm = () => {
        // No cargar si no hay GTM ID configurado
        if (!gtmId || gtmId === '') {
            console.warn('[CookieBanner] GTM ID no configurado en Theme Options');
            return;
        }

        if (window.dataLayer) return; // Ya cargado

        // Inicializar dataLayer (tipo definido en useAnalytics.ts)
        window.dataLayer = window.dataLayer || [];

        // Funcion gtag para configuracion inicial
        const gtag = (...args: unknown[]) => {
            window.dataLayer.push({event: 'gtag', args});
        };
        gtag('js', new Date());
        gtag('config', gtmId);

        // Script GTM
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
        script.async = true;
        document.head.appendChild(script);
    };

    const handleAccept = () => {
        localStorage.setItem(STORAGE_KEY, 'accepted');
        setIsVisible(false);
        loadGtm();
    };

    const handleDeny = () => {
        localStorage.setItem(STORAGE_KEY, 'denied');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 w-full backdrop-blur-md bg-[var(--color-bg-primary)]/80">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-text-inverse text-center md:text-left">
                    <p>
                        Utilizamos cookies propias y de terceros para mejorar nuestros servicios. Si continúas navegando, consideramos que aceptas su uso. Más información en nuestra{' '}
                        <a href="/cookies" className="underline hover:text-[var(--color-accent-primary)]">
                            Política de Cookies
                        </a>
                        .
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" size="sm" onClick={handleDeny} className="text-white hover:text-white/80">
                        Denegar
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleAccept}>
                        Aceptar
                    </Button>
                </div>
            </div>
        </div>
    );
}
