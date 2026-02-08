/**
 * Componente: SolucionesIsland
 * Página landing de soluciones con cards que enlazan a sub-páginas.
 */
import React from 'react';
import '../styles/variables.css';
import './SolucionesIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionContacto} from '../components/home/SeccionContacto';

interface SolucionesIslandProps {
    titulo?: string;
}

interface Solucion {
    titulo: string;
    descripcion: string;
    enlace: string;
    etiqueta: string;
}

const SOLUCIONES: Solucion[] = [
    {
        titulo: 'Hosting Administrado',
        descripcion: 'Infraestructura de alto rendimiento con soporte 24/7, backups automáticos y optimización continua para que tu sitio nunca se detenga.',
        enlace: '/soluciones/hosting',
        etiqueta: 'Desde $29/mes'
    },
    {
        titulo: 'Servidores VPS',
        descripcion: 'Control total sobre tu entorno de servidor. Recursos dedicados, escalabilidad instantánea y root access para proyectos que necesitan potencia.',
        enlace: '/soluciones/vps',
        etiqueta: 'Desde $79/mes'
    },
    {
        titulo: 'Agentes de IA',
        descripcion: 'Automatiza procesos de negocio con agentes inteligentes personalizados. Chatbots, asistentes y pipelines de ML integrados directamente en tu producto.',
        enlace: '/soluciones/agentes-ia',
        etiqueta: 'Consultar'
    }
];

/* Tarjeta de solución individual */
const TarjetaSolucion: React.FC<{solucion: Solucion}> = ({solucion}) => (
    <a href={solucion.enlace} className="tarjetaSolucion">
        <div className="solucionContenido">
            <span className="solucionEtiqueta">{solucion.etiqueta}</span>
            <h3 className="solucionTitulo">{solucion.titulo}</h3>
            <p className="solucionDescripcion">{solucion.descripcion}</p>
        </div>
        <span className="solucionEnlace">Explorar →</span>
    </a>
);

export const SolucionesIsland = ({titulo = 'Soluciones'}: SolucionesIslandProps): JSX.Element => {
    return (
        <LayoutPagina className="solucionesMain" id="paginaSoluciones">
            {/* Hero */}
            <section className="solucionesHero">
                <div className="solucionesHeroContenido">
                    <div>
                        <h1 className="solucionesHeroTitulo">{titulo}</h1>
                    </div>
                    <div className="solucionesHeroDescripcion">
                        <p>
                            Infraestructura, herramientas y tecnología de punta para potenciar
                            tu negocio digital. Soluciones escalables diseñadas para crecer con vos.
                        </p>
                    </div>
                </div>
            </section>

            {/* Grid de soluciones */}
            <section className="solucionesContenido">
                <div className="solucionesContenedor">
                    <div className="solucionesGrid">
                        {SOLUCIONES.map(sol => (
                            <TarjetaSolucion key={sol.titulo} solucion={sol} />
                        ))}
                    </div>
                </div>
            </section>

            <SeccionContacto />
        </LayoutPagina>
    );
};

export default SolucionesIsland;
