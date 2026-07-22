/*
 * PanelRecordatorios
 * Panel del plugin de Recordatorios.
 * Muestra recordatorios aleatorios (texto + imágenes) en intervalos configurables.
 */

import {useState} from 'react';
import {Bell, Plus, List, SkipForward, Trash2, Settings} from 'lucide-react';
import {SeccionEncabezado} from '../dashboard';
import {OverlayEnfoque, ToastDeshacer} from '../shared';
import {Boton} from '../ui';
import {usePanelRecordatorios} from '../../hooks/paneles/usePanelRecordatorios';
import {ModalCrearRecordatorio} from '../dashboard/ModalCrearRecordatorio';
import {ModalRecordatoriosGuardados} from '../dashboard/ModalRecordatoriosGuardados';
import {ModalConfiguracionRecordatorios} from '../dashboard/ModalConfiguracionRecordatorios';
import type {TamanoFuenteRecordatorio} from '../../types/recordatorios';

const CLASES_FUENTE: Record<TamanoFuenteRecordatorio, string> = {
    pequeno: 'recordatoriosTexto--pequeno',
    normal: '',
    grande: 'recordatoriosTexto--grande'
};

interface PanelRecordatoriosProps {
    renderHandleArrastre: (titulo?: string) => JSX.Element;
    handleMinimizar: JSX.Element;
}

export function PanelRecordatorios({renderHandleArrastre, handleMinimizar}: PanelRecordatoriosProps): JSX.Element {
    const {
        recordatorioActual, recordatorios, config,
        modalCrearAbierto, setModalCrearAbierto,
        modalListaAbierto, setModalListaAbierto,
        handleSiguiente, handleEliminar,
        handleGuardarCreacion,
        cambiarIntervaloMs, cambiarTamanoFuente,
        eliminadoPendiente, undoRestante, undoTotal,
        handleDeshacer, handleDescartarUndo
    } = usePanelRecordatorios();

    const [modoEnfoque, setModoEnfoque] = useState(false);
    const [configAbierta, setConfigAbierta] = useState(false);

    const totalConImagenes = recordatorioActual?.adjuntos?.length ?? 0;

    return (
        <div className="internaColumna internaColumna--recordatorios">
            <SeccionEncabezado
                icono={null}
                titulo={renderHandleArrastre('Recordatorios')}
                variante="panelHeader"
                acciones={
                    <>
                        <Boton variante="badge" soloIcono onClick={() => setModalCrearAbierto(true)} icono={<Plus size={12} />} title="Nuevo recordatorio" />
                        <Boton variante="badge" soloIcono onClick={() => setModalListaAbierto(true)} icono={<List size={12} />} title="Ver recordatorios guardados" />
                        {recordatorios.length > 1 && (
                            <Boton variante="badge" soloIcono onClick={handleSiguiente} icono={<SkipForward size={12} />} title="Siguiente" />
                        )}
                        <Boton
                            variante="badge"
                            soloIcono
                            onClick={() => setConfigAbierta(true)}
                            icono={<Settings size={12} />}
                            title="Configuración"
                        />
                        {recordatorioActual && (
                            <Boton variante="badge" soloIcono onClick={() => handleEliminar()} icono={<Trash2 size={12} />} title="Eliminar" />
                        )}
                        {handleMinimizar}
                    </>
                }
            />

            {/* Contenido del recordatorio actual */}
            <div className="recordatoriosContenido">
                {recordatorioActual ? (
                    <>
                        {/* Imágenes */}
                        {totalConImagenes > 0 && (
                            <div className="recordatoriosImagenes">
                                {recordatorioActual.adjuntos.map((adj, i) => (
                                    <div key={adj.id ?? i} className="recordatoriosImagenItem" onClick={() => setModoEnfoque(true)}>
                                        <img src={adj.thumbnailUrl || adj.url} alt={adj.nombre} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Texto - aplica tamaño de fuente configurado */}
                        {recordatorioActual.texto && (
                            <div className={`recordatoriosTexto ${CLASES_FUENTE[config.tamanoFuente]}`}>
                                <p>{recordatorioActual.texto}</p>
                            </div>
                        )}


                    </>
                ) : (
                    <div className="recordatoriosVacio">
                        <Bell size={32} />
                        <span>Sin recordatorios</span>
                        <p>Crea tu primer recordatorio con el botón +</p>
                    </div>
                )}
            </div>

            {/* Modal crear */}
            <ModalCrearRecordatorio
                abierto={modalCrearAbierto}
                onCerrar={() => setModalCrearAbierto(false)}
                onGuardar={handleGuardarCreacion}
            />

            {/* Modal lista */}
            <ModalRecordatoriosGuardados
                abierto={modalListaAbierto}
                onCerrar={() => setModalListaAbierto(false)}
            />

            {/* Modal configuración */}
            <ModalConfiguracionRecordatorios
                estaAbierto={configAbierta}
                onCerrar={() => setConfigAbierta(false)}
                configuracion={config}
                onCambiarIntervaloMs={cambiarIntervaloMs}
                onCambiarTamanoFuente={cambiarTamanoFuente}
            />

            {/* Toast de undo cuando se elimina un recordatorio */}
            {eliminadoPendiente && (
                <ToastDeshacer
                    mensaje="Recordatorio eliminado"
                    tiempoRestante={undoRestante}
                    tiempoTotal={undoTotal}
                    onDeshacer={handleDeshacer}
                    onDescartar={handleDescartarUndo}
                />
            )}

            {/* Overlay enfoque para imágenes */}
            {recordatorioActual && (
                <OverlayEnfoque estaActivo={modoEnfoque} onCerrar={() => setModoEnfoque(false)} titulo={recordatorioActual.texto || 'Recordatorio'}>
                    {recordatorioActual.adjuntos.length > 0 && (
                        <div className="recordatoriosEnfoqueImagenes">
                            {recordatorioActual.adjuntos.map((adj, i) => (
                                <img key={adj.id ?? i} src={adj.url} alt={adj.nombre} />
                            ))}
                        </div>
                    )}
                    {recordatorioActual.texto && (
                        <p className="recordatoriosEnfoqueTexto">{recordatorioActual.texto}</p>
                    )}
                </OverlayEnfoque>
            )}
        </div>
    );
}
