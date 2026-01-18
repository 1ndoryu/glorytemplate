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
                <span className="columnaEntrega">Entrega</span>
                <span className="columnaAcciones"></span>
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
                <div className="celdaEntrega">
                    <span className="tiempoEntrega">14 d</span>
                </div>
                <div className="celdaAcciones">
                    <button className="accionBoton" title="Pausar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    </button>
                    <button className="accionBoton" title="Mensaje">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>
                    <button className="accionBoton accionPeligro" title="Cancelar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
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
                <div className="celdaEntrega">
                    <span className="tiempoEntrega">2 d</span>
                </div>
                <div className="celdaAcciones">
                    <button className="accionBoton" title="Pausar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    </button>
                    <button className="accionBoton" title="Mensaje">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>
                    <button className="accionBoton accionPeligro" title="Cancelar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
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
                <div className="celdaEntrega">
                    <span className="tiempoEntrega">--</span>
                </div>
                <div className="celdaAcciones">
                    <button className="accionBoton" title="Pausar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                        </svg>
                    </button>
                    <button className="accionBoton" title="Mensaje">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>
                    <button className="accionBoton accionPeligro" title="Cancelar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
