/**
 * App Islands Registry
 *
 * Registro central de todas las islas React del proyecto.
 * La clave es el nombre usado en PHP (PageManager::reactPage / ReactIslands::render).
 */

import {registerAppBlocks} from './blocks/index';

/* Importar Islas */
import {BienvenidaIsland} from './islands/BienvenidaIsland';
import {ServiciosIsland} from './islands/ServiciosIsland';
import {ServicioIndividualIsland} from './islands/ServicioIndividualIsland';
import {ProyectosIsland} from './islands/ProyectosIsland';
import {ProyectoIndividualIsland} from './islands/ProyectoIndividualIsland';
import {NosotrosIsland} from './islands/NosotrosIsland';
import {BlogIsland} from './islands/BlogIsland';
import {SolucionesIsland} from './islands/SolucionesIsland';
import {SolucionPlaceholderIsland} from './islands/SolucionPlaceholderIsland';
import {ContactoIsland} from './islands/ContactoIsland';
import {PanelIsland} from './islands/PanelIsland';
import {BlogSingleIsland} from './islands/BlogSingleIsland';

registerAppBlocks();

/**
 * AppProvider (Optional)
 * Export a component here to wrap the entire application (e.g. for Context)
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> | undefined = undefined;

/**
 * App Islands Registry
 * La clave debe coincidir con el nombre usado en PHP.
 */
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {
    BienvenidaIsland: BienvenidaIsland as React.ComponentType<Record<string, unknown>>,
    ServiciosIsland: ServiciosIsland as React.ComponentType<Record<string, unknown>>,
    ServicioIndividualIsland: ServicioIndividualIsland as React.ComponentType<Record<string, unknown>>,
    ProyectosIsland: ProyectosIsland as React.ComponentType<Record<string, unknown>>,
    ProyectoIndividualIsland: ProyectoIndividualIsland as React.ComponentType<Record<string, unknown>>,
    NosotrosIsland: NosotrosIsland as React.ComponentType<Record<string, unknown>>,
    BlogIsland: BlogIsland as React.ComponentType<Record<string, unknown>>,
    SolucionesIsland: SolucionesIsland as React.ComponentType<Record<string, unknown>>,
    SolucionPlaceholderIsland: SolucionPlaceholderIsland as React.ComponentType<Record<string, unknown>>,
    ContactoIsland: ContactoIsland as React.ComponentType<Record<string, unknown>>,
    PanelIsland: PanelIsland as React.ComponentType<Record<string, unknown>>,
    BlogSingleIsland: BlogSingleIsland as React.ComponentType<Record<string, unknown>>
};

export default appIslands;
