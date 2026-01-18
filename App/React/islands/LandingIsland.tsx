import React from 'react';
import {LogoHero, Navegacion, GridPortafolio, ModalProyecto, IntroManifiesto, GridServicios, GridResenas, SeccionEcosistema, SeccionBlog, FooterMinimal, SeccionProceso, Proyecto, PaginaServicios} from '../components/landing';
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
    const {vistaActual, handleNavegar} = useNavegacionLanding('landing');
    const modal = useModal<Proyecto>();

    return (
        <div id="contenedorLanding" className="contenedorLanding">
            <Navegacion mostrarPanel={mostrarPanel} onNavegar={handleNavegar} />

            {vistaActual === 'landing' ? (
                <>
                    <LogoHero />

                    <GridPortafolio proyectos={proyectosEjemplo} onSeleccionarProyecto={modal.abrir} columnas={3} cantidadVisible={3} />

                    <IntroManifiesto />

                    <SeccionProceso />

                    <GridServicios servicios={serviciosEjemplo} modo="grid" />

                    <GridResenas resenas={resenasEjemplo} />

                    <SeccionEcosistema />

                    <SeccionBlog articulos={articulosEjemplo} />
                </>
            ) : (
                <PaginaServicios servicios={serviciosEjemplo} />
            )}

            <FooterMinimal />

            <ModalProyecto proyecto={modal.itemSeleccionado} visible={modal.visible} onCerrar={modal.cerrar} />
        </div>
    );
};

export default LandingIsland;
