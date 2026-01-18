import React, {useState} from 'react';
import {LogoHero, Navegacion, GridPortafolio, ModalProyecto, Proyecto} from '../components/landing';

/*
 * LandingIsland: Isla principal del landing page.
 * Compone todos los componentes del landing y maneja el estado del modal.
 *
 * Los proyectos usan imagenes placeholder de Glory/assets/images/colors
 * hasta que se integren imagenes reales.
 */

/* Datos de ejemplo para el portafolio */
const proyectosEjemplo: Proyecto[] = [
    {
        id: 'mabuhay-viajes',
        nombre: 'Mabuhay Viajes',
        categoria: 'Agencia de Viajes',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/3e0929e463d330ab184b5ed72f789695.jpg',
        descripcion: 'Plataforma web para agencia de viajes especializada en destinos asiáticos. Diseño inmersivo con reservas en línea y blog de destinos.'
    },
    {
        id: 'entretenedores',
        nombre: 'Entretenedores',
        categoria: 'Entretenimiento',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/530f61e8227db3cd4a86fc065efa7b34.jpg',
        descripcion: 'Directorio de artistas y animadores para eventos. Sistema de búsqueda avanzada y gestión de contrataciones.'
    },
    {
        id: 'cosmo-revenue',
        nombre: 'Cosmo Revenue',
        categoria: 'Fintech',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/717112c35b85f1c1b646356957a5ff41.jpg',
        descripcion: 'Dashboard de gestión financiera con análisis en tiempo real. Integración con múltiples pasarelas de pago.'
    },
    {
        id: 'guille-chatbots',
        nombre: 'Guille Chatbots',
        categoria: 'IA & Automatización',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/54a33543c3431992e587bb2cd730f934.jpg',
        descripcion: 'Solución de chatbots con inteligencia artificial para atención al cliente. Integración con WhatsApp y redes sociales.'
    },
    {
        id: 'material-padel',
        nombre: 'Material de Pádel',
        categoria: 'E-commerce',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/d355e400bdebb98eeed272abbe82071a.jpg',
        descripcion: 'Tienda online especializada en equipamiento de pádel. Catálogo extenso con filtros avanzados y comparador de productos.'
    },
    {
        id: 'autoescuela-cad',
        nombre: 'Autoescuela CAD',
        categoria: 'Educación',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/7cdb31d0f794ee63c20b4d19211e4f85.jpg',
        descripcion: 'Plataforma de formación vial con tests online, seguimiento de progreso y reserva de clases prácticas.'
    }
];

interface LandingIslandProps {
    mostrarPanel?: boolean;
}

export const LandingIsland: React.FC<LandingIslandProps> = ({mostrarPanel = false}) => {
    const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const abrirModal = (proyecto: Proyecto) => {
        setProyectoSeleccionado(proyecto);
        setModalVisible(true);
    };

    const cerrarModal = () => {
        setModalVisible(false);
        /*
         * Delay para limpiar el proyecto despues de la animacion de salida
         * Esto evita que el contenido desaparezca antes de que termine la transicion
         */
        setTimeout(() => {
            setProyectoSeleccionado(null);
        }, 250);
    };

    return (
        <div id="contenedorLanding" className="contenedorLanding">
            <Navegacion mostrarPanel={mostrarPanel} />

            <LogoHero subtitulo="Desarrollo web & aplicaciones" />

            <GridPortafolio proyectos={proyectosEjemplo} onSeleccionarProyecto={abrirModal} />

            <ModalProyecto proyecto={proyectoSeleccionado} visible={modalVisible} onCerrar={cerrarModal} />
        </div>
    );
};

export default LandingIsland;
