import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

export const EjemploListaServicios: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Servicios">
            <div className="ejemploLista">
                <div className="ejemploItem">
                    <span className="ejemploTexto">Diseño Web Premium</span>
                    <svg className="ejemploCheck" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div className="ejemploItem ejemploItemInactivo">
                    <span className="ejemploTexto">E-commerce Avanzado</span>
                </div>
                <div className="ejemploItem ejemploItemInactivo">
                    <span className="ejemploTexto">Aplicación a Medida</span>
                </div>
                <div className="ejemploItem ejemploItemInactivo">
                    <span className="ejemploTexto">Branding Digital</span>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
