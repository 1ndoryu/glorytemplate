import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

export const EjemploGestionPedidos: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Mis Pedidos">
            {/* Encabezado de tabla simulado */}
            <div className="pedidoTablaHeader">
                <span className="columnaNombre">Proyecto</span>
                <span className="columnaEstado">Estado</span>
                <span className="columnaProgreso">Progreso</span>
            </div>

            {/* Fila 1 */}
            <div className="pedidoFila">
                <div className="celdaInfo">
                    <div className="iconoProyecto amarillo">
                        <span className="inicial">W</span>
                    </div>
                    <div className="textoInfo">
                        <span className="nombreProyecto">Diseño Web Premium</span>
                        <span className="nombreCliente">TechVentures</span>
                    </div>
                </div>
                <div className="celdaEstado">
                    <span className="estadoBadge enProgreso">Activo</span>
                </div>
                <div className="celdaProgreso">
                    <div className="barraFina">
                        <div className="progresoFino" style={{width: '65%'}}></div>
                    </div>
                </div>
            </div>

            {/* Fila 2 */}
            <div className="pedidoFila">
                <div className="celdaInfo">
                    <div className="iconoProyecto azul">
                        <span className="inicial">E</span>
                    </div>
                    <div className="textoInfo">
                        <span className="nombreProyecto">E-commerce Pro</span>
                        <span className="nombreCliente">StyleStore</span>
                    </div>
                </div>
                <div className="celdaEstado">
                    <span className="estadoBadge revision">Revisión</span>
                </div>
                <div className="celdaProgreso">
                    <div className="barraFina">
                        <div className="progresoFino" style={{width: '90%'}}></div>
                    </div>
                </div>
            </div>

            {/* Fila 3 */}
            <div className="pedidoFila">
                <div className="celdaInfo">
                    <div className="iconoProyecto verde">
                        <span className="inicial">A</span>
                    </div>
                    <div className="textoInfo">
                        <span className="nombreProyecto">App Corporativa</span>
                        <span className="nombreCliente">GlobalSys</span>
                    </div>
                </div>
                <div className="celdaEstado">
                    <span className="estadoBadge planificacion">Inicio</span>
                </div>
                <div className="celdaProgreso">
                    <div className="barraFina">
                        <div className="progresoFino" style={{width: '15%'}}></div>
                    </div>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
