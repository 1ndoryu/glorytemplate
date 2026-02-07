/**
 * Componente: Pagina de Bienvenida (Hero)
 * Implementacion del diseno estilo Anthropic.
 */

import React from 'react';
import '../styles/variables.css';
import '../styles/bienvenida.css';
import {SeccionHero} from '../components/home/SeccionHero';
import {SeccionClientes} from '../components/home/SeccionClientes';
import {SeccionTestimonios} from '../components/home/SeccionTestimonios';
import {SeccionServicios} from '../components/home/SeccionServicios';
import {SeccionBlog} from '../components/home/SeccionBlog';
import {SeccionContacto} from '../components/home/SeccionContacto';
import {SeccionShowcase} from '../components/home/SeccionShowcase';
import {Header} from '../components/layout/Header';
import {Footer} from '../components/layout/Footer';

interface BienvenidaIslandProps {
    titulo?: string;
    bgImage?: string;
}

export const BienvenidaIsland = ({titulo, bgImage = ''}: BienvenidaIslandProps): JSX.Element => {
    return (
        <>
            <Header />
            <main className="mainContainer">
                <SeccionHero />
                <SeccionClientes />
                <SeccionShowcase />
                <SeccionTestimonios />
                <SeccionServicios />
                <SeccionContacto />
                <SeccionBlog />
            </main>
            <Footer />
        </>
    );
};

export default BienvenidaIsland;
