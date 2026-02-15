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
import {ShowcaseIsland} from './islands/dev/ShowcaseIsland';
import {SamplesIsland} from './islands/samples/SamplesIsland';
import {SampleDetalleIsland} from './islands/samples/SampleDetalleIsland';
import {InicioIsland} from './islands/feed/InicioIsland';
import {LibreriaIsland} from './islands/libreria/LibreriaIsland';
import {ReproductorIsland} from './islands/player/ReproductorIsland';
import {DescubrirIsland} from './islands/discover/DescubrirIsland';
import {NotificacionesIsland} from './islands/notificaciones/NotificacionesIsland';
import {LayoutPrincipal} from './components/layout/LayoutPrincipal';

// Register blocks
registerAppBlocks();

/**
 * AppProvider
 * Envuelve TODAS las islas en el layout base de Kamples (sidebar + topbar + reproductor).
 * Glory lo inyecta automáticamente via hydration.tsx → wrapWithProviders.
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> = ({ children }) => (
    <LayoutPrincipal>{children}</LayoutPrincipal>
);

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
    ShowcaseIsland: ShowcaseIsland as React.ComponentType<Record<string, unknown>>,
    SamplesIsland: SamplesIsland as React.ComponentType<Record<string, unknown>>,
    SampleDetalleIsland: SampleDetalleIsland as React.ComponentType<Record<string, unknown>>,
    InicioIsland: InicioIsland as React.ComponentType<Record<string, unknown>>,
    LibreriaIsland: LibreriaIsland as React.ComponentType<Record<string, unknown>>,
    ReproductorIsland: ReproductorIsland as React.ComponentType<Record<string, unknown>>,
    DescubrirIsland: DescubrirIsland as React.ComponentType<Record<string, unknown>>,
    NotificacionesIsland: NotificacionesIsland as React.ComponentType<Record<string, unknown>>,
};

export default appIslands;
