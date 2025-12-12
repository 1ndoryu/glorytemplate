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

    // Inicializacion: leer de URL o localStorage
    useEffect(() => {
        // Prioridad: 1) URL param, 2) localStorage, 3) project (tema cliente por defecto)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTheme = urlParams.get('theme') as ThemeName | null;
        const storedTheme = localStorage.getItem('glory-theme') as ThemeName | null;

        // Tema por defecto: 'project' (cliente Guillermo Garcia)
        let initialTheme: ThemeName = 'project';

        if (urlTheme && (urlTheme === 'default' || urlTheme === 'project')) {
            initialTheme = urlTheme;
        } else if (storedTheme && (storedTheme === 'default' || storedTheme === 'project')) {
            initialTheme = storedTheme;
        }

        setThemeState(initialTheme);
        setIsInitialized(true);
    }, []);

    // Aplicar tema al DOM cuando cambie
    useEffect(() => {
        if (!isInitialized) return;

        const htmlElement = document.documentElement;

        if (theme === 'project') {
            htmlElement.setAttribute('data-theme', 'project');
        } else {
            htmlElement.removeAttribute('data-theme');
        }

        // Guardar en localStorage
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
