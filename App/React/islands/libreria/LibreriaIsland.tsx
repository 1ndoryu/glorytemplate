/*
 * LibreriaIsland — Kamples
 * Librería personal: explorar colecciones públicas y mis colecciones.
 * C388: barraControl con ordenamiento + tag badges para filtrado.
 * Lógica extraída a useLibreriaIsland (SRP).
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FolderOpen, Plus, Globe, ArrowDownWideNarrow, ChevronDown, Bookmark, LayoutGrid, List, ListTree } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { Badge } from '@app/components/ui/Badge';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { ModalCombinarColeccion } from '@app/components/social/ModalCombinarColeccion';
import { SkeletonTarjetaColeccion } from '@app/components/skeletons';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useLibreriaIsland } from '@app/hooks/useLibreriaIsland';
import type { OrdenColecciones } from '@app/hooks/useLibreriaIsland';
import { useAuthStore } from '@app/stores/authStore';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import { useT } from '@app/utils/i18n';
import '../../styles/componentes/libreria.css';

const TABS_LIBRERIA = [
    { id: 'explorar', etiqueta: 'panel.libreria.explorar' },
    { id: 'colecciones', etiqueta: 'libreria.tabs.misColecciones' },
    { id: 'guardadas', etiqueta: 'libreria.tabs.guardadas' },
];

/* C388: Opciones de ordenamiento para el menú dropdown */
/* [2103A-3] 'inteligente' primero — scoring multi-factor del backend */
const OPCIONES_ORDEN: { id: OrdenColecciones; etiqueta: string }[] = [
    { id: 'inteligente', etiqueta: 'feed.orden.inteligente' },
    { id: 'recientes', etiqueta: 'feed.orden.recientes' },
    { id: 'nombre', etiqueta: 'libreria.orden.nombreAz' },
    { id: 'totalSamples', etiqueta: 'libreria.orden.masSamples' },
];

