/*
 * ListaServiciosPublicados: Lista de servicios que el proveedor ofrece.
 * Vista de administración para gestionar servicios publicados.
 */

import React from 'react';
import {Plus, Package} from 'lucide-react';
import {ServicioPublicado} from '../../../../data/types/servicio';
import {TarjetaServicioPublicado} from './TarjetaServicioPublicado';
import {Boton, PlaceholderVacio} from '../../../ui';

interface ListaServiciosPublicadosProps {
    servicios: ServicioPublicado[];
    onCrear?: () => void;
    onEditar?: (servicio: ServicioPublicado) => void;
    onEliminar?: (id: string) => void;
    onToggleActivo?: (id: string) => void;
}

export const ListaServiciosPublicados: React.FC<ListaServiciosPublicadosProps> = ({servicios, onCrear, onEditar, onEliminar, onToggleActivo}) => {
    const serviciosActivos = servicios.filter(s => s.activo);
    const serviciosInactivos = servicios.filter(s => !s.activo);

    return (
        <div className="listaServiciosPublicados">
            <div className="listaServiciosHeader">
                <div className="listaServiciosInfo">
                    <span className="contadorServicios">
                        {serviciosActivos.length} activo{serviciosActivos.length !== 1 ? 's' : ''}
                        {serviciosInactivos.length > 0 && ` · ${serviciosInactivos.length} inactivo${serviciosInactivos.length !== 1 ? 's' : ''}`}
                    </span>
                </div>
                <Boton variante="outline" onClick={onCrear}>
                    <Plus size={16} />
                    Nuevo Servicio
                </Boton>
            </div>

            {servicios.length > 0 ? (
                <div className="gridServiciosPublicados">
                    {servicios.map(servicio => (
                        <TarjetaServicioPublicado key={servicio.id} servicio={servicio} onEditar={onEditar} onEliminar={onEliminar} onToggleActivo={onToggleActivo} />
                    ))}
                </div>
            ) : (
                <PlaceholderVacio icono={Package} titulo="No tienes servicios publicados" subtitulo="Crea tu primer servicio para empezar a recibir clientes." textoBoton="Crear mi primer servicio" onAccion={onCrear} />
            )}
        </div>
    );
};

export default ListaServiciosPublicados;
