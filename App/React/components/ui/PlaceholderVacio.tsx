/*
 * PlaceholderVacio: Componente para mostrar estados vacíos con estilo.
 * Reutilizable en cualquier vista que necesite indicar ausencia de contenido.
 */

import React from 'react';
import {LucideIcon} from 'lucide-react';
import {Boton} from './Boton';

interface PlaceholderVacioProps {
    icono: LucideIcon;
    titulo: string;
    subtitulo?: string;
    textoBoton?: string;
    onAccion?: () => void;
}

export const PlaceholderVacio: React.FC<PlaceholderVacioProps> = ({icono: Icono, titulo, subtitulo, textoBoton, onAccion}) => {
    return (
        <div className="placeholderServicios">
            <Icono className="placeholderIcon" size={32} />
            <div className="placeholderTexto">
                <p className="placeholderTitulo">{titulo}</p>
                {subtitulo && <p className="placeholderSubtitulo">{subtitulo}</p>}
            </div>
            {textoBoton && onAccion && (
                <Boton variante="outline" onClick={onAccion}>
                    {textoBoton}
                </Boton>
            )}
        </div>
    );
};

export default PlaceholderVacio;
