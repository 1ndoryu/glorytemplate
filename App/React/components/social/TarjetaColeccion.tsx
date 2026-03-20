/*
 * Componente: TarjetaColeccion -- Kamples (C141 + QQ75)
 * Tarjeta visual tipo card para mostrar una coleccion.
 * Boton 3 puntos en esquina superior derecha -- usa MenuContextual.
 * Boton play/preview en esquina inferior derecha de la portada.
 * El boton esta FUERA del <a> para evitar navegacion accidental al hacer click.
 */

import { useRef, useCallback } from 'react';
import { Globe, Lock, MoreVertical, FolderTree, Play, Pause, Loader2, Heart, Bookmark, PanelRight } from 'lucide-react';
import type { Coleccion } from '@app/types';
import type { VistaColecciones } from '@app/hooks/useLibreriaIsland';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { useTarjetaColeccion } from '@app/hooks/useTarjetaColeccion';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { EnlaceNavegacion } from '../ui/EnlaceNavegacion';
import { MenuContextual } from '../ui/MenuContextual';
import { BotonBase } from '../ui/BotonBase';
import '../../styles/componentes/tarjetaColeccion.css';
import { ImgOptimizada } from '../ui/ImgOptimizada';
import { useT } from '@app/utils/i18n/useT';

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
    const { t } = useT();
    const {
        menu,
        guardada,
        guardando,
        likeada,
        likeando,
        esPreviewActiva,
        esPropia,
        cargandoPreview,
        manejarPreview,
        abrirMenu,
        cerrarMenu,
        manejarToggleGuardada,
        manejarToggleLike,
        itemsMenu,
    } = useTarjetaColeccion({ coleccion, onEditar, onCombinar, onEliminar });

    const abrirColeccionPanel = usePanelLateralStore(s => s.abrirColeccion);

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

    /* [183A-34] Long-press para menu contextual en movil (patron TarjetaSample) */
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchMovido = useRef(false);

    const iniciarLongPress = useCallback((e: React.TouchEvent) => {
        touchMovido.current = false;
        const touch = e.touches[0];
        longPressTimer.current = setTimeout(() => {
            if (touchMovido.current) return;
            const fake = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => {},
                stopPropagation: () => {},
            } as unknown as React.MouseEvent;
            abrirMenu(fake);
        }, 500);
    }, [abrirMenu]);

    const cancelarLongPress = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    return (
        <div
            className={clases}
            onContextMenu={abrirMenu}
            onTouchStart={iniciarLongPress}
            onTouchEnd={cancelarLongPress}
            onTouchMove={() => { touchMovido.current = true; cancelarLongPress(); }}
        >
            <EnlaceNavegacion href={`/coleccion/${coleccion.slug ?? coleccion.id}/`} className="tarjetaColeccionEnlace">
                <div className="tarjetaColeccionPortada">
                    <ImgOptimizada src={imagenPortada} alt={coleccion.nombre} w={300} quality={80} />
                    {esSubcoleccion && (
                        <span className="tarjetaColeccionSubBadge" title={t('coleccion.subcoleccion')}>
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
                                aria-label={esPreviewActiva ? t('coleccion.detenerPreview') : t('coleccion.preview')}
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
                        <span className="tarjetaColeccionVisibilidad" title={coleccion.esPublica ? t('coleccion.publicaBadge') : t('coleccion.privadaBadge')}>
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

            {/* Botón 3 puntos -- FUERA del <a> para evitar navegacion al hacer click */}
            {/* [183A-70] tamano="ninguno" en todos para evitar que .botonBase.tamanoMd (2 clases) sobreescriba padding:0 de tarjetaColeccionMenuBtn (1 clase) */}
            <div className="tarjetaColeccionMenuContenedor">
                {/* [183A-22] Dos botones distintos: bookmark (guardar) y heart (like) */}
                {!esPropia && (
                    <BotonBase variante="ghost"
                        tamano="ninguno"
                        className={`tarjetaColeccionLikeBtn ${likeada ? 'tarjetaColeccionLikeBtnActiva' : ''}`}
                        onClick={manejarToggleLike}
                        type="button"
                        aria-label={likeada ? t('coleccion.quitarLike') : t('coleccion.darLike')}
                        cargando={likeando}
                    >
                        <Heart size={16} fill={likeada ? 'currentColor' : 'none'} />
                    </BotonBase>
                )}
                {!esPropia && (
                    <BotonBase variante="ghost"
                        tamano="ninguno"
                        className={`tarjetaColeccionGuardarBtn ${guardada ? 'tarjetaColeccionGuardarBtnActiva' : ''}`}
                        onClick={manejarToggleGuardada}
                        type="button"
                        aria-label={guardada ? t('coleccion.quitarGuardadas') : t('sample.guardarColeccion')}
                        cargando={guardando}
                    >
                        <Bookmark size={16} fill={guardada ? 'currentColor' : 'none'} />
                    </BotonBase>
                )}
                {/* [183A-54] Abrir samples en panel lateral */}
                {coleccion.totalSamples > 0 && (
                    <BotonBase variante="ghost"
                        tamano="ninguno"
                        className="tarjetaColeccionMenuBtn"
                        onClick={() => abrirColeccionPanel(coleccion)}
                        type="button"
                        aria-label={t('coleccion.verSamplesPanel')}
                    >
                        <PanelRight size={16} />
                    </BotonBase>
                )}
                {/* [183A-60] Play rápido desde el menú (misma acción que preview de portada) */}
                {coleccion.totalSamples > 0 && (
                    <BotonBase variante="ghost"
                        tamano="ninguno"
                        className={`tarjetaColeccionMenuBtn ${esPreviewActiva ? 'tarjetaColeccionPreviewActivo' : ''}`}
                        onClick={manejarPreview}
                        type="button"
                        aria-label={esPreviewActiva ? t('coleccion.detenerPreview') : t('coleccion.reproducir')}
                        disabled={cargandoPreview}
                    >
                        {cargandoPreview ? <Loader2 size={16} className="tarjetaColeccionSpinner" /> :
                            esPreviewActiva ? <Pause size={16} /> : <Play size={16} />}
                    </BotonBase>
                )}
                <BotonBase variante="ghost"
                    tamano="ninguno"
                    className="tarjetaColeccionMenuBtn"
                    onClick={abrirMenu}
                    type="button"
                    aria-label={t('coleccion.opciones')}
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