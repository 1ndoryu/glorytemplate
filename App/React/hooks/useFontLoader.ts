import {useEffect} from 'react';
import type {ThemeName} from './useTheme';

/**
 * Configuracion de fuentes por tema.
 * Cada tema tiene su propio conjunto de fuentes que se cargan dinamicamente.
 */
const fontsByTheme: Record<ThemeName, {id: string; href: string}[]> = {
    project: [
        {id: 'font-inter', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'},
        {id: 'font-manrope', href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700&display=swap'}
    ],
    default: [
        {id: 'font-geist-sans', href: 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css'},
        {id: 'font-geist-mono', href: 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-mono/style.css'}
    ]
};

/**
 * Familia de fuentes CSS por tema.
 * Se usa para aplicar la fuente correcta al contenedor principal.
 */
export const fontFamilyByTheme: Record<ThemeName, string> = {
    project: "'Inter', system-ui, sans-serif",
    default: "'Geist Sans', sans-serif"
};

/**
 * Hook que maneja la carga dinamica de fuentes segun el tema activo.
 *
 * Funcionalidades:
 * - Inyecta los links de fuentes en el head del documento
 * - Limpia las fuentes cuando cambia el tema
 * - Evita duplicados si la fuente ya esta cargada
 *
 * @param theme - El tema activo ('default' | 'project')
 */
export function useFontLoader(theme: ThemeName): void {
    useEffect(() => {
        const fontsToLoad = fontsByTheme[theme] || fontsByTheme.default;
        const addedLinks: HTMLLinkElement[] = [];

        fontsToLoad.forEach(({id, href}) => {
            // Evitar duplicados: si ya existe el link, no lo agregamos
            if (!document.getElementById(id)) {
                const link = document.createElement('link');
                link.id = id;
                link.href = href;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
                addedLinks.push(link);
            }
        });

        // Cleanup: remover fuentes agregadas en este efecto cuando cambia el tema
        return () => {
            addedLinks.forEach(link => {
                if (document.head.contains(link)) {
                    document.head.removeChild(link);
                }
            });
        };
    }, [theme]);
}
