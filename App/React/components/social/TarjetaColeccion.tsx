/*
 * Componente: TarjetaColeccion — Kamples (C141)
 * Tarjeta visual tipo card para mostrar una colección.
 * Botón 3 puntos en esquina superior derecha con menú contextual.
 */

import { useCallback, useState, useRef, type MouseEvent } from 'react';
import { Globe, Lock, MoreVertical, Edit3, Trash2, Link2 } from 'lucide-react';
import type { Coleccion } from '@app/types';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import '../../styles/componentes/tarjetaColeccion.css';

interface TarjetaColeccionProps {
    coleccion: Coleccion;
    onClick?: (coleccion: Coleccion) => void;
    onEditar?: (coleccion: Coleccion) => void;
    onEliminar?: (coleccion: Coleccion) => void;
    className?: string;
}

export const TarjetaColeccion = ({
    coleccion,
    onClick,
    onEditar,
    onEliminar,
    className = '',
}: TarjetaColeccionProps): JSX.Element => {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const manejarClick = useCallback(() => {
        onClick?.(coleccion);
    }, [onClick, coleccion]);

    const manejarEditar = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        setMenuAbierto(false);
        onEditar?.(coleccion);
    }, [onEditar, coleccion]);

    const manejarEliminar = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        setMenuAbierto(false);
        onEliminar?.(coleccion);
    }, [onEliminar, coleccion]);

    /* C161: Copiar enlace siempre disponible para todas las colecciones */
    const manejarCopiarEnlace = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        setMenuAbierto(false);
        const url = `${window.location.origin}/coleccion/${coleccion.id}/`;
        copiarAlPortapapeles(url);
    }, [coleccion.id]);

    const toggleMenu = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        setMenuAbierto(prev => !prev);
    }, []);

    /* Cerrar menú al hacer click fuera */
    const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

    const imagenPortada = coleccion.imagenUrl || obtenerImagenColorPorTexto(coleccion.nombre);
    const clases = ['tarjetaColeccion', className].filter(Boolean).join(' ');

    return (
        <div className={clases} onClick={manejarClick} role="button" tabIndex={0} onBlur={cerrarMenu}>
            <div className="tarjetaColeccionPortada">
                <img src={imagenPortada} alt={coleccion.nombre} loading="lazy" />
                {/* C161: Botón 3 puntos siempre visible — copiar enlace + acciones propietario */}
                <div className="tarjetaColeccionMenuContenedor" ref={menuRef}>
                    <button
                        className="tarjetaColeccionMenuBtn"
                        onClick={toggleMenu}
                        type="button"
                        aria-label="Opciones de colección"
                    >
                        <MoreVertical size={16} />
                    </button>
                    {menuAbierto && (
                        <div className="tarjetaColeccionMenu">
                            <button className="tarjetaColeccionMenuItem" onClick={manejarCopiarEnlace} type="button">
                                <Link2 size={14} />
                                <span>Copiar enlace</span>
                            </button>
                            {onEditar && (
                                <button className="tarjetaColeccionMenuItem" onClick={manejarEditar} type="button">
                                    <Edit3 size={14} />
                                    <span>Editar</span>
                                </button>
                            )}
                            {onEliminar && (
                                <button className="tarjetaColeccionMenuItem tarjetaColeccionMenuItemPeligro" onClick={manejarEliminar} type="button">
                                    <Trash2 size={14} />
                                    <span>Eliminar</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="tarjetaColeccionInfo">
                <div className="tarjetaColeccionCabecera">
                    <span className="tarjetaColeccionNombre">{coleccion.nombre}</span>
                    <span className="tarjetaColeccionVisibilidad" title={coleccion.esPublica ? 'Pública' : 'Privada'}>
                        {coleccion.esPublica ? <Globe size={12} /> : <Lock size={12} />}
                    </span>
                </div>
                <span className="tarjetaColeccionMeta">
                    {coleccion.totalSamples} sample{coleccion.totalSamples !== 1 ? 's' : ''}
                    {coleccion.usuario && ` · @${coleccion.usuario.username}`}
                </span>
            </div>
        </div>
    );
};

export default TarjetaColeccion;
