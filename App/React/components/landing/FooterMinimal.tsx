import React from 'react';

/*
 * FooterMinimal: Footer ultra minimalista con texto centrado.
 * Solo muestra el copyright y nombre de la empresa.
 */

interface FooterMinimalProps {
    id?: string;
}

export const FooterMinimal: React.FC<FooterMinimalProps> = ({id = 'footer'}) => {
    const anioActual = new Date().getFullYear();

    return (
        <footer id={id} className="footerMinimal">
            <p className="footerTexto">© {anioActual} Nakomi. Todos los derechos reservados.</p>
        </footer>
    );
};

export default FooterMinimal;
