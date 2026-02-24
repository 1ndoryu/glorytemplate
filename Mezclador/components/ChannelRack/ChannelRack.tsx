/*
 * ChannelRack — Contenedor principal del Channel Rack.
 * Renderiza dentro de VentanaFlotante. Contiene:
 * - CabeceraChannelRack (selector patrón + swing + loop)
 * - Lista de CanalStrip (canales + step grids)
 * - GraphEditor (velocity/pan/pitch por paso)
 * - Botón para agregar canales
 */

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { usePatronesStore } from '../../stores/patronesStore';
import { VentanaFlotante } from '../VentanaFlotante';
import { CabeceraChannelRack } from './CabeceraChannelRack';
import { CanalStrip } from './CanalStrip';
import { GraphEditor } from './GraphEditor';
import { BotonBase } from '@app/components/ui/BotonBase';

export const ChannelRack = (): JSX.Element | null => {
    const patrones = usePatronesStore(s => s.patrones);
    const patronActivo = usePatronesStore(s => s.patronActivo);
    const crearPatron = usePatronesStore(s => s.crearPatron);
    const eliminarPatron = usePatronesStore(s => s.eliminarPatron);
    const renombrarPatron = usePatronesStore(s => s.renombrarPatron);
    const duplicarPatron = usePatronesStore(s => s.duplicarPatron);
    const setPatronActivo = usePatronesStore(s => s.setPatronActivo);
    const agregarCanal = usePatronesStore(s => s.agregarCanal);
    const eliminarCanal = usePatronesStore(s => s.eliminarCanal);
    const actualizarCanal = usePatronesStore(s => s.actualizarCanal);
    const togglePaso = usePatronesStore(s => s.togglePaso);
    const setPaso = usePatronesStore(s => s.setPaso);
    const setSwing = usePatronesStore(s => s.setSwing);
    const toggleLoop = usePatronesStore(s => s.toggleLoop);

    const patronActual = patrones.find(p => p.id === patronActivo);

    /* Canal seleccionado para el GraphEditor */
    const [canalGraphEditor, setCanalGraphEditor] = useState<string | null>(null);

    const alAgregarCanal = useCallback(() => {
        if (!patronActivo) return;
        agregarCanal(patronActivo);
    }, [patronActivo, agregarCanal]);

    const toggleGraphEditor = useCallback((canalId: string) => {
        setCanalGraphEditor(prev => prev === canalId ? null : canalId);
    }, []);

    return (
        <VentanaFlotante
            id="channelRack"
            titulo="Channel Rack"
            ancho={800}
        >
            <div className="channelRack">
                {/* Cabecera: selector patrón + swing + loop */}
                <CabeceraChannelRack
                    patrones={patrones}
                    patronActivo={patronActivo}
                    patronActual={patronActual}
                    onSeleccionar={setPatronActivo}
                    onCrear={() => crearPatron()}
                    onRenombrar={renombrarPatron}
                    onEliminar={eliminarPatron}
                    onDuplicar={duplicarPatron}
                    onSetSwing={setSwing}
                    onToggleLoop={toggleLoop}
                />

                {/* Lista de canales con step grids */}
                <div className="channelRackCanales">
                    {patronActual?.canales.map(canal => (
                        <div key={canal.id}>
                            <div
                                className="channelRackCanalWrapper"
                                onDoubleClick={() => toggleGraphEditor(canal.id)}
                            >
                                <CanalStrip
                                    canal={canal}
                                    patronId={patronActual.id}
                                    onTogglePaso={togglePaso}
                                    onActualizarCanal={actualizarCanal}
                                    onEliminarCanal={eliminarCanal}
                                />
                            </div>

                            {/* GraphEditor expandido para este canal */}
                            {canalGraphEditor === canal.id && (
                                <GraphEditor
                                    canal={canal}
                                    patronId={patronActual.id}
                                    onSetPaso={setPaso}
                                />
                            )}
                        </div>
                    ))}

                    {/* Botón agregar canal */}
                    <BotonBase variante="ghost"
                        className="channelRackAgregarCanal"
                        onClick={alAgregarCanal}
                        title="Agregar canal"
                    >
                        <Plus size={14} />
                        <span>Agregar canal</span>
                    </BotonBase>
                </div>

                {/* Info cuando no hay canales */}
                {patronActual && patronActual.canales.length === 0 && (
                    <div className="channelRackVacio">
                        Arrastra samples desde el explorador o haz click en + para agregar canales
                    </div>
                )}
            </div>
        </VentanaFlotante>
    );
};
