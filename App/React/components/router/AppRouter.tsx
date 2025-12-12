/**
 * AppRouter - Router SPA para navegacion entre paginas React
 *
 * Este componente maneja la navegacion sin recarga entre las diferentes
 * paginas/islands del sitio. Intercepta clics en enlaces y cambia
 * el contenido dinamicamente.
 *
 * Soporta:
 * - Rutas estaticas: /servicios, /planes, etc.
 * - Rutas dinamicas: /blog/:slug para single posts
 */

import {useState, useEffect, useCallback, createContext, useContext} from 'react';
import type {ReactNode} from 'react';

// Importar todas las islands
import {HomeIsland} from '../../islands/HomeIsland';
import {ServicesIsland} from '../../islands/ServicesIsland';
import {PricingIsland} from '../../islands/PricingIsland';
import {DemosIsland} from '../../islands/DemosIsland';
import {AboutIsland} from '../../islands/AboutIsland';
import {BlogIsland} from '../../islands/BlogIsland';
import {SinglePostIsland} from '../../islands/SinglePostIsland';
import {ContactIsland} from '../../islands/ContactIsland';
import {PrivacyIsland} from '../../islands/PrivacyIsland';
import {CookiesIsland} from '../../islands/CookiesIsland';
import {AdminAIIsland} from '../../islands/AdminAIIsland';

// Mapa de rutas estaticas a componentes
const STATIC_ROUTES: Record<string, React.ComponentType> = {
    '/': HomeIsland,
    '/servicios': ServicesIsland,
    '/planes': PricingIsland,
    '/demos': DemosIsland,
    '/sobre-mi': AboutIsland,
    '/blog': BlogIsland,
    '/contacto': ContactIsland,
    '/privacidad': PrivacyIsland,
    '/cookies': CookiesIsland,
    '/panel-ia': AdminAIIsland
};

// Rutas dinamicas (patron -> componente wrapper)
interface DynamicRoute {
    pattern: RegExp;
    getComponent: (matches: RegExpMatchArray) => React.ReactNode;
}

const DYNAMIC_ROUTES: DynamicRoute[] = [
    {
        // /blog/:slug - Single post
        pattern: /^\/blog\/([^\/]+)\/?$/,
        getComponent: matches => <SinglePostIsland slug={matches[1]} />
    }
];

// URLs que deben usar navegacion tradicional (no SPA)
const EXCLUDED_PATTERNS = [/\/wp-admin/, /\/wp-login/, /\/wp-json/, /\.(pdf|zip|doc|docx|xls|xlsx|jpg|jpeg|png|gif|svg|webp)$/i, /#calendly/, /^https?:\/\/wa\.me/, /^https?:\/\/calendly\.com/];

// Contexto para el router
interface RouterContextType {
    currentPath: string;
    navigateTo: (path: string) => void;
    isNavigating: boolean;
}

const RouterContext = createContext<RouterContextType | null>(null);

/**
 * Hook para acceder al router desde cualquier componente
 */
export function useRouter(): RouterContextType {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useRouter debe usarse dentro de AppRouter');
    }
    return context;
}

/**
 * Verifica si una URL debe manejarse con el router SPA
 */
function shouldHandleInternally(url: string): boolean {
    // Verificar si es una URL absoluta externa
    try {
        const urlObj = new URL(url, window.location.origin);
        if (urlObj.origin !== window.location.origin) {
            return false;
        }
        url = urlObj.pathname;
    } catch {
        // Si no es una URL valida, dejamos que el navegador la maneje
        return false;
    }

    // Verificar patrones excluidos
    for (const pattern of EXCLUDED_PATTERNS) {
        if (pattern.test(url)) {
            return false;
        }
    }

    // Normalizar el path
    const normalizedPath = url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url;

    // Verificar rutas estaticas
    if (STATIC_ROUTES[normalizedPath] !== undefined) {
        return true;
    }

    // Verificar rutas dinamicas
    for (const route of DYNAMIC_ROUTES) {
        if (route.pattern.test(normalizedPath)) {
            return true;
        }
    }

    return false;
}

