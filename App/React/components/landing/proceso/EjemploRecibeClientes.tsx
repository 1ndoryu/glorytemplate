import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';
import {Avatar} from '../../ui';

/*
 * EjemploRecibeClientes: Muestra notificaciones de nuevos clientes y mensajes.
 */
export const EjemploRecibeClientes: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Bandeja">
            <div className="ejemploListaNotif">
                <div className="notifItem">
                    <Avatar nombre="Nueva Orden" tamano="sm" variante="personalizado" colorFondo="rgba(255, 90, 90, 0.1)" colorTexto="#FF5A5A" />
                    <div className="notifTexto">
                        <span className="notifTitulo">Nueva Orden #203</span>
                        <span className="notifSub">Hace 5 min • $450.00</span>
                    </div>
                </div>
                <div className="notifItem">
                    <Avatar nombre="Ana Mensaje" tamano="sm" variante="personalizado" colorFondo="rgba(0, 112, 243, 0.1)" colorTexto="#0070F3" />
                    <div className="notifTexto">
                        <span className="notifTitulo">Mensaje de Ana</span>
                        <span className="notifSub">Hace 20 min • Consulta</span>
                    </div>
                </div>
                <div className="notifItem">
                    <Avatar nombre="Servicio Pago" tamano="sm" variante="personalizado" colorFondo="rgba(7, 209, 29, 0.1)" colorTexto="#07d11d" />
                    <div className="notifTexto">
                        <span className="notifTitulo">Pago Recibido</span>
                        <span className="notifSub">Hace 1 hora • Verificado</span>
                    </div>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
