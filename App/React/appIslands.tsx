/**
 * App Islands Registry — Cresta Campers
 *
 * Registro de todas las islas React del proyecto.
 */

import {registerAppBlocks} from './blocks/index';

// Islas principales
import {HomeIsland} from './islands/HomeIsland';
import {FlotaIsland} from './islands/FlotaIsland';
import {VehiculoDetalleIsland} from './islands/VehiculoDetalleIsland';
import {ReservarIsland} from './islands/ReservarIsland';
import {ConfirmacionIsland} from './islands/ConfirmacionIsland';
import {ContactoIsland} from './islands/ContactoIsland';
import {SobreNosotrosIsland} from './islands/SobreNosotrosIsland';

// Islas legales
import {CondicionesIsland} from './islands/CondicionesIsland';
import {PrivacidadIsland} from './islands/PrivacidadIsland';
import {AvisoLegalIsland} from './islands/AvisoLegalIsland';
import {CookiesIsland} from './islands/CookiesIsland';
import {PanelIsland} from './islands/PanelIsland';
import {BienvenidaIsland} from './islands/BienvenidaIsland';

registerAppBlocks();

export const AppProvider: React.ComponentType<{children: React.ReactNode}> | undefined = undefined;

/**
 * App Islands Registry
 * Provide your island components here.
 * La clave es el nombre usado en PHP (PageManager::reactPage)
 */
export const appIslands: Readonly<Record<string, React.ComponentType<Record<string, unknown>>>> = Object.freeze({
    HomeIsland: HomeIsland as React.ComponentType<Record<string, unknown>>,
    FlotaIsland: FlotaIsland as React.ComponentType<Record<string, unknown>>,
    VehiculoDetalleIsland: VehiculoDetalleIsland as React.ComponentType<Record<string, unknown>>,
    ReservarIsland: ReservarIsland as React.ComponentType<Record<string, unknown>>,
    ConfirmacionIsland: ConfirmacionIsland as React.ComponentType<Record<string, unknown>>,
    ContactoIsland: ContactoIsland as React.ComponentType<Record<string, unknown>>,
    SobreNosotrosIsland: SobreNosotrosIsland as React.ComponentType<Record<string, unknown>>,
    CondicionesIsland: CondicionesIsland as React.ComponentType<Record<string, unknown>>,
    PrivacidadIsland: PrivacidadIsland as React.ComponentType<Record<string, unknown>>,
    AvisoLegalIsland: AvisoLegalIsland as React.ComponentType<Record<string, unknown>>,
    CookiesIsland: CookiesIsland as React.ComponentType<Record<string, unknown>>,
    PanelIsland: PanelIsland as React.ComponentType<Record<string, unknown>>,
    BienvenidaIsland: BienvenidaIsland as React.ComponentType<Record<string, unknown>>,
});

export default appIslands;
