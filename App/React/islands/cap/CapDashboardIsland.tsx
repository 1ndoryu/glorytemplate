/**
 * CapDashboardIsland
 *
 * Isla principal del dashboard CAP.
 * Punto de entrada que ensambla el layout y las secciones.
 */

import {CapLayout} from './components/layout';
import {SeccionCalendario, SeccionAlumnos, SeccionConfiguracion, SeccionReportes} from './components/secciones';
import {useDashboardStore} from './stores/useDashboardStore';
import './styles/index.css';

interface CapDashboardIslandProps {
    user?: {
        id: number;
        name: string;
        email: string;
        isAdmin?: boolean;
    };
    restNonce?: string;
    restUrl?: string;
    siteUrl?: string;
    logoutUrl?: string;
}

interface CapDashboardIslandPropsCompletas {
    user: {
        id: number;
        name: string;
        email: string;
        isAdmin: boolean;
    };
    restNonce: string;
    restUrl: string;
    siteUrl: string;
    logoutUrl: string;
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

function normalizarPropsDashboard(rawProps: Record<string, unknown>): CapDashboardIslandPropsCompletas {
    const props = rawProps as CapDashboardIslandProps;
    const gloryContext = typeof window !== 'undefined' ? (window as any).GLORY_CONTEXT : null;
    const user = props.user ?? {id: 0, name: '', email: '', isAdmin: false};

    return {
        user: {
            id: typeof user.id === 'number' ? user.id : 0,
            name: typeof user.name === 'string' ? user.name : '',
            email: typeof user.email === 'string' ? user.email : '',
            isAdmin: typeof user.isAdmin === 'boolean' ? user.isAdmin : false,
        },
        restNonce: typeof props.restNonce === 'string'
            ? props.restNonce
            : (typeof gloryContext?.nonce === 'string' ? gloryContext.nonce : ''),
        restUrl: typeof props.restUrl === 'string'
            ? props.restUrl
            : (typeof gloryContext?.restUrl === 'string' ? `${gloryContext.restUrl.replace(/\/$/, '')}/cap/v1` : '/wp-json/cap/v1'),
        siteUrl: typeof props.siteUrl === 'string'
            ? props.siteUrl
            : (typeof gloryContext?.siteUrl === 'string' ? gloryContext.siteUrl : window.location.origin),
        logoutUrl: typeof props.logoutUrl === 'string'
            ? props.logoutUrl
            : '',
    };
}

export function CapDashboardIsland(rawProps: Record<string, unknown>) {
    const {user, restNonce, restUrl, siteUrl, logoutUrl} = normalizarPropsDashboard(rawProps);

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
                return <SeccionConfiguracion userName={user.name} userEmail={user.email} isAdmin={user.isAdmin} />;
            case 'reportes':
                return <SeccionReportes />;
            default:
                return <SeccionCalendario />;
        }
    };

    return (
        <CapLayout userName={user.name} siteUrl={siteUrl} logoutUrl={logoutUrl}>
            {renderContenido()}
        </CapLayout>
    );
}

export default CapDashboardIsland;
