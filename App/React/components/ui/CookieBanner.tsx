import {useState, useEffect} from 'react';
import {Button} from './Button';

const STORAGE_KEY = 'cookie_consent';
const GTM_ID = 'GTM-XXXXXXX'; // Placeholder

export function CookieBanner(): JSX.Element | null {
    const [isVisible, setIsVisible] = useState(false);

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
        if (window.dataLayer) return; // Ya cargado

        // Inicializar dataLayer
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
            window.dataLayer.push(args);
        }
        gtag('js', new Date());
        gtag('config', GTM_ID);

        // Script GTM
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-surface-inverse border-t border-[var(--color-border-primary)] shadow-lg animate-fade-in-up">
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

// Augment window interface for TypeScript
declare global {
    interface Window {
        dataLayer: any[];
    }
}
