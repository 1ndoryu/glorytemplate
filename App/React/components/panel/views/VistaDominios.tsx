/*
 * VistaDominios: Vista de dominios contratados del cliente.
 * Muestra los dominios registrados con información de expiración.
 */

import React from 'react';
import {ResumenDominios} from './dominios/ResumenDominios';
import {ListaDominios} from './dominios/ListaDominios';
import {usePanel} from '../../../context/PanelContext';
import {DominioContratado} from '../../../data/types/dominio';

export const VistaDominios: React.FC = () => {
    const {dominiosContratados} = usePanel();

    const handleRenovar = (dominio: DominioContratado) => {
        /* TO-DO: Implementar flujo de renovación de dominio */
        console.log('Renovar dominio:', dominio.nombre);
    };

    return (
        <div className="bloqueVista" id="vistaDominios">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Mis Dominios</h2>
                <p className="vistaSubtitulo">Gestiona tus dominios registrados y renovaciones.</p>
            </header>

            <ResumenDominios dominios={dominiosContratados} />

            <ListaDominios dominios={dominiosContratados} onRenovar={handleRenovar} />
        </div>
    );
};
