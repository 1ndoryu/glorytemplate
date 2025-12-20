/*
 * ListaProyectos
 * Componente para mostrar y gestionar la lista de proyectos
 */

import {Folder, Plus} from 'lucide-react';
import {DashboardPanel} from '../../shared/DashboardPanel';
import {SeccionEncabezado} from '../SeccionEncabezado';
import type {Proyecto} from '../../../types/dashboard';

interface ListaProyectosProps {
    proyectos: Proyecto[];
    onCrearProyecto: () => void;
    onSeleccionarProyecto?: (id: number) => void;
    proyectoSeleccionadoId?: number | null;
}

interface ProyectoItemProps {
    proyecto: Proyecto;
    activo: boolean;
    onClick: () => void;
}

function ProyectoItem({proyecto, activo, onClick}: ProyectoItemProps): JSX.Element {
    return (
        <div className={`proyectoItem ${activo ? 'proyectoItemActivo' : ''}`} onClick={onClick}>
            <div className="proyectoItemContenido">
                <span className="proyectoNombre">{proyecto.nombre}</span>
                <div className="proyectoMeta">
                    <span className={`etiquetaPrioridad etiqueta${proyecto.prioridad.charAt(0).toUpperCase() + proyecto.prioridad.slice(1)}`}>{proyecto.prioridad.toUpperCase()}</span>
                    <span>•</span>
                    <span>{proyecto.estado}</span>
                </div>
            </div>

            <div className="proyectoProgreso" data-estado={proyecto.estado}>
                <div className="barraProgresoFondo">
                    <div className="barraProgresoRelleno" style={{width: `${proyecto.progreso || 0}%`}} />
                </div>
            </div>
        </div>
    );
}

export function ListaProyectos({proyectos, onCrearProyecto, onSeleccionarProyecto, proyectoSeleccionadoId}: ListaProyectosProps): JSX.Element {
    return (
        <>
            <SeccionEncabezado
                titulo="Proyectos"
                icono={<Folder size={12} />}
                acciones={
                    <button className="botonIcono" onClick={onCrearProyecto} title="Nuevo Proyecto">
                        <Plus size={14} />
                    </button>
                }
            />
            <DashboardPanel>
                <div className="listaProyectos">
                    {proyectos.map(proyecto => (
                        <ProyectoItem key={proyecto.id} proyecto={proyecto} activo={proyecto.id === proyectoSeleccionadoId} onClick={() => onSeleccionarProyecto?.(proyecto.id)} />
                    ))}

                    {proyectos.length === 0 && (
                        <div className="estadoVacio">
                            <span>No hay proyectos activos</span>
                            <button className="botonTexto" onClick={onCrearProyecto}>
                                + Crear primer proyecto
                            </button>
                        </div>
                    )}
                </div>
            </DashboardPanel>
        </>
    );
}