export const LibreriaIsland = (): JSX.Element => {
    const { t } = useT();
    const {
        colecciones, coleccionesEnArbol,
        coleccionesPublicas, coleccionesPublicasEnArbol,
        coleccionesGuardadas, coleccionesGuardadasEnArbol,
        coleccionesPlanas, cargando, cargandoMas, hayMasExplorar, cargarMasExplorar,
        modalColeccionAbierto, setModalColeccionAbierto, coleccionEditando,
        modalCombinarAbierto, setModalCombinarAbierto, coleccionCombinando,
        tabActiva,
        tagsFrecuentes, tagActivo, setTagActivo,
        orden, setOrden, totalColecciones,
        vista, setVista,
        abrirNuevaColeccion, abrirCombinarColeccion, manejarColeccionCombinada,
        manejarEditarColeccion, manejarEliminarColeccion, manejarGuardarColeccion,
    } = useLibreriaIsland();
    const usuario = useAuthStore(s => s.usuario);
    const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false);

    /* [2003A-39] IntersectionObserver para infinite scroll en tab explorar */
    const sentinelaRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const sentinelaCallback = useCallback((node: HTMLDivElement | null) => {
        if (observerRef.current) observerRef.current.disconnect();
        if (!node) return;
        sentinelaRef.current = node;
        observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) cargarMasExplorar();
        }, { rootMargin: '200px' });
        observerRef.current.observe(node);
    }, [cargarMasExplorar]);

    useEffect(() => {
        return () => { observerRef.current?.disconnect(); };
    }, []);

    /* [173A-7] Mapa id->nombre para encontrar el nombre del padre de subcolecciones */
    const mapaColecciones = useMemo(() => {
        const mapa = new Map<number, string>();
        for (const col of coleccionesPlanas) mapa.set(col.id, col.nombre);
        for (const col of coleccionesPublicas) mapa.set(col.id, col.nombre);
        for (const col of coleccionesGuardadas) mapa.set(col.id, col.nombre);
        return mapa;
    }, [coleccionesPlanas, coleccionesPublicas, coleccionesGuardadas]);

    useTabsIsla('LibreriaIsland', TABS_LIBRERIA, 'explorar');

    const etiquetaOrden = t(OPCIONES_ORDEN.find(o => o.id === orden)?.etiqueta ?? 'feed.orden.recientes');

    return (
        <div className="libreriaContenedor" id="seccionLibreria">

            {cargando ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--espacioMd)', padding: 'var(--espacioMd)' }}>
                    <SkeletonTarjetaColeccion />
                    <SkeletonTarjetaColeccion />
                    <SkeletonTarjetaColeccion />
                    <SkeletonTarjetaColeccion />
                </div>
            ) : (
                <>
                    {/* B1: barraControl compartida entre ambas tabs */}
                    <div className="libreriaBarraControl">
                        <div className="libreriaControlesIzquierda">
                            <span className="libreriaContador">{totalColecciones} {t(totalColecciones === 1 ? 'libreria.coleccion' : 'libreria.colecciones')}</span>
                        </div>

                        <div className="libreriaControlesDerecha">
                            <div className="libreriaOrdenWrapper">
                                <BotonBase variante="ghost"
                                    className="libreriaOrdenBtn"
                                    onClick={() => setMenuOrdenAbierto(prev => !prev)}
                                    type="button"
                                >
                                    <ArrowDownWideNarrow size={14} />
                                    {etiquetaOrden}
                                    <ChevronDown size={12} />
                                </BotonBase>

                                {menuOrdenAbierto && (
                                    <div className="libreriaOrdenMenu">
                                        {OPCIONES_ORDEN.map(opcion => (
                                            <BotonBase key={opcion.id} variante="ghost"
                                                className={orden === opcion.id ? 'libreriaOrdenActivo' : ''}
                                                onClick={() => { setOrden(opcion.id); setMenuOrdenAbierto(false); }}
                                                type="button"
                                            >
                                                {t(opcion.etiqueta)}
                                            </BotonBase>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* QL118: Toggle cuadrícula / lista */}
                            <div className="libreriaVistaToggle">
                                <BotonBase variante="ghost"
                                    className={`libreriaVistaBtn ${vista === 'cuadricula' ? 'libreriaVistaBtnActivo' : ''}`}
                                    onClick={() => setVista('cuadricula')}
                                    type="button"
                                    aria-label={t('libreria.vistaCuadricula')}
                                >
                                    <LayoutGrid size={16} />
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={`libreriaVistaBtn ${vista === 'lista' ? 'libreriaVistaBtnActivo' : ''}`}
                                    onClick={() => setVista('lista')}
                                    type="button"
                                    aria-label={t('libreria.vistaLista')}
                                >
                                    <List size={16} />
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={`libreriaVistaBtn ${vista === 'arbol' ? 'libreriaVistaBtnActivo' : ''}`}
                                    onClick={() => setVista('arbol')}
                                    type="button"
                                    aria-label={t('libreria.vistaArbol')}
                                >
                                    <ListTree size={16} />
                                </BotonBase>
                            </div>

                            {tabActiva === 'colecciones' && (
                                <BotonBase variante="primario" tamano="sm" onClick={abrirNuevaColeccion}>
                                    <Plus size={14} /> {t('panel.libreria.nueva')}
                                </BotonBase>
                            )}
                        </div>
                    </div>

                    {/* B1: Tags frecuentes compartidos entre ambas tabs */}
                    {tagsFrecuentes.length > 0 && (
                        <div className="libreriaTagsFrecuentes">
                            <Badge
                                variante={tagActivo === null ? 'acento' : 'neutro'}
                                estilo={tagActivo === null ? 'relleno' : 'borde'}
                                tamano="sm"
                                interactivo
                                onClick={() => setTagActivo(null)}
                            >
                                {t('libreria.todos')}
                            </Badge>
                            {tagsFrecuentes.map(tag => (
                                <Badge
                                    key={tag}
                                    variante={tagActivo === tag ? 'acento' : 'neutro'}
                                    estilo={tagActivo === tag ? 'relleno' : 'borde'}
                                    tamano="sm"
                                    interactivo
                                    onClick={() => setTagActivo(tagActivo === tag ? null : tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Contenido de tab activa */}
                    {tabActiva === 'explorar' ? (
                        coleccionesPublicas.length === 0 && !cargandoMas ? (
                            <EstadoVacio
                                icono={<Globe size={32} />}
                                titulo={tagActivo ? t('libreria.sinResultados') : t('libreria.sinColeccionesPublicas')}
                                mensaje={tagActivo
                                    ? t('libreria.sinColeccionesConTag', { tag: tagActivo })
                                    : t('libreria.sinColeccionesCompartidas')}
                            />
                        ) : (
                            <>
                                <div className={vista === 'arbol' ? 'libreriaArbolColecciones' : vista === 'lista' ? 'libreriaListaColecciones' : 'libreriaGridColecciones'}>
                                    {(vista === 'arbol' ? coleccionesPublicasEnArbol : coleccionesPublicas).map(col => {
                                        const esPropia = usuario?.id !== undefined && String(col.usuarioId) === String(usuario.id);
                                        const esAdmin = usuario?.rol === 'admin';
                                        return (
                                            <TarjetaColeccion key={col.id} coleccion={col} vista={vista}
                                                esSubcoleccion={col.parentId !== null}
                                                parentNombre={col.parentId !== null ? (mapaColecciones.get(col.parentId) ?? null) : null}
                                                onEditar={(esPropia || esAdmin) ? manejarEditarColeccion : undefined}
                                                onCombinar={(esPropia || esAdmin) ? abrirCombinarColeccion : undefined}
                                                onEliminar={(esPropia || esAdmin) ? manejarEliminarColeccion : undefined}
                                            />
                                        );
                                    })}
                                </div>
                                {/* [2003A-39] Sentinel para infinite scroll */}
                                {hayMasExplorar && (
                                    <div ref={sentinelaCallback} style={{ height: 1 }} />
                                )}
                                {cargandoMas && (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--espacioLg)', gap: 'var(--espacioMd)' }}>
                                        <SkeletonTarjetaColeccion />
                                        <SkeletonTarjetaColeccion />
                                    </div>
                                )}
                            </>
                        )
                    ) : tabActiva === 'guardadas' ? (
                        coleccionesGuardadas.length === 0 ? (
                            <EstadoVacio
                                icono={<Bookmark size={32} />}
                                titulo={t('libreria.sinColeccionesGuardadas')}
                                mensaje={t('libreria.guardadasApareceranAqui')}
                            />
                        ) : (
                            <div className={vista === 'arbol' ? 'libreriaArbolColecciones' : vista === 'lista' ? 'libreriaListaColecciones' : 'libreriaGridColecciones'}>
                                {(vista === 'arbol' ? coleccionesGuardadasEnArbol : coleccionesGuardadas).map(col => (
                                    <TarjetaColeccion key={col.id} coleccion={col} vista={vista}
                                        esSubcoleccion={col.parentId !== null}
                                        parentNombre={col.parentId !== null ? (mapaColecciones.get(col.parentId) ?? null) : null}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        colecciones.length === 0 ? (
                            <EstadoVacio
                                icono={<FolderOpen size={32} />}
                                titulo={tagActivo ? t('libreria.sinResultados') : t('panel.libreria.sinColecciones')}
                                mensaje={tagActivo
                                    ? t('libreria.sinColeccionesConTag', { tag: tagActivo })
                                    : t('libreria.creaPrimeraColeccion')}
                                accion={!tagActivo ? (
                                    <BotonBase variante="primario" tamano="sm" onClick={abrirNuevaColeccion}>
                                        <Plus size={14} /> {t('libreria.nuevaColeccion')}
                                    </BotonBase>
                                ) : undefined}
                            />
                        ) : (
                        <div className={vista === 'arbol' ? 'libreriaArbolColecciones' : vista === 'lista' ? 'libreriaListaColecciones' : 'libreriaGridColecciones'}>
                            {(vista === 'arbol' ? coleccionesEnArbol : colecciones).map(col => (
                                <TarjetaColeccion key={col.id} coleccion={col} vista={vista}
                                    esSubcoleccion={col.parentId !== null}
                                    parentNombre={col.parentId !== null ? (mapaColecciones.get(col.parentId) ?? null) : null}
                                    onEditar={manejarEditarColeccion}
                                    onCombinar={abrirCombinarColeccion}
                                    onEliminar={manejarEliminarColeccion}
                                />
                            ))}
                        </div>
                    ))}
                </>
            )}

            <ModalColeccion abierto={modalColeccionAbierto} onCerrar={() => setModalColeccionAbierto(false)}
                onGuardar={manejarGuardarColeccion} coleccion={coleccionEditando} />
            <ModalCombinarColeccion
                abierto={modalCombinarAbierto}
                onCerrar={() => setModalCombinarAbierto(false)}
                onCombinado={manejarColeccionCombinada}
                coleccion={coleccionCombinando}
                esAdmin={usuario?.rol === 'admin'}
            />
        </div>
    );
};

export default conAutenticacion(LibreriaIsland as React.ComponentType<Record<string, unknown>>);
