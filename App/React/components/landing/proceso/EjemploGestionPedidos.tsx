import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

export const EjemploGestionPedidos: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Mis Pedidos">
            <div className="pedidoItem">
                <div className="pedidoInfo">
                    <span className="pedidoNombre">Diseño Web Premium</span>
                    <span className="pedidoCliente">Cliente: TechVentures</span>
                </div>
                <div className="pedidoMeta">
                    <span className="pedidoFecha">Entrega: 25 Ene</span>
                    <span className="pedidoEstado pedidoEnProgreso">En progreso</span>
                </div>
                <div className="pedidoProgreso">
                    <div className="pedidoProgresoBar" style={{width: '65%'}}></div>
                </div>
            </div>
            <div className="pedidoItem">
                <div className="pedidoInfo">
                    <span className="pedidoNombre">E-commerce Avanzado</span>
                    <span className="pedidoCliente">Cliente: StyleStore</span>
                </div>
                <div className="pedidoMeta">
                    <span className="pedidoFecha">Entrega: 02 Feb</span>
                    <span className="pedidoEstado pedidoRevision">En revisión</span>
                </div>
                <div className="pedidoProgreso">
                    <div className="pedidoProgresoBar" style={{width: '90%'}}></div>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
