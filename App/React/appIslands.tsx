/**
 * App Islands Registry
 *
 * Punto de registro de TODAS las islas específicas de este proyecto.
 * Glory/main.tsx importa este archivo para mantener Glory agnóstico del proyecto.
 *
 * Para agregar una nueva isla:
 * 1. Crear el componente en App/React/islands/NombreIsla.tsx
 * 2. Importarlo y agregarlo al objeto appIslands abajo
 * 3. Registrar en App/Config/pages.php con PageManager::reactPage()
 */

/* Islas del proyecto - Importar aquí */
// import { MiIsland } from './islands/MiIsland';

/**
 * AppProvider opcional para contexto global de la aplicación
 * Si no se necesita contexto global, exportar como undefined
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> | undefined = undefined;

/**
 * Registro de islas de la aplicación
 * La clave es el nombre usado en data-island, el valor es el componente
 */
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {
    /* Registrar islas aquí */
    // MiIsland: MiIsland,
};

export default appIslands;
