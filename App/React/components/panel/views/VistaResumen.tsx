import React from 'react';
import {Globe, ShoppingBag} from 'lucide-react';
import {Tarjeta} from '../../ui/Tarjeta';
import {Etiqueta} from '../../ui/Etiqueta';
import {usePanel} from '../../../context/PanelContext';

export const VistaResumen: React.FC = () => {
    const {proyectos} = usePanel();
    const hasProjects = proyectos.length > 0;

    return (
        <div className="bloqueVista animate-fade-in">
            <div className="resumenHeader">
                <h2 className="resumenTitulo">Hola, Nakomi</h2>
                <p className="resumenSubtitulo">{hasProjects ? 'Estos son tus proyectos en progreso.' : 'No tienes nada pendiente.'}</p>
            </div>

            {/* Lista Proyectos o Placeholder */}
            <div className="seccionProyectos">
                <div className="listaProyectos">
                    {hasProjects ? (
                        proyectos.map(p => (
                            <Tarjeta key={p.id} interactiva className="itemProyecto">
                                <div className="proyectoInfoPrincipal">
                                    <div className="iconoProyecto">
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <h4 className="nombreProyecto">{p.nombre}</h4>
                                        <p className="servicioProyecto">{p.servicio}</p>
                                    </div>
                                </div>
                                <Etiqueta variante={p.estado === 'active' ? 'estado' : 'default'} tamano="xs">
                                    {p.estado === 'active' ? 'En Desarrollo' : 'Pendiente'}
                                </Etiqueta>
                            </Tarjeta>
                        ))
                    ) : (
                        <div className="placeholderServicios">
                            <ShoppingBag className="placeholderIcon" size={32} />
                            <div>
                                <p style={{fontWeight: 500, marginBottom: '4px'}}>Empieza tu primer proyecto</p>
                                <p style={{fontSize: '0.75rem'}}>Visita el Marketplace para contratar servicios.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
