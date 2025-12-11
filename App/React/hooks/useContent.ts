/**
 * useContent - Hook para consumir contenido inyectado desde PHP
 *
 * Este hook permite acceder al contenido definido en PHP via:
 * - ReactContentProvider::register()
 * - ReactContentProvider::injectGlobal()
 *
 * Uso:
 *   const posts = useContent<BlogPost[]>('blog');
 *   const settings = useContent<SiteSettings>('settings');
 *
 * El contenido se inyecta en window.__GLORY_CONTENT__ desde PHP.
 */

import {useState, useEffect} from 'react';

// Tipo para el contenido global inyectado desde PHP
interface GloryContentMap {
    [key: string]: unknown;
}

// Declaracion global para TypeScript
declare global {
    interface Window {
        __GLORY_CONTENT__?: GloryContentMap;
    }
}

/**
 * Hook para obtener contenido inyectado desde PHP.
 *
 * @param key Clave del contenido (definida en ReactContentProvider::register)
 * @param fallback Valor por defecto si no existe el contenido
 * @returns El contenido tipado o el fallback
 */
export function useContent<T>(key: string, fallback: T): T;
export function useContent<T>(key: string): T | undefined;
export function useContent<T>(key: string, fallback?: T): T | undefined {
    const [content, setContent] = useState<T | undefined>(() => {
        // Intentar obtener el contenido inmediatamente
        if (typeof window !== 'undefined' && window.__GLORY_CONTENT__) {
            return (window.__GLORY_CONTENT__[key] as T) ?? fallback;
        }
        return fallback;
    });

    useEffect(() => {
        // Re-verificar por si el contenido se carga dinamicamente
        if (typeof window !== 'undefined' && window.__GLORY_CONTENT__) {
            const newContent = window.__GLORY_CONTENT__[key] as T | undefined;
            if (newContent !== undefined) {
                setContent(newContent);
            }
        }
    }, [key]);

    return content;
}

/**
 * Hook para verificar si hay contenido disponible.
 */
export function useHasContent(key: string): boolean {
    const [hasContent, setHasContent] = useState<boolean>(() => {
        if (typeof window !== 'undefined' && window.__GLORY_CONTENT__) {
            return key in window.__GLORY_CONTENT__;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window !== 'undefined' && window.__GLORY_CONTENT__) {
            setHasContent(key in window.__GLORY_CONTENT__);
        }
    }, [key]);

    return hasContent;
}

/**
 * Hook para obtener todo el contenido inyectado.
 */
export function useAllContent(): GloryContentMap {
    const [content, setContent] = useState<GloryContentMap>(() => {
        if (typeof window !== 'undefined' && window.__GLORY_CONTENT__) {
            return window.__GLORY_CONTENT__;
        }
        return {};
    });

    useEffect(() => {
        if (typeof window !== 'undefined' && window.__GLORY_CONTENT__) {
            setContent(window.__GLORY_CONTENT__);
        }
    }, []);

    return content;
}
