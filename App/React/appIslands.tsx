/**
 * App Islands Registry
 *
 * IMPORTANTE: Este archivo es el punto de registro de TODAS las islas
 * especificas de este proyecto. Glory/main.tsx importa este archivo
 * para mantener Glory agnostico del proyecto.
 *
 * Para agregar una nueva isla:
 * 1. Crear el componente en App/React/islands/NombreIsla.tsx
 * 2. Importarlo y agregarlo al objeto appIslands abajo
 * 3. Crear la funcion PHP en App/Templates/pages/nombre-isla.php
 * 4. Registrar en App/Config/pages.php
 */

// Islas del proyecto
import {HomeIsland} from './islands/HomeIsland';
import {PageEditorIsland} from './islands/PageEditorIsland';

// Estilos especificos del proyecto
import './styles/editorPagina.css';

// Registrar bloques del proyecto en Glory BlockRegistry
import {registerAppBlocks} from './blocks';
registerAppBlocks();

/**
 * Registro de islas de la aplicacion
 * La clave es el nombre usado en data-island, el valor es el componente
 */
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {
    HomeIsland: HomeIsland,
    PageEditorIsland: PageEditorIsland
};

/**
 * Exportacion por defecto para facilitar el import en Glory/main.tsx
 */
export default appIslands;
