/*
 * Componente: EstadoVacio
 * Componente centralizado para estados vacíos y carga en toda la app.
 * Reemplaza divs sueltos ".adminVacio", "colaIaVacia", etc.
 */

import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import '../../styles/componentes/estadoVacio.css';

interface EstadoVacioProps {
    mensaje: string;
    titulo?: string;
    icono?: ReactNode;
    accion?: ReactNode;
    className?: string;
}

export const EstadoVacio = ({
    mensaje,
    titulo,
    icono,
    accion,
    className = '',
}: EstadoVacioProps): JSX.Element => (
    <div className={`estadoVacioContenedor ${className}`}>
        <span className="estadoVacioIcono">
            {icono ?? <Inbox size={32} />}
        </span>
        {titulo && <h3 className="estadoVacioTitulo">{titulo}</h3>}
        <p className="estadoVacioMensaje">{mensaje}</p>
        {accion && <div className="estadoVacioAccion">{accion}</div>}
    </div>
);

export default EstadoVacio;
