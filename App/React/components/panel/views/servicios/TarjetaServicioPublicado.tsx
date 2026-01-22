/*
 * TarjetaServicioPublicado: Tarjeta para servicios que el proveedor ofrece.
 * Usa MenuContextual reutilizable para acciones.
 */

import React from 'react';
import {Edit2, Trash2, ToggleLeft, ToggleRight, Clock, DollarSign} from 'lucide-react';
import {MenuContextual, AccionMenu} from '../../../ui/MenuContextual';
import {ServicioPublicado} from '../../../../data/types/servicio';

interface TarjetaServicioPublicadoProps {
    servicio: ServicioPublicado;
    onEditar?: (servicio: ServicioPublicado) => void;
    onEliminar?: (id: string) => void;
    onToggleActivo?: (id: string) => void;
}

export const TarjetaServicioPublicado: React.FC<TarjetaServicioPublicadoProps> = ({servicio, onEditar, onEliminar, onToggleActivo}) => {
    /* Construir acciones del menú contextual */
    const acciones: AccionMenu[] = [
        {
            id: 'editar',
            label: 'Editar',
            icono: <Edit2 size={14} />,
            onClick: () => onEditar?.(servicio)
        },
        {
            id: 'toggle',
            label: servicio.activo ? 'Desactivar' : 'Activar',
            icono: servicio.activo ? <ToggleLeft size={14} /> : <ToggleRight size={14} />,
            onClick: () => onToggleActivo?.(servicio.id)
        },
        {
            id: 'eliminar',
            label: 'Eliminar',
            icono: <Trash2 size={14} />,
            onClick: () => onEliminar?.(servicio.id),
            peligroso: true,
            separadorAntes: true
        }
    ];

    return (
        <article className={`tarjetaServicioPublicado ${!servicio.activo ? 'inactivo' : ''}`}>
            <div className="servicioPublicadoImagen">
                <img src={servicio.imagenUrl} alt={servicio.nombre} />
                {!servicio.activo && <span className="badgeInactivo">Inactivo</span>}
            </div>

            <div className="servicioPublicadoContenido">
                <div className="servicioPublicadoHeader">
                    <h3 className="servicioPublicadoNombre">{servicio.nombre}</h3>
                    <MenuContextual acciones={acciones} ariaLabel={`Opciones de ${servicio.nombre}`} />
                </div>

                <p className="servicioPublicadoDescripcion">{servicio.descripcion}</p>

                <div className="servicioPublicadoMeta">
                    <span className="servicioPublicadoPrecio">
                        <DollarSign size={14} />${servicio.precio}
                    </span>
                    <span className="servicioPublicadoTiempo">
                        <Clock size={14} />
                        {servicio.tiempoEntregaDias} días
                    </span>
                    <span className={`servicioPublicadoCategoria categoria-${servicio.categoria}`}>{servicio.categoria}</span>
                </div>
            </div>
        </article>
    );
};

export default TarjetaServicioPublicado;