/**
 * Resultado de resolver una ruta
 */
interface RouteResult {
    type: 'static' | 'dynamic' | 'not-found';
    component?: React.ComponentType;
    element?: React.ReactNode;
}

/**
 * Obtiene el slug de un path (ultima parte de la URL sin el trailing slash)
 */
function getSlugFromPath(path: string): string {
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
    const segments = normalizedPath.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
}

/**
 * Verifica si un slug corresponde a un post existente en blogPosts
 */
function isValidPostSlug(slug: string): boolean {
    if (!slug || typeof window === 'undefined') return false;

    const content = window.__GLORY_CONTENT__;
    if (!content || !content.blogPosts) return false;

    const posts = content.blogPosts as Array<{slug: string}>;
    return posts.some(post => post.slug === slug);
}

/**
 * Resuelve una ruta y devuelve el componente o elemento a renderizar
 */
function resolveRoute(path: string): RouteResult {
    // Normalizar el path (quitar trailing slash excepto para root)
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

    // Verificar rutas estaticas
    const StaticComponent = STATIC_ROUTES[normalizedPath];
    if (StaticComponent) {
        return {type: 'static', component: StaticComponent};
    }

    // Verificar rutas dinamicas
    for (const route of DYNAMIC_ROUTES) {
        const matches = normalizedPath.match(route.pattern);
        if (matches) {
            return {type: 'dynamic', element: route.getComponent(matches)};
        }
    }

    // Fallback: Verificar si el path corresponde a un single post
    // Esto maneja el caso de acceso directo a URLs como /mi-post/ (sin /blog/ prefix)
    // que WordPress sirve directamente via single.php
    const slug = getSlugFromPath(normalizedPath);
    if (slug && isValidPostSlug(slug)) {
        return {type: 'dynamic', element: <SinglePostIsland slug={slug} />};
    }

    return {type: 'not-found'};
}

interface AppRouterProps {
    // Path inicial (normalmente viene del servidor)
    initialPath?: string;
    // Contenido fallback mientras carga
    fallback?: ReactNode;
}

/**
 * Componente principal del router
 */
