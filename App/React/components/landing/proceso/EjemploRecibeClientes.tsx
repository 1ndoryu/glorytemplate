import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

/*
 * EjemploRecibeClientes: Muestra notificaciones de nuevos clientes y mensajes.
 */
export const EjemploRecibeClientes: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Bandeja">
            <div className="ejemploListaNotif">
                <div className="notifItem">
                    <div className="notifAvatar" style={{background: 'rgba(255, 90, 90, 0.1)', color: '#FF5A5A'}}>
                        N
                    </div>
                    <div className="notifTexto">
                        <span className="notifTitulo">Nueva Orden #203</span>
                        <span className="notifSub">Hace 5 min • $450.00</span>
                    </div>
                </div>
                <div className="notifItem">
                    <div className="notifAvatar" style={{background: 'rgba(0, 112, 243, 0.1)', color: '#0070F3'}}>
                        A
                    </div>
                    <div className="notifTexto">
                        <span className="notifTitulo">Mensaje de Ana</span>
                        <span className="notifSub">Hace 20 min • Consulta</span>
                    </div>
                </div>
                <div className="notifItem">
                    <div className="notifAvatar" style={{background: 'rgba(7, 209, 29, 0.1)', color: '#07d11d'}}>
                        S
                    </div>
                    <div className="notifTexto">
                        <span className="notifTitulo">Pago Recibido</span>
                        <span className="notifSub">Hace 1 hora • Verificado</span>
                    </div>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
