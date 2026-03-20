/**
 * App Islands Registry
 *
 * This file is the main entry point for your React components.
 * Add your islands here.
 */

import {Component, type ReactNode, type ErrorInfo} from 'react';
import {registerAppBlocks} from './blocks/index';
import {registrarServiceWorker} from '@app/utils/registrarServiceWorker';

// Importar Islas
import {BienvenidaIsland} from './islands/BienvenidaIsland';
import {LoginIsland} from './islands/auth/LoginIsland';
import {RegistroIsland} from './islands/auth/RegistroIsland';
import {PerfilIsland} from './islands/social/PerfilIsland';
import {EditarPerfilIsland} from './islands/social/EditarPerfilIsland';
import {ShowcaseIsland} from './islands/dev/ShowcaseIsland';
/* SamplesIsland eliminado: explorar ya no existe como página */
import {SampleDetalleIsland} from './islands/samples/SampleDetalleIsland';
import {InicioIsland} from './islands/feed/InicioIsland';
import {FeedSamplesIsland} from './islands/feed/FeedSamplesIsland';
import {LibreriaIsland} from './islands/libreria/LibreriaIsland';
import {DescargasIsland} from './islands/libreria/DescargasIsland';
import {FavoritosIsland} from './islands/libreria/FavoritosIsland';
import {ReproductorIsland} from './islands/player/ReproductorIsland';
import {DescubrirIsland} from './islands/discover/DescubrirIsland';
import {ColeccionesIsland} from './islands/discover/ColeccionesIsland';
import {MensajesIsland} from './islands/mensajes/MensajesIsland';
import {ChatIsland} from './islands/mensajes/ChatIsland';
import {DashboardCreadorIsland} from './islands/admin/DashboardCreadorIsland';
import {AdminPanelIsland} from './islands/admin/AdminPanelIsland';
import {PlanesIsland} from './islands/planes/PlanesIsland';
import {PreciosLandingIsland} from './islands/planes/PreciosLandingIsland';
import {ColeccionDetalleIsland} from './islands/colecciones/ColeccionDetalleIsland';
import {ComunidadIsland} from './islands/comunidad/ComunidadIsland';
import {PublicacionIsland} from './islands/social/PublicacionIsland';
import {ExploradorIsland} from './islands/explorador/ExploradorIsland';
import {CancionDetalleIsland} from './islands/canciones/CancionDetalleIsland';
import {ExplorarCancionesIsland} from './islands/canciones/ExplorarCancionesIsland';
import {RelacionDetalleIsland} from './islands/canciones/RelacionDetalleIsland';
import {ArtistaDetalleIsland} from './islands/canciones/ArtistaDetalleIsland';
import {PrivacidadIsland} from './islands/legal/PrivacidadIsland';
import {TerminosIsland} from './islands/legal/TerminosIsland';
import {BlogPageIsland} from './islands/blog/BlogPageIsland';
import {LayoutPrincipal} from '@app/components/layout/LayoutPrincipal';
import {InicializadorAuth} from '@app/components/auth/InicializadorAuth';

// Register blocks
registerAppBlocks();

/* QK86: Registrar Service Worker de push notifications */
registrarServiceWorker();

/*
 * QL98: Error boundary raíz para capturar errores de render en AppProvider.
 * Sin esto, un error en InicializadorAuth/LayoutPrincipal mata React silenciosamente
 * dejando la pantalla en negro sin diagnóstico visible.
 */
class RootErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
    state: {error: Error | null} = { error: null };

    static getDerivedStateFromError(error: Error): {error: Error} {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[Kamples] Error de render en AppProvider:', error, info.componentStack);
    }

    render(): ReactNode {
        if (this.state.error) {
            return (
                <div style={{ padding: '32px', color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: '#1a1a1a', height: '100vh', overflow: 'auto' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Error de render</h2>
                    <pre>{this.state.error.message}</pre>
                    <pre style={{ color: '#9ca3af', fontSize: '12px', marginTop: '12px' }}>{this.state.error.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * AppProvider
 * Envuelve TODAS las islas en el layout base de Kamples (sidebar + topbar + reproductor).
 * Glory lo inyecta automáticamente via hydration.tsx → wrapWithProviders.
 * InicializadorAuth verifica la sesión de WordPress al montar la app.
 */
export const AppProvider: React.ComponentType<{children: React.ReactNode}> = ({ children }) => (
    <RootErrorBoundary>
        <InicializadorAuth>
            <LayoutPrincipal>{children}</LayoutPrincipal>
        </InicializadorAuth>
    </RootErrorBoundary>
);

/**
 * App Islands Registry
 * Provide your island components here.
 * La clave es el nombre usado en PHP (PageManager::reactPage)
 */
// sentinel-disable-next-line objeto-mutable-exportado — registry de islands intencional; se puebla desde PHP
export const appIslands: Record<string, React.ComponentType<Record<string, unknown>>> = {
    BienvenidaIsland: BienvenidaIsland as React.ComponentType<Record<string, unknown>>,
    LoginIsland: LoginIsland as React.ComponentType<Record<string, unknown>>,
    RegistroIsland: RegistroIsland as React.ComponentType<Record<string, unknown>>,
    PerfilIsland: PerfilIsland as React.ComponentType<Record<string, unknown>>,
    EditarPerfilIsland: EditarPerfilIsland as React.ComponentType<Record<string, unknown>>,
    ShowcaseIsland: ShowcaseIsland as React.ComponentType<Record<string, unknown>>,
    SampleDetalleIsland: SampleDetalleIsland as React.ComponentType<Record<string, unknown>>,
    InicioIsland: InicioIsland as React.ComponentType<Record<string, unknown>>,
    FeedSamplesIsland: FeedSamplesIsland as React.ComponentType<Record<string, unknown>>,
    LibreriaIsland: LibreriaIsland as React.ComponentType<Record<string, unknown>>,
    DescargasIsland: DescargasIsland as React.ComponentType<Record<string, unknown>>,
    FavoritosIsland: FavoritosIsland as React.ComponentType<Record<string, unknown>>,
    ReproductorIsland: ReproductorIsland as React.ComponentType<Record<string, unknown>>,
    DescubrirIsland: DescubrirIsland as React.ComponentType<Record<string, unknown>>,
    ColeccionesIsland: ColeccionesIsland as React.ComponentType<Record<string, unknown>>,
    MensajesIsland: MensajesIsland as React.ComponentType<Record<string, unknown>>,
    ChatIsland: ChatIsland as React.ComponentType<Record<string, unknown>>,
    DashboardCreadorIsland: DashboardCreadorIsland as React.ComponentType<Record<string, unknown>>,
    PlanesIsland: PlanesIsland as React.ComponentType<Record<string, unknown>>,
    PreciosLandingIsland: PreciosLandingIsland as React.ComponentType<Record<string, unknown>>,
    ColeccionDetalleIsland: ColeccionDetalleIsland as React.ComponentType<Record<string, unknown>>,
    ComunidadIsland: ComunidadIsland as React.ComponentType<Record<string, unknown>>,
    PublicacionIsland: PublicacionIsland as React.ComponentType<Record<string, unknown>>,
    AdminPanelIsland: AdminPanelIsland as React.ComponentType<Record<string, unknown>>,
    ExploradorIsland: ExploradorIsland as React.ComponentType<Record<string, unknown>>,
    CancionDetalleIsland: CancionDetalleIsland as React.ComponentType<Record<string, unknown>>,
    ExplorarCancionesIsland: ExplorarCancionesIsland as React.ComponentType<Record<string, unknown>>,
    RelacionDetalleIsland: RelacionDetalleIsland as React.ComponentType<Record<string, unknown>>,
    ArtistaDetalleIsland: ArtistaDetalleIsland as React.ComponentType<Record<string, unknown>>,
    PrivacidadIsland: PrivacidadIsland as React.ComponentType<Record<string, unknown>>,
    TerminosIsland: TerminosIsland as React.ComponentType<Record<string, unknown>>,
    BlogPageIsland: BlogPageIsland as React.ComponentType<Record<string, unknown>>,
};

export default appIslands;
