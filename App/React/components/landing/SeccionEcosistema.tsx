import React from 'react';
import {Boton} from '../ui';

/*
 * SeccionEcosistema: Sección hero sobre el ecosistema de aplicaciones.
 * Muestra título, descripción, botón CTA y una imagen de ancho completo.
 * Refactorizado para usar Boton del sistema UI.
 */

interface SeccionEcosistemaProps {
    titulo?: string;
    descripcion?: string;
    botonTexto?: string;
    botonEnlace?: string;
    imagen?: string;
}

export const SeccionEcosistema: React.FC<SeccionEcosistemaProps> = ({titulo = 'Ecosistema', descripcion = 'Construimos un ecosistema de aplicaciones que solucionan problemas reales. Herramientas conectadas, diseñadas para potenciar tu productividad y transformar tu negocio.', botonTexto = 'Explorar Soluciones', botonEnlace = '/soluciones', imagen = '/wp-content/themes/glory/Glory/assets/images/colors/316d9c253af59840f793c2d6d6d2f15b.jpg'}) => {
    return (
        <section id="seccionEcosistema" className="seccionEcosistema">
            <div className="ecosistemaContenedor">
                <header className="ecosistemaHeader">
                    <h2 className="ecosistemaTituloGrande">{titulo}</h2>
                    <Boton href={botonEnlace} variante="outline" tamano="sm">
                        {botonTexto}
                    </Boton>
                </header>
                <p className="ecosistemaDescripcion">{descripcion}</p>
            </div>
            <div className="ecosistemaImagenContenedor">
                <img src={imagen} alt="Ecosistema de aplicaciones Nakomi" className="ecosistemaImagen" loading="lazy" />
            </div>
        </section>
    );
};

export default SeccionEcosistema;
