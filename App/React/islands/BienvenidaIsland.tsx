/**
 * Componente: Pagina de Bienvenida
 * Muestra un mensaje simple centrado en pantalla.
 * Caso de uso: Primera pagina de prueba.
 */

import '../styles/variables.css';
import '../styles/bienvenida.css';

interface BienvenidaIslandProps {
    titulo?: string;
}

export const BienvenidaIsland = ({titulo = 'Bienvenido a Glory React'}: BienvenidaIslandProps): JSX.Element => {
    return (
        <div className="contenedorBienvenida">
            <h1 className="tituloBienvenida">{titulo}</h1>
        </div>
    );
};

export default BienvenidaIsland;
