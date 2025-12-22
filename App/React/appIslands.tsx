/*
 * App Islands Registry
 *
 * Punto de registro de TODAS las islas específicas de este proyecto.
 * Glory/main.tsx importa este archivo para mantener Glory agnóstico del proyecto.
 *
 * Para agregar una nueva isla:
 * 1. Crear el componente en App/React/islands/NombreIsla.tsx
 * 2. Importarlo y agregarlo al objeto appIslands abajo
 * 3. Crear la función PHP en App/Templates/pages/nombre-isla.php
 * 4. Registrar en App/Config/pages.php
 */

/* Islas del proyecto */
import {DashboardIsland} from './islands/DashboardIsland';

/* Provider global de la app */
import {ProveedorAlertas} from './context/AlertasContext';

/* Estilos del proyecto */
import './styles/dashboard/index.css';

/*
 * Registro de islas de la aplicación
 * La clave es el nombre usado en data-island, el valor es el componente
 */
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {
    DashboardIsland: DashboardIsland
};

/*
 * Provider global de la aplicación
 * Glory lo usará para envolver todas las islas
 * Puede ser undefined si la app no necesita un provider
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> | undefined = ProveedorAlertas;

/*
 * Exportación por defecto para facilitar el import en Glory/main.tsx
 */
export default appIslands;
