import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

export const EjemploProgresoPago: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Pagos">
            <div className="ejemploProgreso">
                <div className="progresoLinea">
                    <div className="progresoPunto progresoActivo"></div>
                    <div className="progresoTramo progresoTramoActivo"></div>
                    <div className="progresoPunto progresoActivo"></div>
                    <div className="progresoTramo progresoTramoActivo"></div>
                    <div className="progresoPunto progresoActivo"></div>
                    <div className="progresoTramo"></div>
                    <div className="progresoPunto"></div>
                </div>
                <div className="progresoEtiquetas">
                    <span className="progresoEtiqueta">Pago</span>
                    <span className="progresoEtiqueta">Verificado</span>
                    <span className="progresoEtiqueta">En proceso</span>
                    <span className="progresoEtiqueta progresoEtiquetaInactiva">Entregado</span>
                </div>
            </div>
            <div className="ejemploSeparador"></div>
            <div className="ejemploEstado">
                <div className="estadoFila">
                    <svg className="estadoIcono" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="estadoTexto">Pago protegido</span>
                    <span className="estadoBadge">Activo</span>
                </div>
                <div className="estadoFila">
                    <svg className="estadoIcono" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span className="estadoTexto">Soporte prioritario</span>
                    <span className="estadoBadge">24/7</span>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
