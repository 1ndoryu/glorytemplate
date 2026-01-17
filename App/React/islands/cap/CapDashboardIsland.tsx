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

export function CapDashboardIsland({user, siteUrl}: CapDashboardIslandProps) {
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
