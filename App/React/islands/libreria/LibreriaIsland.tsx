/*
 * LibreriaIsland — Kamples (Fase 5.1-5.4)
 * Librería personal: descargas, favoritos, colecciones y subidos.
 * Tab colecciones integra CRUD completo con ModalColeccion y TarjetaColeccion.
 */

import { useState, useCallback, useEffect } from 'react';
import { Download, Heart, FolderOpen, Upload, Music, Plus } from 'lucide-react';
import {
    TabBar,
    BotonBase,
    InputBusqueda,
} from '@app/components/ui';
import type { TabDefinicion } from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { listarColecciones, eliminarColeccion } from '@app/services/apiColecciones';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import type { SampleResumen, Coleccion } from '@app/types';
import { crearLogger } from '@app/services/logger';
import '../../styles/componentes/libreria.css';

const TABS_LIBRERIA: TabDefinicion[] = [
    { id: 'descargas', etiqueta: 'Descargas' },
    { id: 'favoritos', etiqueta: 'Favoritos' },
    { id: 'colecciones', etiqueta: 'Colecciones' },
    { id: 'subidos', etiqueta: 'Subidos' },
];

/* Iconos para cada tab */
const ICONOS_TAB: Record<string, JSX.Element> = {
    descargas: <Download size={16} />,
    favoritos: <Heart size={16} />,
    colecciones: <FolderOpen size={16} />,
    subidos: <Upload size={16} />,
};

const log = crearLogger('LibreriaIsland');

