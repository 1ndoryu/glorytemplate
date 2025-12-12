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

    // Inicializacion: leer tema actual del DOM (ya viene del servidor)
    // IMPORTANTE: El servidor ya envió el tema correcto en data-theme
    // NO usamos localStorage en la primera carga para evitar flash de estilos
    useEffect(() => {
        const htmlElement = document.documentElement;
        const currentDomTheme = htmlElement.getAttribute('data-theme');
        
        // El servidor ya aplicó el tema correcto, solo sincronizamos el estado
        // Prioridad: DOM (servidor) > URL (solo si difiere del DOM)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTheme = urlParams.get('theme') as ThemeName | null;

        let initialTheme: ThemeName;

        if (urlTheme && (urlTheme === 'default' || urlTheme === 'project')) {
            // URL tiene prioridad si está presente (el servidor ya lo aplicó)
            initialTheme = urlTheme;
        } else {
            // Usar lo que el servidor ya aplicó al DOM
            initialTheme = currentDomTheme === 'project' ? 'project' : 'default';
        }

        // Sincronizar estado React con lo que ya está en el DOM
        setThemeState(initialTheme);
        
        // Actualizar localStorage para mantener consistencia (sin cambiar DOM)
        localStorage.setItem('glory-theme', initialTheme);
        
        setIsInitialized(true);
    }, []);

    // Aplicar tema al DOM cuando cambie (solo si hay diferencia)
    useEffect(() => {
        if (!isInitialized) return;

        const htmlElement = document.documentElement;
        const currentDomTheme = htmlElement.getAttribute('data-theme');

        // Solo modificar el DOM si hay una diferencia real (evita flash de estilos)
        if (theme === 'project') {
            if (currentDomTheme !== 'project') {
                htmlElement.setAttribute('data-theme', 'project');
            }
        } else {
            if (currentDomTheme !== null) {
                htmlElement.removeAttribute('data-theme');
            }
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
