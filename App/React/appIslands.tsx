/**
 * App Islands Registry
 *
 * This file is the main entry point for your React components.
 * Add your islands here.
 */

import {registerAppBlocks} from './blocks/index';

// Importar Islas
import {BienvenidaIsland} from './islands/BienvenidaIsland';
import {LoginIsland} from './islands/auth/LoginIsland';
import {RegistroIsland} from './islands/auth/RegistroIsland';
import {PerfilIsland} from './islands/social/PerfilIsland';
import {EditarPerfilIsland} from './islands/social/EditarPerfilIsland';

// Register blocks
registerAppBlocks();

/**
 * AppProvider (Optional)
 * Export a component here to wrap the entire application (e.g. for Context)
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> | undefined = undefined;

/**
 * App Islands Registry
 * Provide your island components here.
 * La clave es el nombre usado en PHP (PageManager::reactPage)
 */
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {
    BienvenidaIsland: BienvenidaIsland as React.ComponentType<Record<string, unknown>>,
    LoginIsland: LoginIsland as React.ComponentType<Record<string, unknown>>,
    RegistroIsland: RegistroIsland as React.ComponentType<Record<string, unknown>>,
    PerfilIsland: PerfilIsland as React.ComponentType<Record<string, unknown>>,
    EditarPerfilIsland: EditarPerfilIsland as React.ComponentType<Record<string, unknown>>,
};

export default appIslands;
