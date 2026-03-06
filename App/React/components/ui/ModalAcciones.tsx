/*
 * Componente: ModalAcciones — D7
 * Contenedor unificado de acciones para todos los modales.
 * Reemplaza: filtrosAcciones, editarAcciones, modalColeccionAcciones.
 * Los botones hijos ocupan 100% del ancho disponible (flex: 1 via CSS).
 */

import type { ReactNode } from 'react';
import '../../styles/componentes/modalAcciones.css';

interface ModalAccionesProps {
    children: ReactNode;
    className?: string;
}

export const ModalAcciones = ({
    children,
    className = '',
}: ModalAccionesProps): JSX.Element => (
    <div className={`modalAcciones ${className}`}>
        {children}
    </div>
);

export default ModalAcciones;
