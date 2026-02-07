/**
 * Componente: ServiciosIsland
 * Página completa de Servicios con grid de tarjetas 1:1, filtrado y búsqueda.
 */
import React, {useState, useMemo} from 'react';
import '../styles/variables.css';
import './ServiciosIsland.css';
import {Header} from '../components/layout/Header';
import {Footer} from '../components/layout/Footer';
import {BarraFiltros} from '../components/servicios/BarraFiltros';
import {GridServicios} from '../components/servicios/GridServicios';
import {ServicioData} from '../components/servicios/TarjetaServicio';

/* Categorías disponibles para filtrado */
const CATEGORIAS = [
    {id: 'todos', label: 'Todos'},
    {id: 'web', label: 'Diseño Web'},
    {id: 'software', label: 'Software'},
    {id: 'ai', label: 'Inteligencia Artificial'},
    {id: 'branding', label: 'Branding'}
];

/* Datos de servicios - TO-DO: Integrar con backend o CMS */
const SERVICIOS_DATA: ServicioData[] = [
    {
        id: '1',
        titulo: 'Diseño de Sitios Web',
        descripcion: 'Sitios web únicos y memorables que destacan tu marca y conectan con tu audiencia.',
        imagen: 'https://placehold.co/600x600/e8f0e6/151411?text=Web+Design',
        categorias: ['web', 'branding'],
        link: '/servicios/diseno-web'
    },
    {
        id: '2',
        titulo: 'Desarrollo de Aplicaciones',
        descripcion: 'Software a medida para automatizar y optimizar tus procesos de negocio.',
        imagen: 'https://placehold.co/600x600/e6e8f0/151411?text=Apps',
        categorias: ['software'],
        link: '/servicios/desarrollo-apps'
    },
    {
        id: '3',
        titulo: 'Agentes de IA',
        descripcion: 'Implementación de asistentes inteligentes y automatización con IA.',
        imagen: 'https://placehold.co/600x600/f0e6ee/151411?text=AI+Agents',
        categorias: ['ai', 'software'],
        link: '/servicios/agentes-ia'
    },
    {
        id: '4',
        titulo: 'Identidad de Marca',
        descripcion: 'Creación de identidad visual que comunica la esencia de tu negocio.',
        imagen: 'https://placehold.co/600x600/f0ece6/151411?text=Branding',
        categorias: ['branding'],
        link: '/servicios/branding'
    },
    {
        id: '5',
        titulo: 'E-commerce',
        descripcion: 'Tiendas online optimizadas para convertir visitantes en clientes.',
        imagen: 'https://placehold.co/600x600/e6f0ed/151411?text=E-commerce',
        categorias: ['web', 'software'],
        link: '/servicios/ecommerce'
    },
    {
        id: '6',
        titulo: 'Chatbots Personalizados',
        descripcion: 'Bots conversacionales que mejoran la atención al cliente 24/7.',
        imagen: 'https://placehold.co/600x600/f0e8e6/151411?text=Chatbots',
        categorias: ['ai'],
        link: '/servicios/chatbots'
    },
    {
        id: '7',
        titulo: 'Diseño UX/UI',
        descripcion: 'Interfaces intuitivas centradas en la experiencia del usuario.',
        imagen: 'https://placehold.co/600x600/e6e9f0/151411?text=UX+UI',
        categorias: ['web', 'software'],
        link: '/servicios/ux-ui'
    },
    {
        id: '8',
        titulo: 'Automatización de Procesos',
        descripcion: 'Herramientas que eliminan tareas repetitivas y optimizan flujos de trabajo.',
        imagen: 'https://placehold.co/600x600/eef0e6/151411?text=Automation',
        categorias: ['software', 'ai'],
        link: '/servicios/automatizacion'
    },
    {
        id: '9',
        titulo: 'Consultoría Digital',
        descripcion: 'Estrategia y asesoramiento para tu transformación digital.',
        imagen: 'https://placehold.co/600x600/f0e6f0/151411?text=Consulting',
        categorias: ['branding'],
        link: '/servicios/consultoria'
    }
];

interface ServiciosIslandProps {
    titulo?: string;
}

export const ServiciosIsland = ({titulo = 'Nuestros Servicios'}: ServiciosIslandProps): JSX.Element => {
    const [categoriaActiva, setCategoriaActiva] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    /* Filtrado de servicios según categoría y búsqueda */
    const serviciosFiltrados = useMemo(() => {
        return SERVICIOS_DATA.filter(servicio => {
            /* Filtro por categoría */
            const coincideCategoria = categoriaActiva === 'todos' || servicio.categorias.includes(categoriaActiva);

            /* Filtro por búsqueda */
            const terminoBusqueda = busqueda.toLowerCase().trim();
            const coincideBusqueda = terminoBusqueda === '' || servicio.titulo.toLowerCase().includes(terminoBusqueda) || servicio.descripcion.toLowerCase().includes(terminoBusqueda);

            return coincideCategoria && coincideBusqueda;
        });
    }, [categoriaActiva, busqueda]);

    return (
        <>
            <Header />
            <main className="serviciosMain" id="paginaServicios">
                <section className="serviciosHero">
                    <div className="heroContenido">
                        <div>
                            <h1 className="heroTitulo">
                                Servicios.
                            </h1>
                        </div>

                        <div className="heroDescripcion">
                            <p>Ofrecemos servicios integrales que combinan creatividad y tecnología para transformar tu visión en productos digitales excepcionales.</p>
                        </div>
                    </div>
                </section>

                <section className="serviciosContenido">
                    <div className="serviciosContenedor">
                        <BarraFiltros categorias={CATEGORIAS} categoriaActiva={categoriaActiva} busqueda={busqueda} onCategoriaChange={setCategoriaActiva} onBusquedaChange={setBusqueda} />
                        <GridServicios servicios={serviciosFiltrados} />
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default ServiciosIsland;
