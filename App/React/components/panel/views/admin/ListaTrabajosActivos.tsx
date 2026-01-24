/*
 * ListaTrabajosActivos: Muestra servicios en progreso para el admin.
 * Incluye barra de progreso, cliente asignado y acciones.
 */

import React from 'react';
import {CheckCircle, Clock, User} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {Boton} from '../../../ui/Boton';
import {Etiqueta} from '../../../ui/Etiqueta';
import {ServicioContratado} from '../../../../data/types/servicio';
import {formatearFecha} from '../../../../utils/fechaUtils';

interface ListaTrabajosActivosProps {
    trabajos: ServicioContratado[];
    onVerDetalle?: (trabajo: ServicioContratado) => void;
    onMarcarCompletado?: (trabajo: ServicioContratado) => void;
}

export const ListaTrabajosActivos: React.FC<ListaTrabajosActivosProps> = ({trabajos, onVerDetalle, onMarcarCompletado}) => {
    if (trabajos.length === 0) {
        return (
            <Tarjeta className="listaVacia">
                <Clock size={24} className="iconoVacio" />
                <p>No hay trabajos activos.</p>
            </Tarjeta>
        );
    }

    return (
        <div className="listaTrabajosActivos">
            {trabajos.map(trabajo => {
                const progreso = trabajo.progreso ?? 0;

                return (
                    <Tarjeta key={trabajo.id} className="tarjetaTrabajo">
                        <div className="trabajoEncabezado">
                            <div className="trabajoInfo">
                                <span className="trabajoNombre">{trabajo.nombre}</span>
                                <div className="trabajoMeta">
                                    <span className="trabajoCliente">
                                        <User size={12} />
                                        {trabajo.clienteId}
                                    </span>
                                    {trabajo.fechaEntregaEstimada && (
                                        <span className="trabajoFecha">
                                            <Clock size={12} />
                                            {formatearFecha(trabajo.fechaEntregaEstimada)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <Etiqueta variante={progreso >= 80 ? 'exito' : 'info'}>{progreso}%</Etiqueta>
                        </div>

                        <div className="trabajoProgreso">
                            <div className="barraProgreso">
                                <div className="barraProgresoRelleno" style={{width: `${progreso}%`}} />
                            </div>
                        </div>

                        <div className="trabajoAcciones">
                            {onVerDetalle && (
                                <Boton variante="ghost" tamano="sm" onClick={() => onVerDetalle(trabajo)}>
                                    Ver detalle
                                </Boton>
                            )}
                            {progreso >= 100 && onMarcarCompletado && (
                                <Boton variante="acento" tamano="sm" onClick={() => onMarcarCompletado(trabajo)}>
                                    <CheckCircle size={14} />
                                    Marcar entregado
                                </Boton>
                            )}
                        </div>
                    </Tarjeta>
                );
            })}
        </div>
    );
};
