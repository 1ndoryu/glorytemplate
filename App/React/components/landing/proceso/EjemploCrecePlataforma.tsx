import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

/*
 * EjemploCrecePlataforma: Muestra estadísticas de crecimiento y nivel.
 */
export const EjemploCrecePlataforma: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Estadísticas">
            <div className="ejemploStats">
                <div className="statFila">
                    <span className="statLabel">Ingresos este mes</span>
                    <span className="statValor positivo">+24%</span>
                </div>
                <div className="statBarraContenedor">
                    <div className="statBarraProgreso" style={{width: '75%'}}></div>
                </div>
                <div className="statSeparador"></div>
                <div className="statBadgeNivel">
                    <div className="nivelIconoBg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="nivelIcono">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <div className="nivelInfo">
                        <span className="nivelTitulo">Vendedor Nivel 2</span>
                        <span className="nivelSub">Próximo nivel: 85%</span>
                    </div>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
