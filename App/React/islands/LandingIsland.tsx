import React from 'react';
import {LogoHero, Navegacion, GridPortafolio, IntroManifiesto, GridServicios, GridResenas, SeccionEcosistema, SeccionBlog, FooterMinimal, SeccionProceso, Proyecto, PaginaServicios, PaginaProyecto} from '../components/landing';
import {ModalAuth} from '../components/auth';
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

export const LandingIsland: React.FC<LandingIslandProps> = ({mostrarPanel = false}) => {
    const {vistaActual, datosVista, handleNavegar, setVistaActual} = useNavegacionLanding('landing');
    const authModal = useModal<void>();

    /* Handler para abrir página de proyecto */
    const abrirProyecto = (proyecto: Proyecto) => {
        setVistaActual('proyecto', proyecto);
    };

    return (
        <div id="contenedorLanding" className="contenedorLanding">
            <Navegacion mostrarPanel={mostrarPanel} onNavegar={handleNavegar} onLoginClick={authModal.abrir} />

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

            <ModalAuth visible={authModal.visible} onCerrar={authModal.cerrar} />
        </div>
    );
};

export default LandingIsland;
