import React, {useState} from 'react';
import {LogoHero, Navegacion, GridPortafolio, ModalProyecto, IntroManifiesto, GridServicios, GridResenas, SeccionEcosistema, SeccionBlog, FooterMinimal, Proyecto, Servicio, Resena, ArticuloBlog} from '../components/landing';

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

/* Datos de ejemplo para los servicios */
const serviciosEjemplo: Servicio[] = [
    {
        id: 'diseno-web',
        nombre: 'Diseño Web Premium',
        descripcionCorta: 'Sitios web únicos con atención al detalle',
        precioDesde: 2500,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/abc01eec86b754be8299e488ec926831.jpg'
    },
    {
        id: 'aplicaciones',
        nombre: 'Aplicaciones a Medida',
        descripcionCorta: 'Software personalizado para tu negocio',
        precioDesde: 5000,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/bc2241ad92399a7545184ea5856f3fc6.jpg'
    },
    {
        id: 'ecommerce',
        nombre: 'E-commerce Avanzado',
        descripcionCorta: 'Tiendas online optimizadas para conversión',
        precioDesde: 3500,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/993245e6afae9f50fd5ecf85fcda0039.jpg'
    },
    {
        id: 'branding',
        nombre: 'Branding Digital',
        descripcionCorta: 'Identidad visual que perdura',
        precioDesde: 1500,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/dd5d72fb4ce22a0ab1364e25710c3012.jpg'
    },
    {
        id: 'automatizacion',
        nombre: 'Automatización',
        descripcionCorta: 'Flujos inteligentes que optimizan tu tiempo',
        precioDesde: 2000,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/8b7a956d29e3938e91f819ad5fcc5ee0.jpg'
    },
    {
        id: 'consultoria',
        nombre: 'Consultoría Tech',
        descripcionCorta: 'Asesoría estratégica para tu transformación digital',
        precioDesde: 800,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/855f6e6bce7563e2dc7c767ba16667ed.jpg'
    },
    {
        id: 'mantenimiento',
        nombre: 'Mantenimiento',
        descripcionCorta: 'Soporte continuo y actualizaciones',
        precioDesde: 500,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/6d846dc52e919270849287a1bb6ac4e9.jpg'
    },
    {
        id: 'seo',
        nombre: 'SEO & Analytics',
        descripcionCorta: 'Posicionamiento y análisis de datos',
        precioDesde: 1200,
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/71957e4101580f3a8a6838b5bf5fbc24.jpg'
    }
];

/* Datos de ejemplo para las reseñas */
const resenasEjemplo: Resena[] = [
    {
        id: 'resena-1',
        texto: 'Trabajar con Nakomi fue una experiencia increíble. Entendieron nuestra visión desde el primer día y la ejecutaron con un nivel de detalle que superó todas nuestras expectativas.',
        autor: 'Diana Hu',
        cargo: 'CEO, TechVentures',
        proyecto: '/proyectos/techventures'
    },
    {
        id: 'resena-2',
        texto: 'La mejor inversión que hemos hecho. Nuestra plataforma pasó de ser básica a una experiencia premium que nuestros usuarios aman. El ROI fue inmediato.',
        autor: 'Carlos Mendez',
        cargo: 'Fundador, StartupLab',
        proyecto: '/proyectos/startuplab'
    },
    {
        id: 'resena-3',
        texto: 'El equipo de Nakomi no solo entrega código, entrega soluciones. Su enfoque en la calidad y el detalle es exactamente lo que necesitábamos.',
        autor: 'María González',
        cargo: 'Directora Digital, Innovate Corp'
    },
    {
        id: 'resena-4',
        texto: 'Desde el rediseño con Nakomi, nuestra tasa de conversión aumentó un 340%. No son solo diseñadores, son estrategas de negocio.',
        autor: 'Roberto Silva',
        cargo: 'CMO, E-commerce Plus',
        proyecto: '/proyectos/ecommerce-plus'
    },
    {
        id: 'resena-5',
        texto: 'Profesionalismo absoluto. Cumplieron cada deadline y la comunicación fue impecable durante todo el proyecto.',
        autor: 'Ana Torres',
        cargo: 'Product Manager, FinTech Solutions'
    },
    {
        id: 'resena-6',
        texto: 'Nakomi transformó nuestra idea en realidad. El producto final es exactamente lo que soñábamos, pero mejor.',
        autor: 'Luis Ramírez',
        cargo: 'Co-fundador, AppVenture',
        proyecto: '/proyectos/appventure'
    }
];

/* Datos de ejemplo para el blog */
const articulosEjemplo: ArticuloBlog[] = [
    {
        id: 'articulo-1',
        titulo: 'El futuro del diseño web: tendencias que dominarán 2026',
        extracto: 'Exploramos las tecnologías emergentes y patrones de diseño que están redefiniendo la experiencia digital moderna.',
        categoria: 'Diseño',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/47252f8c0c7f5dae7657ca6eed05eeca.jpg',
        fecha: '15 Ene 2026',
        enlace: '/blog/futuro-diseno-web-2026'
    },
    {
        id: 'articulo-2',
        titulo: 'Cómo la IA está transformando el desarrollo de software',
        extracto: 'Desde la generación de código hasta la automatización de pruebas, la inteligencia artificial cambia las reglas del juego.',
        categoria: 'Tecnología',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/c5f3015667280079a5a6299c0ac16e83.jpg',
        fecha: '12 Ene 2026',
        enlace: '/blog/ia-desarrollo-software'
    },
    {
        id: 'articulo-3',
        titulo: 'Guía completa: Optimización de rendimiento en React',
        extracto: 'Técnicas avanzadas para crear aplicaciones React ultra-rápidas y escalables.',
        categoria: 'Desarrollo',
        imagen: '/wp-content/themes/glory/Glory/assets/images/colors/3450083cb428563c30f4544d5e5a7e82.jpg',
        fecha: '8 Ene 2026',
        enlace: '/blog/optimizacion-react'
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

            <LogoHero />

            <GridPortafolio proyectos={proyectosEjemplo} onSeleccionarProyecto={abrirModal} columnas={3} cantidadVisible={3} />

            <IntroManifiesto />

            <GridServicios servicios={serviciosEjemplo} modo="grid" />

            <GridResenas resenas={resenasEjemplo} />

            <SeccionEcosistema />

            <SeccionBlog articulos={articulosEjemplo} />

            <FooterMinimal />

            <ModalProyecto proyecto={proyectoSeleccionado} visible={modalVisible} onCerrar={cerrarModal} />
        </div>
    );
};

export default LandingIsland;
