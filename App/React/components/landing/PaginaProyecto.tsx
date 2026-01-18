import React, {useEffect} from 'react';
import {Proyecto} from './TarjetaProyecto';
import {Boton} from '../ui';

/*
 * PaginaProyecto: Visualización detallada de un proyecto (Case Study).
 * Diseño ajustado a referencia DashDigital:
 * - Intro tipo Manifiesto
 * - Layout 2 columnas (Aside + Content)
 * - Botón volver estilo pill 'VISIT'
 */

interface PaginaProyectoProps {
    proyecto: Proyecto | null;
    onVolver: () => void;
}

export const PaginaProyecto: React.FC<PaginaProyectoProps> = ({proyecto, onVolver}) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [proyecto]);

    if (!proyecto) return null;

    return (
        <article className="proyectoDetalle">
            {/* Titulo Manifiesto (Grande) */}
            <div className="proyectoManifiestoContenedor">
                <h1 className="proyectoManifiestoTexto">{proyecto.descripcion ? proyecto.descripcion.toUpperCase() : 'PROYECTO DIGITAL ENFOCADO EN LA EXPERIENCIA DE USUARIO.'}</h1>
            </div>

            {/* Grid Principal (2 Columnas) */}
            <div className="proyectoGridPrincipal">
                {/* Columna Izquierda (Aside) */}
                <aside className="proyectoColumnaLateral">
                    <div className="bloqueInfo">
                        <h3 className="tituloInfo">RECONOCIMIENTOS</h3>
                        <p className="textoInfo">
                            AWWWARDS SITE OF THE DAY
                            <br />
                            CSS DESIGN AWARDS
                        </p>
                    </div>

                    <div className="bloqueInfo">
                        <Boton onClick={onVolver} variante="solid" pill>
                            VOLVER
                        </Boton>
                    </div>
                </aside>

                {/* Columna Derecha (Contenido) */}
                <div className="proyectoColumnaContenido">
                    <section className="bloqueContenido">
                        <h2 className="tituloSeccion">EL DESAFÍO</h2>
                        <p className="parrafoContenido">
                            {proyecto.nombre} se acercó a nosotros con el reto de crear una identidad de marca y un nuevo sitio web de comercio electrónico que los catapultara a la cima de su industria.
                            <br />
                            <br />
                            Nuestro enfoque se centró en ofrecer una experiencia centrada en el usuario, fluida y atractiva, atendiendo a las necesidades y deseos de su público objetivo mientras optimizábamos el impacto comercial.
                        </p>
                    </section>

                    <section className="bloqueContenido">
                        <h2 className="tituloSeccion">LA SOLUCIÓN</h2>
                        <p className="parrafoContenido">Nuestra estrategia se centró en una experiencia de usuario intuitiva. Emprendimos una fase integral de descubrimiento para comprender el comportamiento de los clientes, lo que informó nuestras decisiones de diseño y funcionalidad.</p>
                    </section>

                    <div className="proyectoImagenSeparador">
                        <img src={proyecto.imagen} alt="Vista del proyecto" />
                    </div>
                </div>
            </div>
        </article>
    );
};

export default PaginaProyecto;
