/*
 * Componente: TarjetaColeccion -- Kamples (C141 + QQ75)
 * Tarjeta visual tipo card para mostrar una coleccion.
 * Boton 3 puntos en esquina superior derecha -- usa MenuContextual.
 * Boton play/preview en esquina inferior derecha de la portada.
 * El boton esta FUERA del <a> para evitar navegacion accidental al hacer click.
 */

import { Globe, Lock, MoreVertical, FolderTree, Play, Pause, Loader2, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import type { Coleccion } from '@app/types';
import type { VistaColecciones } from '@app/hooks/useLibreriaIsland';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { useTarjetaColeccion } from '@app/hooks/useTarjetaColeccion';
import { EnlaceNavegacion } from '../ui/EnlaceNavegacion';
import { MenuContextual } from '../ui/MenuContextual';
import { BotonBase } from '../ui/BotonBase';
import '../../styles/componentes/tarjetaColeccion.css';

interface TarjetaColeccionProps {
    coleccion: Coleccion;
    /** C388: Indica visualmente que es subcoleccion (tiene parentId) */
    esSubcoleccion?: boolean;
    /** QL118: Modo de visualización (cuadrícula o lista) */
    vista?: VistaColecciones;
    /** [173A-7] Nombre de la coleccion padre, visible en la meta si la coleccion es hija */
    parentNombre?: string | null;
    onEditar?: (coleccion: Coleccion) => void;
    onCombinar?: (coleccion: Coleccion) => void;
    onEliminar?: (coleccion: Coleccion) => void;
    className?: string;
}

export const TarjetaColeccion = ({
    coleccion,
    esSubcoleccion = false,
    vista = 'cuadricula',
    parentNombre = null,
    onEditar,
    onCombinar,
    onEliminar,
    className = '',
}: TarjetaColeccionProps): JSX.Element => {
    const {
        menu,
        guardada,
        guardando,
        esPreviewActiva,
        esPropia,
        cargandoPreview,
        manejarPreview,
        abrirMenu,
        cerrarMenu,
        manejarToggleGuardada,
        itemsMenu,
    } = useTarjetaColeccion({ coleccion, onEditar, onCombinar, onEliminar });

    const imagenPortada = coleccion.imagenUrl || obtenerImagenColorPorTexto(coleccion.nombre);
    const clases = [
        'tarjetaColeccion',
        (vista === 'lista' || vista === 'arbol') ? 'tarjetaColeccionLista' : '',
        esSubcoleccion ? 'tarjetaColeccionSub' : '',
        esPreviewActiva ? 'tarjetaColeccionReproduciendo' : '',
        className,
    ].filter(Boolean).join(' ');

    /* Icono del boton preview segun estado */
    const iconoPreview = cargandoPreview
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
                                disabled={cargandoPreview}
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
                        {/* [173A-7] Nombre del padre para subcolecciones */}
                        {parentNombre && ` · en ${parentNombre}`}
                    </span>
                </div>
            </EnlaceNavegacion>

            {/* Boton 3 puntos -- FUERA del <a> para evitar navegacion al hacer click */}
            <div className="tarjetaColeccionMenuContenedor">
                {/* [183A-15] Reutiliza el bookmark de detalle para guardar colecciones desde el listado. */}
                {!esPropia && (
                    <BotonBase variante="ghost"
                        className={`tarjetaColeccionGuardarBtn ${guardada ? 'tarjetaColeccionGuardarBtnActiva' : ''}`}
                        onClick={manejarToggleGuardada}
                        type="button"
                        aria-label={guardada ? 'Quitar colección de guardadas' : 'Guardar colección'}
                        cargando={guardando}
                    >
                        {guardada ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                    </BotonBase>
                )}
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