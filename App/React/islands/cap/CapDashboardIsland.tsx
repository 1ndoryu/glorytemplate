/**
 * CapDashboardIsland
 *
 * Isla principal del dashboard CAP.
 * Punto de entrada que ensambla el layout y las secciones.
 */

import {CapLayout} from './components/layout';
import {SeccionCalendario, SeccionAlumnos, SeccionConfiguracion} from './components/secciones';
import {useDashboardStore} from './stores/useDashboardStore';
import './styles/index.css';

interface CapDashboardIslandProps {
    user: {
        id: number;
        name: string;
        email: string;
    };
    restNonce: string;
    restUrl: string;
    siteUrl: string;
}

/*
 * H.7 Fix: Inyectar wpApiSettings de forma global
 * Se debe hacer FUERA del componente o de forma síncrona
 * para evitar condiciones de carrera con los hooks que usan la API
 */
function initWpApiSettings(nonce: string, root: string) {
    if (!(window as any).wpApiSettings) {
        (window as any).wpApiSettings = {nonce, root};
    } else {
        (window as any).wpApiSettings.nonce = nonce;
        (window as any).wpApiSettings.root = root;
    }
}

export function CapDashboardIsland({user, restNonce, restUrl, siteUrl}: CapDashboardIslandProps) {
    /*
     * Inyección síncrona del nonce ANTES de que se ejecuten los useEffect de los hijos
     * Esto garantiza que las llamadas API tengan el nonce disponible
     */
    initWpApiSettings(restNonce, restUrl);

    const seccionActiva = useDashboardStore(state => state.seccionActiva);

    const renderContenido = () => {
        switch (seccionActiva) {
            case 'calendario':
                return <SeccionCalendario />;
            case 'alumnos':
                return <SeccionAlumnos />;
            case 'configuracion':
                return <SeccionConfiguracion userName={user.name} userEmail={user.email} />;
            default:
                return <SeccionCalendario />;
        }
    };

    return (
        <CapLayout userName={user.name} siteUrl={siteUrl}>
            {renderContenido()}
        </CapLayout>
    );
}

export default CapDashboardIsland;
