/**
 * Componente: SeccionShowcase
 * Muestra proyectos destacados organizados por categoría.
 * Datos centralizados en data/showcase.ts (DRY).
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {CATEGORIAS_SHOWCASE} from '../../data/showcase';
import './SeccionShowcase.css';

export const SeccionShowcase = (): JSX.Element => {
    return (
        <section className="seccionShowcase">
            <div className="showcaseContenedor">
                <SeccionHeader titulo="Selected Work" />

                {CATEGORIAS_SHOWCASE.map((categoria, index) => (
                    <div className="showcaseFila" key={index}>
                        <div className="showcaseCategoria">
                            <h2 className="showcaseTituloCategoria">{categoria.titulo}</h2>
                        </div>

                        <div className="showcaseGridProyectos">
                            {categoria.proyectos.map(proyecto => (
                                <a key={proyecto.id} href={proyecto.link || '#'} className="proyectoCard">
                                    <div className="proyectoImagenWrapper">
                                        <img src={proyecto.imagen} alt={proyecto.titulo} className="proyectoImagen" loading="lazy" />
                                    </div>
                                    <div className="proyectoInfo">
                                        <h3 className="proyectoTitulo">
                                            {proyecto.titulo} <span className="proyectoCliente">- {proyecto.cliente}</span>
                                        </h3>
                                        <span className="proyectoSubtitulo">{proyecto.categorias}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
