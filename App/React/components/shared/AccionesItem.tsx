/*
 * AccionesItem
 * Componente reutilizable para botones de accion inline en items
 * Usado en habitos, tareas y proyectos
 */

import {Settings, Trash2} from 'lucide-react';
import type {ReactNode} from 'react';

interface AccionItemConfig {
    id: string;
    icono: ReactNode;
    titulo: string;
    peligroso?: boolean;
    onClick: () => void;
}

interface AccionesItemProps {
    /* Lista de acciones a mostrar */
    acciones?: AccionItemConfig[];
    /* Mostrar acciones por defecto (configurar y eliminar) */
    mostrarConfigurar?: boolean;
    mostrarEliminar?: boolean;
    /* Callbacks para acciones por defecto */
    onConfigurar?: () => void;
    onEliminar?: () => void;
    /* Clase adicional para el contenedor */
    className?: string;
}

export function AccionesItem({acciones, mostrarConfigurar = false, mostrarEliminar = false, onConfigurar, onEliminar, className = ''}: AccionesItemProps): JSX.Element {
    /* Construir lista de acciones */
    const accionesFinales: AccionItemConfig[] = [];

    if (acciones) {
        accionesFinales.push(...acciones);
    }

    /* Agregar acciones por defecto si se solicitan */
    if (mostrarConfigurar && onConfigurar) {
        accionesFinales.push({
            id: 'configurar',
            icono: <Settings size={12} />,
            titulo: 'Configurar',
            onClick: onConfigurar
        });
    }

    if (mostrarEliminar && onEliminar) {
        accionesFinales.push({
            id: 'eliminar',
            icono: <Trash2 size={12} />,
            titulo: 'Eliminar',
            peligroso: true,
            onClick: onEliminar
        });
    }

    if (accionesFinales.length === 0) {
        return <></>;
    }

    return (
        <div className={`accionesItem ${className}`.trim()} onClick={e => e.stopPropagation()}>
            {accionesFinales.map(accion => (
                <button key={accion.id} className={`botonIcono ${accion.peligroso ? 'botonPeligro' : ''}`} onClick={accion.onClick} title={accion.titulo} type="button">
                    {accion.icono}
                </button>
            ))}
        </div>
    );
}

export type {AccionItemConfig, AccionesItemProps};
