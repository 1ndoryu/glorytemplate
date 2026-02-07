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
                        Estudio creativo especializado en <span>diseño web</span> y <span>software</span>.
                    </h1>
                </div>

                <div className="heroDescripcion">
                    <p>Fusionamos diseño gráfico con ingeniería de software para crear soluciones web, aplicaciones y herramientas de inteligencia artificial que destacan por su estética y rendimiento.</p>
                    <Button variante="primario" tamano="mediano" className="heroBoton">
                        Comenzar proyecto
                    </Button>
                </div>
            </div>

            <div className="heroImagenFondo">
                <CarruselShowcase />
            </div>
        </section>
    );
};
