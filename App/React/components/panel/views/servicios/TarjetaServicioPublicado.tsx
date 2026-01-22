/*
 * TarjetaServicioPublicado: Tarjeta para servicios que el proveedor ofrece.
 * Muestra info del servicio con opciones de edición.
 */

import React, {useState, useRef, useEffect} from 'react';
import {MoreVertical, Edit2, Eye, Trash2, ToggleLeft, ToggleRight, Clock, DollarSign} from 'lucide-react';
import {ServicioPublicado} from '../../../../data/types/servicio';

interface TarjetaServicioPublicadoProps {
    servicio: ServicioPublicado;
    onEditar?: (servicio: ServicioPublicado) => void;
    onEliminar?: (id: string) => void;
    onToggleActivo?: (id: string) => void;
}

export const TarjetaServicioPublicado: React.FC<TarjetaServicioPublicadoProps> = ({servicio, onEditar, onEliminar, onToggleActivo}) => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    /* Cerrar menú al hacer clic fuera */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuAbierto(false);
            }
        };

        if (menuAbierto) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuAbierto]);

    const handleAccion = (accion: string) => {
        setMenuAbierto(false);
        switch (accion) {
            case 'editar':
                onEditar?.(servicio);
                break;
            case 'eliminar':
                onEliminar?.(servicio.id);
                break;
            case 'toggle':
                onToggleActivo?.(servicio.id);
                break;
        }
    };

    return (
        <article className={`tarjetaServicioPublicado ${!servicio.activo ? 'inactivo' : ''}`}>
            <div className="servicioPublicadoImagen">
                <img src={servicio.imagenUrl} alt={servicio.nombre} />
                {!servicio.activo && <span className="badgeInactivo">Inactivo</span>}
            </div>

            <div className="servicioPublicadoContenido">
                <div className="servicioPublicadoHeader">
                    <h3 className="servicioPublicadoNombre">{servicio.nombre}</h3>
                    <div className="servicioPublicadoMenu" ref={menuRef}>
                        <button className="botonMenuServicio" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú de opciones">
                            <MoreVertical size={16} />
                        </button>

                        {menuAbierto && (
                            <div className="menuServicioPublicado">
                                <button onClick={() => handleAccion('editar')}>
                                    <Edit2 size={14} />
                                    <span>Editar</span>
                                </button>
                                <button onClick={() => handleAccion('toggle')}>
                                    {servicio.activo ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                    <span>{servicio.activo ? 'Desactivar' : 'Activar'}</span>
                                </button>
                                <div className="menuDivider"></div>
                                <button className="opcionEliminar" onClick={() => handleAccion('eliminar')}>
                                    <Trash2 size={14} />
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        )}
                    </div>
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
