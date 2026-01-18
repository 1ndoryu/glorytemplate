import React, {useState} from 'react';
import {LogoHero, Navegacion, GridPortafolio, IntroManifiesto, GridServicios, GridResenas, SeccionEcosistema, SeccionBlog, FooterMinimal, SeccionProceso, Proyecto, PaginaServicios, PaginaProyecto} from '../components/landing';
import {ModalAuth} from '../components/auth';
import {PanelCliente} from '../components/panel/PanelCliente';
import {useNavegacionLanding, useModal} from '../hooks';
import {proyectosEjemplo, serviciosEjemplo, resenasEjemplo, articulosEjemplo} from '../data/mocks';

/*
 * LandingIsland: Isla principal del landing page.
 * Componente orquestador que compone todas las secciones del landing.
 * La lógica de estado se delega a hooks especializados (useNavegacionLanding, useModal).
 */

interface LandingIslandProps {
    mostrarPanel?: boolean;
}

/* Interfaz para el objeto global inyectado por WP */
interface GloryAuthGlobal {
    isLoggedIn: boolean;
    user: string | null;
    nonce: string;
}

declare global {
    interface Window {
        GLORY_AUTH?: GloryAuthGlobal;
    }
}

export const LandingIsland: React.FC<LandingIslandProps> = ({mostrarPanel = false}) => {
    const {vistaActual, datosVista, handleNavegar, setVistaActual} = useNavegacionLanding('landing');
    const authModal = useModal<void>();

    // Inicializar estado basado en la inyección de WP o el prop
    const estadoInicialLogin = window.GLORY_AUTH?.isLoggedIn || false;
    const [usuarioLogueado, setUsuarioLogueado] = useState(estadoInicialLogin);

    /* Handler para abrir página de proyecto */
    const abrirProyecto = (proyecto: Proyecto) => {
        setVistaActual('proyecto', proyecto);
    };

    const handleLoginExitoso = () => {
        setUsuarioLogueado(true);
    };

    const handleLogout = () => {
        setUsuarioLogueado(false);
        setVistaActual('landing');
    };

    if (usuarioLogueado || mostrarPanel) {
        // En Fase 3, si hay login, la vista principal ES el panel.
        // Solo cambiamos si explícitamente se pide otra vista (aunque por ahora login = panel)
        return <PanelCliente onLogout={handleLogout} />;
    }

    return (
        <div id="contenedorLanding" className="contenedorLanding">
            <Navegacion mostrarPanel={false} onNavegar={handleNavegar} onLoginClick={authModal.abrir} />

            {vistaActual === 'landing' ? (
                <>
                    <LogoHero />

                    <GridPortafolio proyectos={proyectosEjemplo} onSeleccionarProyecto={abrirProyecto} columnas={3} cantidadVisible={3} />

                    <IntroManifiesto />

                    <SeccionProceso />

                    <GridServicios servicios={serviciosEjemplo} modo="grid" />

                    <GridResenas resenas={resenasEjemplo} />

                    <SeccionEcosistema />

                    <SeccionBlog articulos={articulosEjemplo} />
                </>
            ) : vistaActual === 'servicios' ? (
                <PaginaServicios servicios={serviciosEjemplo} />
            ) : (
                <PaginaProyecto proyecto={datosVista} onVolver={() => handleNavegar('proyectos')} />
            )}

            <FooterMinimal />

            <ModalAuth visible={authModal.visible} onCerrar={authModal.cerrar} onLoginExitoso={handleLoginExitoso} />
        </div>
    );
};

export default LandingIsland;
