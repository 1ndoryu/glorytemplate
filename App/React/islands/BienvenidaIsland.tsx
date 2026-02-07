/**
 * Componente: Pagina de Bienvenida (Hero)
 * Implementacion del diseno estilo Anthropic.
 */

import React from 'react';
import '../styles/variables.css';
import '../styles/bienvenida.css';
import {RandomImage} from '../components/home/RandomImage';
import {Header} from '../components/layout/Header';
import {Button} from '../components/ui/Button';

interface BienvenidaIslandProps {
    titulo?: string;
    bgImage?: string;
}

export const BienvenidaIsland = ({titulo, bgImage = ''}: BienvenidaIslandProps): JSX.Element => {
    return (
        <>
            <Header />
            <main className="seccionHero">
                <div className="heroContenido">
                    <div>
                        <h1 className="heroTitulo">
                            AI <span>research</span> and <span>products</span> that put safety at the frontier
                        </h1>
                    </div>

                    <div className="heroDescripcion">
                        <p>AI will have a vast impact on the world. Glory is a public benefit corporation dedicated to securing its benefits and mitigating its risks.</p>
                        <Button variante="primario" tamano="mediano" className="heroBoton">Try Glory</Button>
                    </div>
                </div>

                <div className="heroImagenFondo">
                    <RandomImage image={bgImage} />
                </div>
            </main>
        </>
    );
};

export default BienvenidaIsland;
