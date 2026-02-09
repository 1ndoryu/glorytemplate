/**
 * Componente: NosotrosIsland
 * Página "Sobre Nosotros" con misión, equipo, marcas y testimonios.
 */
import React from 'react';
import '../styles/variables.css';
import './NosotrosIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionTestimonios} from '../components/home/SeccionTestimonios';
import {SeccionHeader} from '../components/ui/SeccionHeader';
import {SeccionClientes} from '../components/home/SeccionClientes';
import {SeccionContacto} from '../components/home/SeccionContacto';
import {MIEMBROS_DATA} from '../data/miembros';
import {Miembro} from '../types/contenido';

interface NosotrosIslandProps {
    titulo?: string;
}

/* Tarjeta de miembro del equipo */
const TarjetaMiembro: React.FC<{miembro: Miembro}> = ({miembro}) => (
    <article className="tarjetaMiembro">
        <div className="miembroAvatar">
            <img src={miembro.avatar} alt={miembro.nombre} loading="lazy" />
        </div>
        <div className="miembroInfo">
            <h3 className="miembroNombre">{miembro.nombre}</h3>
            <span className="miembroCargo">{miembro.cargo}</span>
            <p className="miembroBio">{miembro.bio}</p>
            <div className="miembroRedes">
                {miembro.linkedin && (
                    <a href={miembro.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        LinkedIn
                    </a>
                )}
                {miembro.github && (
                    <a href={miembro.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        GitHub
                    </a>
                )}
            </div>
        </div>
    </article>
);

export const NosotrosIsland = ({titulo = 'Sobre Nosotros'}: NosotrosIslandProps): JSX.Element => {
    return (
        <LayoutPagina className="nosotrosMain" id="paginaNosotros">
            {/* Hero */}
            <section className="nosotrosHero">
                <div className="nosotrosHeroContenido">
                    <div className="nosotrosHeroTexto">
                        <h1 className="nosotrosHeroTitulo">{titulo}</h1>
                    </div>
                    <div className="nosotrosHeroDescripcion">
                        <p>Somos un equipo multidisciplinario que combina diseño, tecnología e inteligencia artificial para crear experiencias digitales que generan impacto real en los negocios de nuestros clientes.</p>
                    </div>
                </div>
            </section>

            {/* Misión / Valores */}
            <section className="nosotrosMision">
                <div className="nosotrosMisionContenedor">
                    <div className="misionGrid">
                        <div className="misionItem">
                            <h3 className="misionItemTitulo">Nuestra Misión</h3>
                            <p className="misionItemTexto">Democratizar el acceso a soluciones digitales de alto nivel, combinando diseño premium con tecnología de vanguardia para que cada negocio pueda competir al más alto nivel.</p>
                        </div>
                        <div className="misionItem">
                            <h3 className="misionItemTitulo">Nuestro Enfoque</h3>
                            <p className="misionItemTexto">Creemos en la intersección entre estética y funcionalidad. Cada proyecto es una oportunidad de crear algo que no solo se vea increíble, sino que también genere resultados medibles.</p>
                        </div>
                        <div className="misionItem">
                            <h3 className="misionItemTitulo">Nuestros Valores</h3>
                            <p className="misionItemTexto">Transparencia, excelencia técnica y obsesión por los detalles guían cada decisión que tomamos, desde el primer wireframe hasta el deploy final.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Equipo */}
            <section className="nosotrosEquipo">
                <div className="nosotrosEquipoContenedor">
                    <SeccionHeader titulo="El Equipo" />
                    <div className="equipoGrid">
                        {MIEMBROS_DATA.map(miembro => (
                            <TarjetaMiembro key={miembro.id} miembro={miembro} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Marcas / Clientes - Reutiliza el mismo componente del home para consistencia */}
            <SeccionClientes />

            {/* Testimonios reutilizado del home */}
            <SeccionTestimonios />

            {/* Contacto */}
            <SeccionContacto />
        </LayoutPagina>
    );
};

export default NosotrosIsland;
