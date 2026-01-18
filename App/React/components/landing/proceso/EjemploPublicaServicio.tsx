import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

/*
 * EjemploPublicaServicio: Muestra un placeholder simple invitando a publicar.
 */
export const EjemploPublicaServicio: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Panel">
            <div className="ejemploPlaceholder">
                <div className="placeholderIcono">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </div>
                <span className="placeholderTexto">Publica tu primer servicio</span>
                <div className="ejemploBotonNeutro">Publicar</div>
            </div>
        </VentanaEjemplo>
    );
};
