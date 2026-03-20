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
import { useT } from '@app/utils/i18n/useT';

const TABS = [
    { id: 'explorar' as const },
    { id: 'colecciones' as const },
];

export const PanelLibreria = (): JSX.Element => {
    const {
        tab, setTab, colecciones, coleccionesPublicas, cargando,
        modalColeccion, setModalColeccion, coleccionEditando,
        cerrarPanel,
        manejarGuardarColeccion, manejarEditarColeccion,
        manejarEliminarColeccion, abrirNuevaColeccion,
    } = usePanelLibreria();

    const { t } = useT();

    return (
        <div className="panelLibreria">
            <div className="panelLibreriaCabecera">
                <h3 className="panelLibreriaTitulo"><FolderOpen size={16} /> {t('panel.libreria.titulo')}</h3>
                <BotonBase variante="ghost" className="panelLibreriaCerrar" onClick={cerrarPanel} type="button" aria-label={t('comun.cerrar')}>
                    <X size={16} />
                </BotonBase>
            </div>

            <div className="panelLibreriaTabs">
                {TABS.map(item => {
                    const icono = item.id === 'explorar' ? <Globe size={14} /> : <FolderOpen size={14} />;
                    const etiqueta = item.id === 'explorar' ? t('panel.libreria.explorar') : t('panel.libreria.colecciones');
                    return (
                        <BotonBase variante="ghost" key={item.id} className={`panelLibreriaTab ${tab === item.id ? 'panelLibreriaTabActiva' : ''}`}
                            onClick={() => setTab(item.id)} type="button">
                            {icono} {etiqueta}
                        </BotonBase>
                    );
                })}
            </div>

            <div className="panelLibreriaAcciones">
                {tab === 'colecciones' && (
                    <BotonBase variante="ghost" tamano="sm" onClick={abrirNuevaColeccion}>
                        <Plus size={12} /> {t('panel.libreria.nueva')}
                    </BotonBase>
                )}
            </div>

            <div className="panelLibreriaContenido">
                {cargando ? (
                    <div className="panelLibreriaVacio"><Music size={24} /><span>{t('panel.libreria.cargando')}</span></div>
                ) : tab === 'explorar' ? (
                    coleccionesPublicas.length === 0 ? (
                        <div className="panelLibreriaVacio"><Globe size={24} /><span>{t('panel.libreria.sinPublicas')}</span></div>
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
                            <FolderOpen size={24} /><span>{t('panel.libreria.sinColecciones')}</span>
                            <BotonBase variante="ghost" tamano="sm" onClick={abrirNuevaColeccion}>
                                <Plus size={12} /> {t('panel.libreria.crear')}
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
