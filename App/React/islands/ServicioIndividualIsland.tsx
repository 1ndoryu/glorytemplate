/**
 * Componente: ServicioIndividualIsland
 * Página de detalle de un servicio individual.
 * Estructura: Hero -> Galeria -> CTA -> Skills -> Relacionados -> Contacto -> Footer
 * Skills y datos centralizados en data/ (DRY).
 */
import React from 'react';
import '../styles/variables.css';
import './ServicioIndividualIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionHeroServicio} from '../components/servicios/SeccionHeroServicio';
import {SeccionGaleriaServicio} from '../components/servicios/SeccionGaleriaServicio';
import {SeccionSkillsServicio} from '../components/servicios/SeccionSkillsServicio';
import {SeccionServiciosRelacionados} from '../components/servicios/SeccionServiciosRelacionados';
import {SeccionCta} from '../components/ui/SeccionCta';
import {SeccionPlanesServicio} from '../components/servicios/SeccionPlanesServicio';
import {SeccionContacto} from '../components/home/SeccionContacto';
import {SKILLS_POR_DEFECTO} from '../data/skills';

interface ServicioIndividualIslandProps {
    titulo?: string;
    descripcion?: string;
    precio_desde?: string;
    slug?: string;
}

export const ServicioIndividualIsland = ({titulo, descripcion, precio_desde, slug}: ServicioIndividualIslandProps): JSX.Element => {
    /* ID del servicio actual para excluirlo de relacionados */
    const servicioId = slug || titulo?.toLowerCase().replace(/\s+/g, '-') || '';

    return (
        <LayoutPagina className="servicioIndividualMain">
            <SeccionHeroServicio titulo={titulo} descripcion={descripcion} />
            <SeccionGaleriaServicio />
            <SeccionPlanesServicio slug={servicioId} />
            <SeccionCta descripcion={['¿Listo para llevar tu proyecto al siguiente nivel? Nuestro equipo de expertos está preparado para transformar tu visión en una solución digital de alto impacto.', 'No esperes más para destacar en el mercado. Contáctanos hoy mismo para discutir los detalles y dar el primer paso hacia el éxito de tu negocio.']} textoBotonPrimario={`Contratar desde ${precio_desde || '$997'}`} linkBotonPrimario="/contacto/" textoBotonSecundario="Contactar" linkBotonSecundario="/contacto/" />
            <SeccionSkillsServicio skills={SKILLS_POR_DEFECTO} />
            <SeccionServiciosRelacionados servicioActualId={servicioId} />
            <SeccionContacto />
        </LayoutPagina>
    );
};

export default ServicioIndividualIsland;
