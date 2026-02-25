/*
 * Componente: TarjetaColeccion — Kamples (C141)
 * Tarjeta visual tipo card para mostrar una colección.
 * Botón 3 puntos en esquina superior derecha — usa MenuContextual (mismo que el resto de la app).
 * El botón está FUERA del <a> para evitar navegación accidental al hacer click.
 */

import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { Globe, Lock, MoreVertical, Edit3, Trash2, Link2 } from 'lucide-react';
import type { Coleccion } from '@app/types';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { EnlaceNavegacion } from '../ui/EnlaceNavegacion';
import { MenuContextual } from '../ui/MenuContextual';
import { BotonBase } from '../ui/BotonBase';
import '../../styles/componentes/tarjetaColeccion.css';

interface TarjetaColeccionProps {
    coleccion: Coleccion;
    onEditar?: (coleccion: Coleccion) => void;
    onEliminar?: (coleccion: Coleccion) => void;
    className?: string;
}

export const TarjetaColeccion = ({
    coleccion,
    onEditar,
    onEliminar,
    className = '',
}: TarjetaColeccionProps): JSX.Element => {
    const [menu, setMenu] = useState<{ abierto: boolean; x: number; y: number }>({
        abierto: false, x: 0, y: 0,
    });

    const abrirMenu = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setMenu({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenu = useCallback(() => {
        setMenu(prev => ({ ...prev, abierto: false }));
    }, []);

    const itemsMenu = useMemo(() => {
        const items = [
            {
                id: 'copiar-enlace',
                etiqueta: 'Copiar enlace',
                icono: <Link2 size={16} />,
                separadorDespues: true,
                onClick: () => {
                    copiarAlPortapapeles(`${window.location.origin}/coleccion/${coleccion.id}/`);
                },
            },
        ];

        if (onEditar) {
            items.push({
                id: 'editar',
                etiqueta: 'Editar',
                icono: <Edit3 size={16} />,
                separadorDespues: false,
                onClick: () => onEditar(coleccion),
            });
        }

        if (onEliminar) {
            items.push({
                id: 'eliminar',
                etiqueta: 'Eliminar',
                icono: <Trash2 size={16} />,
                separadorDespues: false,
                onClick: () => onEliminar(coleccion),
            } as typeof items[0]);
        }

        return items;
    }, [coleccion, onEditar, onEliminar]);

    const imagenPortada = coleccion.imagenUrl || obtenerImagenColorPorTexto(coleccion.nombre);
    const clases = ['tarjetaColeccion', className].filter(Boolean).join(' ');

    return (
        <div className={clases}>
            <EnlaceNavegacion href={`/coleccion/${coleccion.id}/`} className="tarjetaColeccionEnlace">
                <div className="tarjetaColeccionPortada">
                    <img src={imagenPortada} alt={coleccion.nombre} loading="lazy" />
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
            </EnlaceNavegacion>

            {/* Botón 3 puntos — FUERA del <a> para evitar navegación al hacer click */}
            <div className="tarjetaColeccionMenuContenedor">
                <BotonBase variante="ghost"
                    className="tarjetaColeccionMenuBtn"
                    onClick={abrirMenu}
                    type="button"
                    aria-label="Opciones de colección"
                >
                    <MoreVertical size={16} />
                </BotonBase>
            </div>

            <MenuContextual
                abierto={menu.abierto}
                onCerrar={cerrarMenu}
                items={itemsMenu}
                x={menu.x}
                y={menu.y}
                alinearDerecha
            />
        </div>
    );
};

export default TarjetaColeccion;
