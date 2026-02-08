/**
 * Componente: BienvenidaIsland
 * Página principal (Home) del sitio.
 */

import React from 'react';
import '../styles/variables.css';
import '../styles/bienvenida.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionHero} from '../components/home/SeccionHero';
import {SeccionClientes} from '../components/home/SeccionClientes';
import {SeccionTestimonios} from '../components/home/SeccionTestimonios';
import {SeccionServicios} from '../components/home/SeccionServicios';
import {SeccionBlog} from '../components/home/SeccionBlog';
import {SeccionContacto} from '../components/home/SeccionContacto';
import {SeccionShowcase} from '../components/home/SeccionShowcase';

interface BienvenidaIslandProps {
    titulo?: string;
    bgImage?: string;
}

export const BienvenidaIsland = ({titulo, bgImage = ''}: BienvenidaIslandProps): JSX.Element => {
    return (
        <LayoutPagina className="mainContainer">
            <SeccionHero />
            <SeccionClientes />
            <SeccionShowcase />
            <SeccionTestimonios />
            <SeccionServicios />
            <SeccionContacto compacto />
            <SeccionBlog />
        </LayoutPagina>
    );
};

export default BienvenidaIsland;