export function AppRouter({initialPath, fallback}: AppRouterProps) {
    // Obtener el path inicial del servidor o de la URL actual
    const [currentPath, setCurrentPath] = useState(() => {
        if (initialPath) return initialPath;
        if (typeof window !== 'undefined') return window.location.pathname;
        return '/';
    });

    const [isNavigating, setIsNavigating] = useState(false);

    /**
     * Navega a una nueva ruta
     */
    const navigateTo = useCallback(
        (path: string) => {
            // Verificar si debemos manejar esta ruta
            if (!shouldHandleInternally(path)) {
                // Navegacion tradicional
                window.location.href = path;
                return;
            }

            // Normalizar el path
            const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;

            // Si ya estamos en esa ruta, no hacer nada
            if (normalizedPath === currentPath) {
                // Pero si hay un hash, scrollear al elemento
                if (path.includes('#')) {
                    const hash = path.split('#')[1];
                    const element = document.getElementById(hash);
                    if (element) {
                        element.scrollIntoView({behavior: 'smooth'});
                    }
                }
                return;
            }

            setIsNavigating(true);

            // Scroll al inicio
            window.scrollTo({top: 0, behavior: 'instant'});

            // Actualizar el historial del navegador
            history.pushState({path: normalizedPath}, '', normalizedPath);

            // Actualizar el estado
            setCurrentPath(normalizedPath);

            // Pequeno delay para la transicion
            setTimeout(() => setIsNavigating(false), 50);

            // Disparar evento para analytics u otros scripts
            document.dispatchEvent(
                new CustomEvent('gloryRecarga', {
                    detail: {url: normalizedPath, isSpaNavigation: true}
                })
            );
        },
        [currentPath]
    );

    /**
     * Manejador de clics en enlaces
     */
    const handleClick = useCallback(
        (event: MouseEvent) => {
            // Ignorar si hay modificadores de teclado
            if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
                return;
            }

            // Ignorar si el boton no es el principal
            if (event.button !== 0) {
                return;
            }

            // Buscar el enlace clickeado
            const target = event.target as HTMLElement;
            const link = target.closest('a');

            if (!link) {
                return;
            }

            // Verificar si el enlace tiene clase noAjax
            if (link.classList.contains('noAjax') || link.closest('.noAjax')) {
                return;
            }

            // Verificar target="_blank"
            if (link.target === '_blank') {
                return;
            }

            // Verificar atributo download
            if (link.hasAttribute('download')) {
                return;
            }

            const href = link.getAttribute('href');

            if (!href) {
                return;
            }

            // Si es solo un hash, manejar scroll
            if (href.startsWith('#')) {
                const element = document.getElementById(href.slice(1));
                if (element) {
                    event.preventDefault();
                    element.scrollIntoView({behavior: 'smooth'});
                }
                return;
            }

            // Verificar si debemos manejar esta navegacion
            if (!shouldHandleInternally(href)) {
                return;
            }

            // Prevenir navegacion por defecto
            event.preventDefault();

            // Navegar via router
            navigateTo(href);
        },
        [navigateTo]
    );

    /**
     * Manejador del boton atras/adelante del navegador
     */
    const handlePopState = useCallback((event: PopStateEvent) => {
        const path = event.state?.path || window.location.pathname;
        setCurrentPath(path);
        window.scrollTo({top: 0, behavior: 'instant'});
    }, []);

    // Configurar event listeners
    useEffect(() => {
        // Escuchar clics en el documento
        document.addEventListener('click', handleClick);

        // Escuchar navegacion del historial
        window.addEventListener('popstate', handlePopState);

        // Guardar el estado inicial en el historial
        if (!history.state) {
            history.replaceState({path: currentPath}, '', currentPath);
        }

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [handleClick, handlePopState, currentPath]);

    // Resolver la ruta actual
    const routeResult = resolveRoute(currentPath);

    // Si no hay ruta, mostrar fallback o redirigir
    if (routeResult.type === 'not-found') {
        if (fallback) {
            return <>{fallback}</>;
        }

        // Redirigir al home como fallback
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
        return null;
    }

    // Renderizar segun el tipo de ruta
    const renderContent = () => {
        if (routeResult.type === 'static' && routeResult.component) {
            const CurrentPage = routeResult.component;
            return <CurrentPage />;
        }
        if (routeResult.type === 'dynamic' && routeResult.element) {
            return <>{routeResult.element}</>;
        }
        return null;
    };

    return (
        <RouterContext.Provider value={{currentPath, navigateTo, isNavigating}}>
            <div
                id="app-router-container"
                style={{
                    opacity: isNavigating ? 0.7 : 1,
                    transition: 'opacity 150ms ease'
                }}>
                {renderContent()}
            </div>
        </RouterContext.Provider>
    );
}

/**
 * Componente Link para navegacion interna
 * Usa el router SPA cuando es posible
 */
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: ReactNode;
}

export function Link({href, children, onClick, ...props}: LinkProps) {
    const router = useRouter();

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        // Ejecutar onClick personalizado si existe
        if (onClick) {
            onClick(event);
        }

        // Si el evento fue prevenido, no hacer nada
        if (event.defaultPrevented) {
            return;
        }

        // Verificar modificadores
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
            return;
        }

        // Verificar si debemos manejar internamente
        if (shouldHandleInternally(href)) {
            event.preventDefault();
            router.navigateTo(href);
        }
    };

    return (
        <a href={href} onClick={handleClick} {...props}>
            {children}
        </a>
    );
}
