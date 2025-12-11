/**
 * useSpaNavigation - Hook para navegacion sin recarga de pagina
 *
 * Intercepta clics en enlaces internos y carga el contenido via fetch,
 * manteniendo el historial del navegador y las transiciones suaves.
 *
 * Uso:
 * - Llamar este hook en el componente AppShell o PageLayout
 * - Los enlaces con clase 'noAjax' o target="_blank" se ignoran
 */

import {useEffect, useCallback, useState} from 'react';

// URLs que deben ignorarse (navegacion normal)
const IGNORED_PATTERNS = [/\/wp-admin/, /\/wp-login/, /\/wp-json/, /\.(pdf|zip|doc|docx|xls|xlsx|jpg|jpeg|png|gif|svg|webp)$/i, /#calendly/, /^https?:\/\/wa\.me/, /^https?:\/\/calendly\.com/];

// Clase para desactivar navegacion AJAX en un enlace
const NO_AJAX_CLASS = 'noAjax';

interface NavigationState {
    isNavigating: boolean;
    currentPath: string;
    error: string | null;
}

interface UseSpaNavigationOptions {
    // Selector del contenedor donde se reemplaza el contenido
    contentSelector?: string;
    // Callback antes de navegar
    onBeforeNavigate?: (url: string) => boolean | void;
    // Callback despues de navegar
    onAfterNavigate?: (url: string) => void;
    // Callback en caso de error
    onError?: (error: Error, url: string) => void;
    // Tiempo de espera maximo para la peticion (ms)
    timeout?: number;
}

/**
 * Verifica si una URL debe ser procesada con navegacion AJAX
 */
function shouldHandleNavigation(url: string, linkElement: HTMLAnchorElement): boolean {
    // Verificar si el enlace tiene la clase noAjax
    if (linkElement.classList.contains(NO_AJAX_CLASS)) {
        return false;
    }

    // Verificar si algun ancestro tiene la clase noAjax
    if (linkElement.closest(`.${NO_AJAX_CLASS}`)) {
        return false;
    }

    // Verificar target
    if (linkElement.target === '_blank') {
        return false;
    }

    // Verificar atributo download
    if (linkElement.hasAttribute('download')) {
        return false;
    }

    // Verificar si es un enlace externo
    try {
        const linkUrl = new URL(url, window.location.origin);
        if (linkUrl.origin !== window.location.origin) {
            return false;
        }
    } catch {
        return false;
    }

    // Verificar patrones ignorados
    for (const pattern of IGNORED_PATTERNS) {
        if (pattern.test(url)) {
            return false;
        }
    }

    return true;
}

/**
 * Extrae el contenido del body de un documento HTML
 */
function extractBodyContent(html: string): {content: string; title: string} {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extraer el titulo
    const title = doc.title || document.title;

    // Extraer el contenido del body
    const body = doc.body;
    const content = body ? body.innerHTML : '';

    return {content, title};
}

/**
 * Hace scroll al inicio de la pagina
 */
function scrollToTop(): void {
    window.scrollTo({top: 0, behavior: 'instant'});
}

export function useSpaNavigation(options: UseSpaNavigationOptions = {}) {
    const {contentSelector = 'body', onBeforeNavigate, onAfterNavigate, onError, timeout = 10000} = options;

    const [state, setState] = useState<NavigationState>({
        isNavigating: false,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : '/',
        error: null
    });

    /**
     * Navega a una URL sin recarga de pagina
     */
    const navigateTo = useCallback(
        async (url: string, pushState = true): Promise<boolean> => {
            // Callback antes de navegar
            if (onBeforeNavigate) {
                const shouldContinue = onBeforeNavigate(url);
                if (shouldContinue === false) {
                    return false;
                }
            }

            setState(prev => ({...prev, isNavigating: true, error: null}));

            try {
                // Crear controlador para timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                // Hacer fetch de la nueva pagina
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Accept: 'text/html',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const html = await response.text();
                const {content, title} = extractBodyContent(html);

                // Actualizar el titulo de la pagina
                document.title = title;

                // Reemplazar el contenido del body
                const targetElement = document.querySelector(contentSelector);
                if (targetElement) {
                    targetElement.innerHTML = content;

                    // Re-inicializar las islas React en el nuevo contenido
                    reinitializeReactIslands();
                }

                // Actualizar el historial del navegador
                if (pushState) {
                    history.pushState({url}, title, url);
                }

                // Scroll al inicio
                scrollToTop();

                setState({
                    isNavigating: false,
                    currentPath: new URL(url, window.location.origin).pathname,
                    error: null
                });

                // Callback despues de navegar
                if (onAfterNavigate) {
                    onAfterNavigate(url);
                }

                // Disparar evento personalizado para que otros scripts puedan reaccionar
                document.dispatchEvent(new CustomEvent('gloryRecarga', {detail: {url}}));

                return true;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

                setState(prev => ({
                    ...prev,
                    isNavigating: false,
                    error: errorMessage
                }));

                if (onError && error instanceof Error) {
                    onError(error, url);
                }

                // En caso de error, hacer navegacion normal
                console.warn('[SPA Nav] Error en navegacion AJAX, usando navegacion normal:', errorMessage);
                window.location.href = url;

                return false;
            }
        },
        [contentSelector, onBeforeNavigate, onAfterNavigate, onError, timeout]
    );

    /**
     * Re-inicializa las islas React despues de cargar nuevo contenido
     */
    const reinitializeReactIslands = useCallback(() => {
        // Buscar islas en el nuevo contenido y montarlas
        // El modulo main.tsx deberia re-ejecutarse o necesitamos replicar su logica aqui
        const event = new CustomEvent('glory:reinitialize-islands');
        document.dispatchEvent(event);
    }, []);

    /**
     * Manejador de clics en enlaces
     */
    const handleClick = useCallback(
        (event: MouseEvent) => {
            // Ignorar si hay modificadores de teclado
            if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
                return;
            }

            // Buscar el enlace clickeado
            const target = event.target as HTMLElement;
            const link = target.closest('a');

            if (!link) {
                return;
            }

            const href = link.getAttribute('href');

            if (!href || href.startsWith('#')) {
                return;
            }

            // Verificar si debemos manejar esta navegacion
            if (!shouldHandleNavigation(href, link)) {
                return;
            }

            // Prevenir navegacion por defecto
            event.preventDefault();

            // Navegar via AJAX
            navigateTo(href);
        },
        [navigateTo]
    );

    /**
     * Manejador del boton atras/adelante del navegador
     */
    const handlePopState = useCallback(
        (event: PopStateEvent) => {
            const url = event.state?.url || window.location.href;
            navigateTo(url, false);
        },
        [navigateTo]
    );

    // Configurar event listeners
    useEffect(() => {
        // Escuchar clics en el documento
        document.addEventListener('click', handleClick);

        // Escuchar navegacion del historial
        window.addEventListener('popstate', handlePopState);

        // Guardar el estado inicial en el historial
        if (!history.state) {
            history.replaceState({url: window.location.href}, document.title, window.location.href);
        }

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [handleClick, handlePopState]);

    return {
        ...state,
        navigateTo
    };
}
