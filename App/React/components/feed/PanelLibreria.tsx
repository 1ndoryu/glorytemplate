/*
 * Componente: PanelLibreria — Kamples (C280)
 * Version compacta de la libreria para el panel lateral.
 * Tabs: Explorar colecciones, Mis colecciones, Subidos.
 * Se abre desde el sidebar sin navegar a otra pagina.
 */

import { useState, useCallback, useEffect } from 'react';
import { FolderOpen, Upload, Globe, Plus, X, Music } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { listarSamples } from '@app/services/apiSamples';
import { listarColecciones, listarColeccionesPublicas, eliminarColeccion } from '@app/services/apiColecciones';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import type { SampleResumen, Coleccion, TipoReaccion } from '@app/types';

const TABS = [
    { id: 'explorar', icono: <Globe size={14} />, etiqueta: 'Explorar' },
    { id: 'colecciones', icono: <FolderOpen size={14} />, etiqueta: 'Colecciones' },
    { id: 'subidos', icono: <Upload size={14} />, etiqueta: 'Subidos' },
] as const;

type TabId = typeof TABS[number]['id'];

export const PanelLibreria = (): JSX.Element => {
    const [tab, setTab] = useState<TabId>('explorar');
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [coleccionesPublicas, setColeccionesPublicas] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalColeccion, setModalColeccion] = useState(false);
    const [coleccionEditando, setColeccionEditando] = useState<Coleccion | null>(null);

    const { navegar } = useNavigationStore();
    const { abrir: abrirSubirModal } = useSubirModalStore();
    const { cerrar: cerrarPanel, abrirDetalle } = usePanelLateralStore();

    /* Cargar datos al cambiar tab */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            if (tab === 'explorar') {
                const resp = await listarColeccionesPublicas();
                setColeccionesPublicas(resp.ok && resp.data ? resp.data : []);
            } else if (tab === 'colecciones') {
                const resp = await listarColecciones();
                setColecciones(resp.ok && resp.data ? resp.data : []);
            } else {
                const { useAuthStore } = await import('@app/stores/authStore');
                const username = useAuthStore.getState().usuario?.username;
                const resp = await listarSamples({ creador: username || undefined, perPage: 20 });
                setSamples(resp.ok && resp.data ? resp.data.data ?? [] : []);
            }
            setCargando(false);
        };
        cargar();
    }, [tab]);

    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s
                )
            );
            await darLike('sample', sampleId, reaccion);
        } else if (sample?.liked || sample?.reaccion) {
            const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            await quitarLike('sample', sampleId);
        } else {
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            await darLike('sample', sampleId, 'like');
        }
    }, [samples]);

    const manejarGuardarColeccion = useCallback((col: Coleccion) => {
        setColecciones((prev) => {
            const existe = prev.find((c) => c.id === col.id);
            return existe ? prev.map((c) => (c.id === col.id ? col : c)) : [col, ...prev];
        });
    }, []);

    return (
        <div className="panelLibreria">
            {/* Cabecera con titulo y boton cerrar */}
            <div className="panelLibreriaCabecera">
                <h3 className="panelLibreriaTitulo">
                    <FolderOpen size={16} /> Libreria
                </h3>
                <button
                    className="panelLibreriaCerrar"
                    onClick={cerrarPanel}
                    type="button"
                    aria-label="Cerrar"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Tabs compactas */}
            <div className="panelLibreriaTabs">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        className={`panelLibreriaTab ${tab === t.id ? 'panelLibreriaTabActiva' : ''}`}
                        onClick={() => setTab(t.id)}
                        type="button"
                    >
                        {t.icono} {t.etiqueta}
                    </button>
                ))}
            </div>

            {/* Acciones contextuales */}
            <div className="panelLibreriaAcciones">
                {tab === 'colecciones' && (
                    <BotonBase variante="ghost" tamano="sm" onClick={() => { setColeccionEditando(null); setModalColeccion(true); }}>
                        <Plus size={12} /> Nueva
                    </BotonBase>
                )}
                {tab === 'subidos' && (
                    <BotonBase variante="ghost" tamano="sm" onClick={abrirSubirModal}>
                        <Upload size={12} /> Subir
                    </BotonBase>
                )}
            </div>

            {/* Contenido */}
            <div className="panelLibreriaContenido">
                {cargando ? (
                    <div className="panelLibreriaVacio">
                        <Music size={24} />
                        <span>Cargando...</span>
                    </div>
                ) : tab === 'explorar' ? (
                    coleccionesPublicas.length === 0 ? (
                        <div className="panelLibreriaVacio">
                            <Globe size={24} />
                            <span>Sin colecciones publicas</span>
                        </div>
                    ) : (
                        <div className="panelLibreriaGrid">
                            {coleccionesPublicas.map((col) => (
                                <TarjetaColeccion
                                    key={col.id}
                                    coleccion={col}
                                    onClick={(c) => navegar(`/coleccion/${c.id}/`)}
                                />
                            ))}
                        </div>
                    )
                ) : tab === 'colecciones' ? (
                    colecciones.length === 0 ? (
                        <div className="panelLibreriaVacio">
                            <FolderOpen size={24} />
                            <span>Sin colecciones</span>
                            <BotonBase variante="ghost" tamano="sm" onClick={() => { setColeccionEditando(null); setModalColeccion(true); }}>
                                <Plus size={12} /> Crear
                            </BotonBase>
                        </div>
                    ) : (
                        <div className="panelLibreriaGrid">
                            {colecciones.map((col) => (
                                <TarjetaColeccion
                                    key={col.id}
                                    coleccion={col}
                                    onClick={(c) => navegar(`/coleccion/${c.id}/`)}
                                    onEditar={(c) => { setColeccionEditando(c); setModalColeccion(true); }}
                                    onEliminar={async (c) => {
                                        const resp = await eliminarColeccion(c.id);
                                        if (resp.ok) setColecciones((prev) => prev.filter((x) => x.id !== c.id));
                                    }}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    samples.length === 0 ? (
                        <div className="panelLibreriaVacio">
                            <Upload size={24} />
                            <span>Sin samples subidos</span>
                            <BotonBase variante="ghost" tamano="sm" onClick={abrirSubirModal}>
                                Subir sample
                            </BotonBase>
                        </div>
                    ) : (
                        <div className="panelLibreriaLista">
                            {samples.map((sample) => (
                                <TarjetaSample
                                    key={sample.id}
                                    sample={sample}
                                    onLike={manejarLike}
                                    onClickCreador={(u) => navegar(`/perfil/${u}`)}
                                    onClickTitulo={(s) => abrirDetalle(s)}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            <ModalColeccion
                abierto={modalColeccion}
                onCerrar={() => setModalColeccion(false)}
                onGuardar={manejarGuardarColeccion}
                coleccion={coleccionEditando}
            />
        </div>
    );
};

export default PanelLibreria;
