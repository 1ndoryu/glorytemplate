import {useState, useEffect, useCallback} from 'react';

// Tipos de temas disponibles
export type ThemeName = 'default' | 'project';

// Descripcion de cada tema para UI
export const themeLabels: Record<ThemeName, string> = {
    default: 'Custom (Stone)',
    project: 'Project (Blue)'
};

/**
 * Hook para manejar el tema de la aplicacion.
 *
 * Funcionalidades:
 * - Lee el tema inicial desde URL (?theme=project)
 * - Persiste la seleccion en localStorage
 * - Aplica el atributo data-theme al elemento html
 * - Provee funcion para cambiar entre temas
 *
 * @returns {Object} { theme, setTheme, toggleTheme }
 */
export function useTheme() {
    const [theme, setThemeState] = useState<ThemeName>('project');
    const [isInitialized, setIsInitialized] = useState(false);

    // Inicializacion: leer tema actual del DOM
    // NOTA: El tema "project" (azul) es ahora el DEFAULT en CSS (:root)
    // Solo existe data-theme="default" para el tema alternativo stone
    useEffect(() => {
        const htmlElement = document.documentElement;
        const currentDomTheme = htmlElement.getAttribute('data-theme');

        // Prioridad: URL > DOM actual
        const urlParams = new URLSearchParams(window.location.search);
        const urlTheme = urlParams.get('theme') as ThemeName | null;

        let initialTheme: ThemeName;

        if (urlTheme && (urlTheme === 'default' || urlTheme === 'project')) {
            initialTheme = urlTheme;
        } else {
            // Sin atributo data-theme = project (es el default en CSS)
            // Con data-theme="default" = stone
            initialTheme = currentDomTheme === 'default' ? 'default' : 'project';
        }

        setThemeState(initialTheme);
        localStorage.setItem('glory-theme', initialTheme);
        setIsInitialized(true);
    }, []);

    // Aplicar tema al DOM cuando cambie (solo si hay diferencia)
    // NOTA: "project" = sin atributo (default CSS), "default" = data-theme="default"
    useEffect(() => {
        if (!isInitialized) return;

        const htmlElement = document.documentElement;
        const currentDomTheme = htmlElement.getAttribute('data-theme');

        if (theme === 'default') {
            // Tema stone: necesita data-theme="default"
            if (currentDomTheme !== 'default') {
                htmlElement.setAttribute('data-theme', 'default');
            }
        } else {
            // Tema project: es el default en CSS, remover cualquier atributo
            if (currentDomTheme !== null) {
                htmlElement.removeAttribute('data-theme');
            }
        }

        localStorage.setItem('glory-theme', theme);
    }, [theme, isInitialized]);

    // Funcion para establecer tema especifico
    const setTheme = useCallback((newTheme: ThemeName) => {
        setThemeState(newTheme);
    }, []);

    // Funcion para alternar entre temas
    const toggleTheme = useCallback(() => {
        setThemeState(current => (current === 'default' ? 'project' : 'default'));
    }, []);

    return {
        theme,
        setTheme,
        toggleTheme,
        isInitialized
    };
}
