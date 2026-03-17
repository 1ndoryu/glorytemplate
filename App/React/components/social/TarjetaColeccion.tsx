/*
 * Componente: TarjetaColeccion -- Kamples (C141 + QQ75)
 * Tarjeta visual tipo card para mostrar una coleccion.
 * Boton 3 puntos en esquina superior derecha -- usa MenuContextual.
 * Boton play/preview en esquina inferior derecha de la portada.
 * El boton esta FUERA del <a> para evitar navegacion accidental al hacer click.
 */

import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import { Globe, Lock, MoreVertical, Edit3, Trash2, Link2, FolderTree, Play, Pause, Loader2 } from 'lucide-react';
import type { Coleccion } from '@app/types';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useColeccionPreview } from '@app/hooks/useColeccionPreview';
import { EnlaceNavegacion } from '../ui/EnlaceNavegacion';
import { MenuContextual } from '../ui/MenuContextual';
import { BotonBase } from '../ui/BotonBase';
import '../../styles/componentes/tarjetaColeccion.css';

interface TarjetaColeccionProps {
    coleccion: Coleccion;
    /** C388: Indica visualmente que es subcoleccion (tiene parentId) */
    esSubcoleccion?: boolean;
    onEditar?: (coleccion: Coleccion) => void;
    onEliminar?: (coleccion: Coleccion) => void;
    className?: string;
}

export const TarjetaColeccion = ({
    coleccion,
    esSubcoleccion = false,
    onEditar,
    onEliminar,
    className = '',
}: TarjetaColeccionProps): JSX.Element => {
    const [menu, setMenu] = useState<{ abierto: boolean; x: number; y: number }>({
        abierto: false, x: 0, y: 0,
    });

    /* QQ75: Preview aleatorio de la coleccion */
    const { iniciarPreview, cargando } = useColeccionPreview();
    const coleccionPreviewId = useReproductorStore(s => s.coleccionPreviewId);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const esPreviewActiva = coleccionPreviewId === coleccion.id && reproduciendo;

    const manejarPreview = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        iniciarPreview(coleccion.id);
    }, [iniciarPreview, coleccion.id]);

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
                    copiarAlPortapapeles(`${window.location.origin}/coleccion/${coleccion.slug ?? coleccion.id}/`);
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
    const clases = [
        'tarjetaColeccion',
        esSubcoleccion ? 'tarjetaColeccionSub' : '',
        esPreviewActiva ? 'tarjetaColeccionReproduciendo' : '',
        className,
    ].filter(Boolean).join(' ');

    /* Icono del boton preview segun estado */
    const iconoPreview = cargando
        ? <Loader2 size={18} className="tarjetaColeccionSpinner" />
        : esPreviewActiva
            ? <Pause size={18} />
            : <Play size={18} />;

    return (
        <div className={clases}>
            <EnlaceNavegacion href={`/coleccion/${coleccion.slug ?? coleccion.id}/`} className="tarjetaColeccionEnlace">
                <div className="tarjetaColeccionPortada">
                    <img src={imagenPortada} alt={coleccion.nombre} loading="lazy" />
                    {esSubcoleccion && (
                        <span className="tarjetaColeccionSubBadge" title="Subcoleccion">
                            <FolderTree size={12} />
                        </span>
                    )}
                    {/* QL113: Preview centrado sobre la portada */}
                    {coleccion.totalSamples > 0 && (
                        <div className="tarjetaColeccionPreviewContenedor" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <BotonBase variante="ghost"
                                className={`tarjetaColeccionPreviewBtn ${esPreviewActiva ? 'tarjetaColeccionPreviewActivo' : ''}`}
                                onClick={manejarPreview}
                                type="button"
                                aria-label={esPreviewActiva ? 'Detener preview' : 'Preview coleccion'}
                                disabled={cargando}
                            >
                                {iconoPreview}
                            </BotonBase>
                        </div>
                    )}
                </div>

                <div className="tarjetaColeccionInfo">
                    <div className="tarjetaColeccionCabecera">
                        <span className="tarjetaColeccionNombre">{coleccion.nombre}</span>
                        <span className="tarjetaColeccionVisibilidad" title={coleccion.esPublica ? 'Publica' : 'Privada'}>
                            {coleccion.esPublica ? <Globe size={12} /> : <Lock size={12} />}
                        </span>
                    </div>
                    <span className="tarjetaColeccionMeta">
                        {coleccion.totalSamples} sample{coleccion.totalSamples !== 1 ? 's' : ''}
                        {coleccion.usuario && ` · @${coleccion.usuario.username}`}
                    </span>
                </div>
            </EnlaceNavegacion>

            {/* Boton 3 puntos -- FUERA del <a> para evitar navegacion al hacer click */}
            <div className="tarjetaColeccionMenuContenedor">
                <BotonBase variante="ghost"
                    className="tarjetaColeccionMenuBtn"
                    onClick={abrirMenu}
                    type="button"
                    aria-label="Opciones de coleccion"
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