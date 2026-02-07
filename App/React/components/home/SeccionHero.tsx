/**
 * Componente: SeccionHero
 * Descripcion: Seccion principal (Hero) de la pagina de bienvenida.
 * Muestra un titulo, descripcion, boton de llamada a la accion y un carrusel de imagenes.
 */

import React from 'react';
import './SeccionHero.css';
import {Button} from '../ui/Button';
import {CarruselShowcase} from './CarruselShowcase';

export const SeccionHero = (): JSX.Element => {
    return (
        <section className="seccionHero">
            <div className="heroContenido">
                <div>
                    <h1 className="heroTitulo">
                        AI <span>research</span> and <span>products</span> that put safety at the frontier
                    </h1>
                </div>

                <div className="heroDescripcion">
                    <p>AI will have a vast impact on the world. Nakomi is a public benefit corporation dedicated to securing its benefits and mitigating its risks.</p>
                    <Button variante="primario" tamano="mediano" className="heroBoton">
                        Try Nakomi
                    </Button>
                </div>
            </div>

            <div className="heroImagenFondo">
                <CarruselShowcase />
            </div>
        </section>
    );
};