export const LibreriaIsland = (): JSX.Element => {
    const [tabActiva, setTabActiva] = useState('descargas');
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    /* Modal de colección */
    const [modalColeccionAbierto, setModalColeccionAbierto] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    const { navegar } = useNavigationStore();
    const { abrir: abrirSubirModal } = useSubirModalStore();
    const menu = useMenuContextualSample();

    /* Cargar datos según tab activa */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            if (tabActiva === 'colecciones') {
                const resp = await listarColecciones();
                if (resp.ok && resp.data) {
                    setColecciones(resp.data);
                } else {
                    setColecciones([]);
                }
            } else {
                /* TO-DO: endpoints dedicados para cada tab */
                const resp = await listarSamples({
                    busqueda: busqueda || undefined,
                    perPage: 20,
                });
                if (resp.ok && resp.data) {
                    setSamples(resp.data.data ?? []);
                } else {
                    setSamples([]);
                }
            }
            setCargando(false);
        };
        cargar();
    }, [tabActiva, busqueda]);

    const manejarLike = useCallback(async (sampleId: number) => {
        setSamples((prev) =>
            prev.map((s) =>
                s.id === sampleId
                    ? { ...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1) }
                    : s
            )
        );
        const sample = samples.find((s) => s.id === sampleId);
        if (sample?.liked) {
            await quitarLike('sample', sampleId);
        } else {
            await darLike('sample', sampleId);
        }
    }, [samples]);

    const manejarTab = useCallback((tabId: string) => {
        setTabActiva(tabId);
        setBusqueda('');
    }, []);

    /* Colecciones: crear/editar/eliminar */
    const abrirNuevaColeccion = useCallback(() => {
        setColeccionEditando(null);
        setModalColeccionAbierto(true);
    }, []);

    const manejarEditarColeccion = useCallback((col: Coleccion) => {
        setColeccionEditando(col);
        setModalColeccionAbierto(true);
    }, []);

    const manejarEliminarColeccion = useCallback(async (col: Coleccion) => {
        const resp = await eliminarColeccion(col.id);
        if (resp.ok) {
            setColecciones((prev) => prev.filter((c) => c.id !== col.id));
            log.info('Colección eliminada', { id: col.id });
        }
    }, []);

    const manejarGuardarColeccion = useCallback((col: Coleccion) => {
        setColecciones((prev) => {
            const existe = prev.find((c) => c.id === col.id);
            if (existe) {
                return prev.map((c) => (c.id === col.id ? col : c));
            }
            return [col, ...prev];
        });
    }, []);

    /* Mensajes vacíos por tab */
    const mensajeVacio: Record<string, { titulo: string; texto: string }> = {
        descargas: { titulo: 'Sin descargas', texto: 'Los samples que descargues aparecerán aquí.' },
        favoritos: { titulo: 'Sin favoritos', texto: 'Dale like a un sample para guardarlo aquí.' },
        colecciones: { titulo: 'Sin colecciones', texto: 'Crea tu primera colección para organizar samples.' },
        subidos: { titulo: 'Sin samples subidos', texto: 'Sube tu primer sample para compartirlo.' },
    };

    return (
        <div className="libreriaContenedor" id="seccionLibreria">
            <div className="libreriaCabecera">
                <h1 className="libreriaTitulo">Tu Librería</h1>
                <div className="libreriaAcciones">
                    {tabActiva === 'colecciones' && (
                        <BotonBase variante="ghost" tamano="sm" onClick={abrirNuevaColeccion}>
                            <Plus size={14} /> Nueva colección
                        </BotonBase>
                    )}
                    {tabActiva === 'subidos' && (
                        <BotonBase variante="primario" tamano="sm" onClick={abrirSubirModal}>
                            <Upload size={14} /> Subir sample
                        </BotonBase>
                    )}
                </div>
            </div>

            <TabBar tabs={TABS_LIBRERIA} activa={tabActiva} onChange={manejarTab} />

            <div className="libreriaBusqueda">
                <InputBusqueda
                    onChange={setBusqueda}
                    placeholder={`Buscar en ${tabActiva}...`}
                />
            </div>

            {cargando ? (
                <div className="libreriaVacio">
                    <Music size={32} className="libreriaVacioIcono" />
                    <p>Cargando...</p>
                </div>
            ) : tabActiva === 'colecciones' ? (
                /* Renderizar colecciones */
                colecciones.length === 0 ? (
                    <div className="libreriaVacio">
                        <FolderOpen size={32} />
                        <h3 className="libreriaVacioTitulo">Sin colecciones</h3>
                        <p className="libreriaVacioTexto">Crea tu primera colección para organizar samples.</p>
                        <BotonBase variante="primario" tamano="sm" onClick={abrirNuevaColeccion}>
                            <Plus size={14} /> Nueva colección
                        </BotonBase>
                    </div>
                ) : (
                    <div className="libreriaListaColecciones">
                        {colecciones.map((col) => (
                            <TarjetaColeccion
                                key={col.id}
                                coleccion={col}
                                onEditar={manejarEditarColeccion}
                                onEliminar={manejarEliminarColeccion}
                            />
                        ))}
                    </div>
                )
            ) : samples.length === 0 ? (
                <div className="libreriaVacio">
                    {ICONOS_TAB[tabActiva]}
                    <h3 className="libreriaVacioTitulo">{mensajeVacio[tabActiva]?.titulo}</h3>
                    <p className="libreriaVacioTexto">{mensajeVacio[tabActiva]?.texto}</p>
                    {tabActiva === 'subidos' && (
                        <BotonBase variante="primario" tamano="sm" onClick={abrirSubirModal}>
                            Subir sample
                        </BotonBase>
                    )}
                </div>
            ) : (
                <div className="libreriaLista">
                    {samples.map((sample) => (
                        <TarjetaSample
                            key={sample.id}
                            sample={sample}
                            onLike={manejarLike}
                            onMenu={menu.abrirMenu}
                            onClickCreador={(u) => navegar(`/perfil/${u}`)}
                        />
                    ))}
                </div>
            )}

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />

            {/* Modal para crear/editar colección */}
            <ModalColeccion
                abierto={modalColeccionAbierto}
                onCerrar={() => setModalColeccionAbierto(false)}
                onGuardar={manejarGuardarColeccion}
                coleccion={coleccionEditando}
            />
        </div>
    );
};

export default conAutenticacion(LibreriaIsland as React.ComponentType<Record<string, unknown>>);
