/*
 * Componente: PanelLibreria — Kamples (C280)
 * SIN USO TEMPORAL — pendiente de integración con Explorador (C281).
 * Version compacta de la libreria para el panel lateral.
 * Lógica extraída a usePanelLibreria (SRP).
 */

import { FolderOpen, Upload, Globe, Plus, X, Music } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { usePanelLibreria } from '@app/hooks/usePanelLibreria';

const TABS = [
    { id: 'explorar' as const, icono: <Globe size={14} />, etiqueta: 'Explorar' },
    { id: 'colecciones' as const, icono: <FolderOpen size={14} />, etiqueta: 'Colecciones' },
    { id: 'subidos' as const, icono: <Upload size={14} />, etiqueta: 'Subidos' },
];

export const PanelLibreria = (): JSX.Element => {
    const {
        tab, setTab, samples, colecciones, coleccionesPublicas, cargando,
        modalColeccion, setModalColeccion, coleccionEditando,
        navegar, abrirSubirModal, cerrarPanel, abrirDetalle,
        manejarLike, manejarGuardarColeccion, manejarEditarColeccion,
        manejarEliminarColeccion, abrirNuevaColeccion,
    } = usePanelLibreria();

    return (
        <div className="panelLibreria">
            <div className="panelLibreriaCabecera">
                <h3 className="panelLibreriaTitulo"><FolderOpen size={16} /> Libreria</h3>
                <button className="panelLibreriaCerrar" onClick={cerrarPanel} type="button" aria-label="Cerrar">
                    <X size={16} />
                </button>
            </div>

            <div className="panelLibreriaTabs">
                {TABS.map(t => (
                    <button key={t.id} className={`panelLibreriaTab ${tab === t.id ? 'panelLibreriaTabActiva' : ''}`}
                        onClick={() => setTab(t.id)} type="button">
                        {t.icono} {t.etiqueta}
                    </button>
                ))}
            </div>

            <div className="panelLibreriaAcciones">
                {tab === 'colecciones' && (
                    <BotonBase variante="ghost" tamano="sm" onClick={abrirNuevaColeccion}>
                        <Plus size={12} /> Nueva
                    </BotonBase>
                )}
                {tab === 'subidos' && (
                    <BotonBase variante="ghost" tamano="sm" onClick={abrirSubirModal}>
                        <Upload size={12} /> Subir
                    </BotonBase>
                )}
            </div>

            <div className="panelLibreriaContenido">
                {cargando ? (
                    <div className="panelLibreriaVacio"><Music size={24} /><span>Cargando...</span></div>
                ) : tab === 'explorar' ? (
                    coleccionesPublicas.length === 0 ? (
                        <div className="panelLibreriaVacio"><Globe size={24} /><span>Sin colecciones publicas</span></div>
                    ) : (
                        <div className="panelLibreriaGrid">
                            {coleccionesPublicas.map(col => (
                                <TarjetaColeccion key={col.id} coleccion={col} onClick={c => navegar(`/coleccion/${c.id}/`)} />
                            ))}
                        </div>
                    )
                ) : tab === 'colecciones' ? (
                    colecciones.length === 0 ? (
                        <div className="panelLibreriaVacio">
                            <FolderOpen size={24} /><span>Sin colecciones</span>
                            <BotonBase variante="ghost" tamano="sm" onClick={abrirNuevaColeccion}>
                                <Plus size={12} /> Crear
                            </BotonBase>
                        </div>
                    ) : (
                        <div className="panelLibreriaGrid">
                            {colecciones.map(col => (
                                <TarjetaColeccion key={col.id} coleccion={col} onClick={c => navegar(`/coleccion/${c.id}/`)}
                                    onEditar={manejarEditarColeccion} onEliminar={manejarEliminarColeccion} />
                            ))}
                        </div>
                    )
                ) : samples.length === 0 ? (
                    <div className="panelLibreriaVacio">
                        <Upload size={24} /><span>Sin samples subidos</span>
                        <BotonBase variante="ghost" tamano="sm" onClick={abrirSubirModal}>Subir sample</BotonBase>
                    </div>
                ) : (
                    <div className="panelLibreriaLista">
                        {samples.map(sample => (
                            <TarjetaSample key={sample.id} sample={sample} onLike={manejarLike}
                                onClickCreador={u => navegar(`/perfil/${u}`)} onClickTitulo={s => abrirDetalle(s)} />
                        ))}
                    </div>
                )}
            </div>

            <ModalColeccion abierto={modalColeccion} onCerrar={() => setModalColeccion(false)}
                onGuardar={manejarGuardarColeccion} coleccion={coleccionEditando} />
        </div>
    );
};

export default PanelLibreria;
