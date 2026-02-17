/*
 * Isla: ColeccionDetalleIsland — Kamples (FASE 6.3)
 * Página de detalle de una colección: header + grid de samples.
 * Ruta: /coleccion/{slug}
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Lock, Globe, Download, Play, MoreHorizontal, Link2, Trash2, Flag } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { obtenerColeccion, obtenerSugerencias, descargarColeccionZip } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useAuthStore } from '@app/stores/authStore';
import { toast } from '@app/stores/toastStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import type { Coleccion, SampleResumen } from '@app/types';
import '../../styles/componentes/coleccionDetalle.css';

const TABS_COLECCION_DETALLE = [
    { id: 'samples', etiqueta: 'Samples' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

interface ColeccionDetalleIslandProps {
    coleccionId?: string;
}

const ColeccionDetalleBase = ({ coleccionId: propId }: ColeccionDetalleIslandProps): JSX.Element => {
    const [coleccion, setColeccion] = useState<Coleccion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardada, setGuardada] = useState(false);
    const { navegar } = useNavigationStore();
    const { activa: tabActiva } = useTabsTopBarStore();
    const { habilitar: habilitarPanel, deshabilitar: deshabilitarPanel } = usePanelLateralStore();
    const { usuario } = useAuthStore();

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('ColeccionDetalleIsland', TABS_COLECCION_DETALLE, 'samples');

    /* Habilitar panel lateral al estar en esta isla */
    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'ColeccionDetalleIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /* Obtener ID de la URL si no viene por props */
    const id = propId ? parseInt(propId, 10) : (() => {
        const path = window.location.pathname;
        const partes = path.split('/').filter(Boolean);
        const idx = partes.indexOf('coleccion');
        return idx >= 0 && partes[idx + 1] ? parseInt(partes[idx + 1], 10) : null;
    })();

    useEffect(() => {
        if (!id) return;
        const cargar = async () => {
            setCargando(true);
            const resp = await obtenerColeccion(id);
            if (resp.ok && resp.data) setColeccion(resp.data);
            setCargando(false);
        };
        cargar();
    }, [id]);

    const manejarGuardar = useCallback(() => {
        setGuardada((prev) => !prev);
    }, []);

    /* C110: Descargar colección como ZIP con verificación de créditos */
    const [descargando, setDescargando] = useState(false);
    const manejarDescargarZip = useCallback(async () => {
        if (!id || descargando) return;
        setDescargando(true);
        try {
            const resp = await descargarColeccionZip(id);
            if (resp.ok && resp.data) {
                /* Iniciar descarga del ZIP */
                const a = document.createElement('a');
                a.href = resp.data.url;
                a.download = resp.data.nombre;
                document.body.appendChild(a);
                a.click();
                a.remove();

                const msg = resp.data.creditosUsados > 0
                    ? `Descargando ${resp.data.totalSamples} samples (${resp.data.creditosUsados} créditos usados)`
                    : `Descargando ${resp.data.totalSamples} samples (ya descargados previamente)`;
                toast.exito(msg);
            } else {
                /* C199: Si es 429 (sin créditos) o 403 (requiere plan), abrir modal planes */
                if (resp.status === 429 || resp.status === 403) {
                    usePlanesModalStore.getState().abrir();
                }
                toast.error(resp.error ?? 'Error al descargar la colección');
            }
        } catch {
            toast.error('Error de conexión al descargar');
        } finally {
            setDescargando(false);
        }
    }, [id, descargando]);

    /* Sync like desde FeedSamples al estado local de la colección */
    const manejarLikeSamples = useCallback((sampleId: number) => {
        setColeccion((prev) => {
            if (!prev?.samples) return prev;
            return {
                ...prev,
                samples: prev.samples.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: !s.liked, totalLikes: s.liked ? s.totalLikes - 1 : s.totalLikes + 1 }
                        : s
                ),
            };
        });
    }, []);

    /* Proveedor para tab "Más Ideas" — sugerencias paginadas */
    const proveedorSugerencias = useCallback(async (pagina: number): Promise<SampleResumen[]> => {
        if (!id) return [];
        const resp = await obtenerSugerencias(id, pagina);
        return resp.ok && resp.data ? resp.data : [];
    }, [id]);

    const samples = coleccion?.samples ?? [];

    /*
     * C108: Extraer las 5 metas más comunes de los samples
     * (género, emoción, instrumento, tipo, artista vibe)
     * IMPORTANTE: debe estar antes de cualquier early return para evitar
     * "Rendered more hooks than during the previous render"
     */
    const metasComunes = useMemo(() => {
        if (!samples.length) return [];
        const conteo = new Map<string, number>();
        for (const s of samples) {
            const m = s.metadata;
            if (!m) continue;
            const valores: string[] = [];
            const genero = m.genero;
            if (Array.isArray(genero)) valores.push(...genero.filter((g): g is string => typeof g === 'string'));
            else if (typeof genero === 'string' && genero) valores.push(genero);
            if (typeof m.emocion === 'string' && m.emocion) valores.push(m.emocion);
            if (typeof m.emocionEs === 'string' && m.emocionEs && m.emocionEs !== m.emocion) valores.push(m.emocionEs);
            const instrumentos = m.instrumentos;
            if (Array.isArray(instrumentos)) valores.push(...instrumentos.filter((i): i is string => typeof i === 'string'));
            else if (typeof instrumentos === 'string' && instrumentos) valores.push(instrumentos);
            if (typeof m.tipo === 'string' && m.tipo) valores.push(m.tipo);
            for (const v of valores) {
                if (typeof v !== 'string') continue;
                const limpio = v.trim().toLowerCase();
                if (limpio) conteo.set(limpio, (conteo.get(limpio) ?? 0) + 1);
            }
        }
        return [...conteo.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1));
    }, [samples]);

    /* C127: Menú contextual de la colección */
    const [menuColeccion, setMenuColeccion] = useState<{ abierto: boolean; x: number; y: number }>({
        abierto: false, x: 0, y: 0
    });

    const abrirMenuColeccion = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuColeccion({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenuColeccion = useCallback(() => {
        setMenuColeccion(prev => ({ ...prev, abierto: false }));
    }, []);

    const itemsMenuColeccion = useMemo(() => {
        if (!coleccion) return [];
        const esPropietario = usuario?.id !== undefined && String(coleccion.usuarioId) === String(usuario.id);
        const esAdmin = usuario?.rol === 'admin';
        const items: { id: string; etiqueta: string; icono: JSX.Element; onClick: () => void; peligro?: boolean; separadorDespues?: boolean }[] = [];

        items.push({
            id: 'copiar-enlace',
            etiqueta: 'Copiar enlace',
            icono: <Link2 size={16} />,
            separadorDespues: true,
            onClick: () => {
                copiarAlPortapapeles(`${window.location.origin}/coleccion/${coleccion.id}/`);
                cerrarMenuColeccion();
            }
        });

        if (esPropietario || esAdmin) {
            items.push({
                id: 'eliminar',
                etiqueta: 'Eliminar colección',
                icono: <Trash2 size={16} />,
                peligro: true,
                onClick: () => {
                    toast.confirmar('¿Eliminar esta colección?', async () => {
                        const { apiDelete } = await import('@app/services/apiCliente');
                        const resp = await apiDelete(`/colecciones/${coleccion.id}`);
                        if (resp.ok) {
                            toast.exito('Colección eliminada');
                            navegar('/libreria/');
                        }
                    });
                    cerrarMenuColeccion();
                }
            });
        }

        items.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={16} />,
            onClick: () => { cerrarMenuColeccion(); }
        });

        return items;
    }, [coleccion, usuario, navegar, cerrarMenuColeccion]);

    if (cargando) {
        return (
            <div className="coleccionDetalle" id="coleccionDetalle">
                <div className="coleccionCargando">Cargando colección...</div>
            </div>
        );
    }

    if (!coleccion) {
        return (
            <div className="coleccionDetalle" id="coleccionDetalle">
                <div className="coleccionError">
                    <p>Colección no encontrada</p>
                    <BotonBase variante="ghost" onClick={() => navegar('/libreria/')}>
                        Volver a librería
                    </BotonBase>
                </div>
            </div>
        );
    }

    const imagenHeader = coleccion.imagenUrl || obtenerImagenColor(coleccion.id);

    return (
        <div className="coleccionDetalle" id="coleccionDetalle">
            {/* Botón volver */}
            <button className="coleccionVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </button>

            {/* Header de la colección */}
            <div className="coleccionHeader">
                <img className="coleccionHeaderImg" src={imagenHeader} alt={coleccion.nombre} />
                <div className="coleccionHeaderInfo">
                    <div className="coleccionHeaderTipo">
                        {coleccion.esPublica ? (
                            <Badge variante="acento"><Globe size={12} /> Pública</Badge>
                        ) : (
                            <Badge variante="neutro"><Lock size={12} /> Privada</Badge>
                        )}
                    </div>
                    <h1 className="coleccionNombre">{coleccion.nombre}</h1>
                    {coleccion.descripcion && (
                        <p className="coleccionDescripcion">{coleccion.descripcion}</p>
                    )}
                    <div className="coleccionMeta">
                        {coleccion.usuario && (
                            <EnlaceCreador
                                username={coleccion.usuario.username}
                                nombreVisible={coleccion.usuario.nombreVisible}
                                avatarUrl={coleccion.usuario.avatarUrl ?? undefined}
                                tamanoAvatar="xs"
                                className="coleccionCreador"
                            />
                        )}
                        <span className="coleccionStats">
                            {coleccion.totalSamples} samples
                        </span>
                        {/* C108: 5 metas más comunes separadas por • */}
                        {metasComunes.length > 0 && (
                            <span className="coleccionMetasComunes">
                                {metasComunes.join(' \u2022 ')}
                            </span>
                        )}
                    </div>
                    {/* C109+C125+C137: Botones con texto — guardar (solo ajena), descargar, preview */}
                    <div className="coleccionAcciones">
                        {/* C137: Ocultar guardar en colecciones propias */}
                        {coleccion.usuarioId !== usuario?.id && (
                            <button
                                className={`coleccionAccionBtn ${guardada ? 'coleccionAccionActivo' : ''}`}
                                onClick={manejarGuardar}
                                type="button"
                                title={guardada ? 'Guardada' : 'Guardar colección'}
                            >
                                {guardada ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                                <span>{guardada ? 'Guardada' : 'Guardar'}</span>
                            </button>
                        )}
                        <button
                            className="coleccionAccionBtn"
                            type="button"
                            title="Descargar colección"
                            onClick={manejarDescargarZip}
                            disabled={descargando}
                        >
                            <Download size={16} />
                            <span>{descargando ? 'Descargando...' : 'Descargar'}</span>
                        </button>
                        <button
                            className="coleccionAccionBtn"
                            type="button"
                            title="Preview"
                            onClick={() => { /* TO-DO: reproducir preview de la colección */ }}
                        >
                            <Play size={16} />
                            <span>Preview</span>
                        </button>
                        {/* C127: Menú 3 puntos */}
                        <button
                            className="coleccionAccionBtn"
                            type="button"
                            title="Más opciones"
                            onClick={abrirMenuColeccion}
                        >
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenido según tab activa — key distinta fuerza desmontaje para evitar race conditions (C46) */}
            {tabActiva === 'samples' ? (
                <FeedSamples
                    key="coleccion-samples"
                    samplesIniciales={samples}
                    proveedor={async () => []}
                    claveCache={`coleccion_${coleccion.id}`}
                    infiniteScroll={false}
                    virtualizar={false}
                    mostrarTags
                    mensajeVacio="Esta colección aún no tiene samples."
                    onLike={manejarLikeSamples}
                />
            ) : (
                <FeedSamples
                    key="coleccion-ideas"
                    proveedor={proveedorSugerencias}
                    claveCache={`sugerencias_${coleccion.id}`}
                    mostrarTags
                    infiniteScroll
                    virtualizar={false}
                    mensajeVacio="No hay sugerencias disponibles para esta colección."
                />
            )}

            {/* C127: MenuContextual de la colección */}
            <MenuContextual
                abierto={menuColeccion.abierto}
                onCerrar={cerrarMenuColeccion}
                items={itemsMenuColeccion}
                x={menuColeccion.x}
                y={menuColeccion.y}
            />
        </div>
    );
};

export const ColeccionDetalleIsland = conAutenticacion(ColeccionDetalleBase);
export default ColeccionDetalleIsland;
