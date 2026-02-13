/**
 * Cosmo Revenue - App Islands Registry
 * Registro de todas las islas React del proyecto.
 */

import { registerAppBlocks } from './blocks/index';

/* Islas del proyecto */
import { LandingIsland } from './islands/LandingIsland';
import { ServiciosIsland } from './islands/ServiciosIsland';
import { ServicioDetalleIsland } from './islands/ServicioDetalleIsland';
import { CasosIsland } from './islands/CasosIsland';
import { AboutIsland } from './islands/AboutIsland';
import { ContactoIsland } from './islands/ContactoIsland';
import { ConstructorIsland } from './islands/ConstructorIsland';

/* Registrar bloques del page builder */
registerAppBlocks();

/**
 * AppProvider (Optional)
 * Export a component here to wrap the entire application (e.g. for Context)
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> | undefined = undefined;

/**
 * App Islands Registry
 * La clave es el nombre usado en PHP (PageManager::reactPage)
 */
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {
    LandingIsland: LandingIsland as React.ComponentType<Record<string, unknown>>,
    ServiciosIsland: ServiciosIsland as React.ComponentType<Record<string, unknown>>,
    ServicioDetalleIsland: ServicioDetalleIsland as React.ComponentType<Record<string, unknown>>,
    CasosIsland: CasosIsland as React.ComponentType<Record<string, unknown>>,
    AboutIsland: AboutIsland as React.ComponentType<Record<string, unknown>>,
    ContactoIsland: ContactoIsland as React.ComponentType<Record<string, unknown>>,
    ConstructorIsland: ConstructorIsland as React.ComponentType<Record<string, unknown>>,
};

export default appIslands;
