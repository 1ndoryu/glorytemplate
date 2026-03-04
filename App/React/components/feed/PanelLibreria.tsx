/*
 * Componente: PanelLibreria — Kamples (C280)
 * SIN USO TEMPORAL — pendiente de integración con Explorador (C281).
 * Version compacta de la libreria para el panel lateral.
 * Lógica extraída a usePanelLibreria (SRP).
 */

import { FolderOpen, Globe, Plus, X, Music } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { usePanelLibreria } from '@app/hooks/usePanelLibreria';

const TABS = [
    { id: 'explorar' as const, icono: <Globe size={14} />, etiqueta: 'Explorar' },
    { id: 'colecciones' as const, icono: <FolderOpen size={14} />, etiqueta: 'Colecciones' },
];

export const PanelLibreria = (): JSX.Element => {
    const {
        tab, setTab, colecciones, coleccionesPublicas, cargando,
        modalColeccion, setModalColeccion, coleccionEditando,
        cerrarPanel,
        manejarGuardarColeccion, manejarEditarColeccion,
        manejarEliminarColeccion, abrirNuevaColeccion,
    } = usePanelLibreria();

    return (
        <div className="panelLibreria">
            <div className="panelLibreriaCabecera">
                <h3 className="panelLibreriaTitulo"><FolderOpen size={16} /> Libreria</h3>
                <BotonBase variante="ghost" className="panelLibreriaCerrar" onClick={cerrarPanel} type="button" aria-label="Cerrar">
                    <X size={16} />
                </BotonBase>
            </div>

            <div className="panelLibreriaTabs">
                {TABS.map(t => (
                    <BotonBase variante="ghost" key={t.id} className={`panelLibreriaTab ${tab === t.id ? 'panelLibreriaTabActiva' : ''}`}
                        onClick={() => setTab(t.id)} type="button">
                        {t.icono} {t.etiqueta}
                    </BotonBase>
                ))}
            </div>

            <div className="panelLibreriaAcciones">
                {tab === 'colecciones' && (
                    <BotonBase variante="ghost" tamano="sm" onClick={abrirNuevaColeccion}>
                        <Plus size={12} /> Nueva
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
                                <TarjetaColeccion key={col.id} coleccion={col} />
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
                                <TarjetaColeccion key={col.id} coleccion={col}
                                    onEditar={manejarEditarColeccion} onEliminar={manejarEliminarColeccion} />
                            ))}
                        </div>
                    )
                ) : null}
            </div>

            <ModalColeccion abierto={modalColeccion} onCerrar={() => setModalColeccion(false)}
                onGuardar={manejarGuardarColeccion} coleccion={coleccionEditando} />
        </div>
    );
};

export default PanelLibreria;
