/**
 * Componente: ProyectoIndividualIsland
 * Página de detalle de un proyecto individual.
 * Estructura: Hero -> Galería -> Skills -> CTA -> Relacionados -> Footer
 */
import React from 'react';
import '../styles/variables.css';
import './ProyectoIndividualIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionSkillsServicio} from '../components/servicios/SeccionSkillsServicio';
import {SeccionGaleriaServicio} from '../components/servicios/SeccionGaleriaServicio';
import {SeccionCta} from '../components/ui/SeccionCta';
import {SeccionContacto} from '../components/home/SeccionContacto';
import {PROYECTOS_DATA} from '../data/showcase';
import {Proyecto} from '../types/contenido';
import {SeccionHeader} from '../components/ui/SeccionHeader';

interface ProyectoIndividualIslandProps {
    titulo?: string;
    descripcion?: string;
    cliente?: string;
    categorias?: string;
    imagen?: string;
    slug?: string;
}

/* Tarjeta de proyecto relacionado */
const TarjetaRelacionado: React.FC<{proyecto: Proyecto}> = ({proyecto}) => (
    <a href={proyecto.link || '#'} className="proyectoRelacionadoCard">
        <div className="proyectoRelacionadoImagen">{proyecto.imagen && <img src={proyecto.imagen} alt={proyecto.titulo} loading="lazy" />}</div>
        <div className="proyectoRelacionadoInfo">
            <h4 className="proyectoRelacionadoTitulo">{proyecto.titulo}</h4>
            <span className="proyectoRelacionadoCliente">{proyecto.cliente}</span>
        </div>
    </a>
);

export const ProyectoIndividualIsland = ({titulo = 'Proyecto', descripcion = '', cliente = '', categorias = '', slug = ''}: ProyectoIndividualIslandProps): JSX.Element => {
    /* Buscar datos enriquecidos desde el contexto */
    const proyectoContexto = PROYECTOS_DATA.find(p => p.titulo.toLowerCase() === titulo.toLowerCase() || String(p.id) === slug);

    const skills = proyectoContexto?.skills || [];
    const desc = descripcion || proyectoContexto?.descripcion || '';
    const cats = categorias || (Array.isArray(proyectoContexto?.categorias) ? proyectoContexto.categorias.join(', ') : proyectoContexto?.categorias || '');

    /* Proyectos relacionados: misma categoría, excluyendo el actual */
    const categoriasArray = cats.split(',').map(c => c.trim().toLowerCase());
    const relacionados = PROYECTOS_DATA.filter(p => {
        if (String(p.id) === slug || p.titulo === titulo) return false;
        const pCats = Array.isArray(p.categorias) ? p.categorias : [p.categorias];
        return pCats.some(c => categoriasArray.includes(c.toLowerCase()));
    }).slice(0, 3);

    return (
        <LayoutPagina className="proyectoIndividualMain" id="paginaProyecto">
            {/* Hero del proyecto */}
            <section className="proyectoHero">
                <div className="proyectoHeroContenido">
                    <div className="proyectoHeroMeta">
                        <span className="proyectoHeroCliente">{cliente}</span>
                        <span className="proyectoHeroCategorias">{cats}</span>
                    </div>
                    <h1 className="proyectoHeroTitulo">{titulo}</h1>
                    {desc && <p className="proyectoHeroDescripcion">{desc}</p>}
                </div>
            </section>

            {/* Galería de imagenes con carrusel (usa colors temporales, igual que servicios) */}
            <SeccionGaleriaServicio />

            {/* Skills del proyecto */}
            {skills.length > 0 && <SeccionSkillsServicio skills={skills} />}

            {/* CTA */}
            <SeccionCta descripcion={['¿Te gustaría un proyecto similar? Estamos listos para transformar tu idea en una experiencia digital excepcional.', 'Contáctanos para discutir tu visión y hagamos algo increíble juntos.']} textoBotonPrimario="Comenzar Proyecto" linkBotonPrimario="/contacto/" textoBotonSecundario="Ver más proyectos" linkBotonSecundario="/proyectos/" />

            {/* Proyectos relacionados */}
            {relacionados.length > 0 && (
                <section className="proyectoRelacionados">
                    <div className="proyectoRelacionadosContenedor">
                        <SeccionHeader titulo="Proyectos Relacionados" />
                        <div className="proyectoRelacionadosGrid">
                            {relacionados.map(p => (
                                <TarjetaRelacionado key={p.id} proyecto={p} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <SeccionContacto />
        </LayoutPagina>
    );
};

export default ProyectoIndividualIsland;
