/*
 * ModalEliminarColeccion — Modal de confirmación para eliminar colección.
 * QL119: Opciones configurables para samples e hijas.
 */

import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { SelectorMenu } from '@app/components/ui/SelectorMenu';
import { useModalEliminarColeccion } from '@app/hooks/useModalEliminarColeccion';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/modalEliminarColeccion.css';

interface ModalEliminarColeccionProps {
    abierto: boolean;
    onCerrar: () => void;
    onEliminado?: () => void;
    coleccion: Coleccion | null;
}

export const ModalEliminarColeccion = ({
    abierto,
    onCerrar,
    onEliminado,
    coleccion,
}: ModalEliminarColeccionProps): JSX.Element | null => {
    const {
        borrarSamples,
        setBorrarSamples,
        manejoHijas,
        setManejoHijas,
        borrarSamplesHijas,
        setBorrarSamplesHijas,
        eliminando,
        tieneHijas,
        totalSamplesHijas,
        opcionesSamples,
        opcionesManejoHijas,
        opcionesSamplesHijas,
        manejarEliminar,
    } = useModalEliminarColeccion({ abierto, onCerrar, onEliminado, coleccion });

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="pequeno">
            <div className="modalEliminarContenido">
                <div className="modalEliminarIcono">
                    <Trash2 size={32} />
                </div>

                <h3 className="modalEliminarTitulo">Eliminar colección</h3>
                <p className="modalEliminarDescripcion">
                    Vas a eliminar <strong>{coleccion?.nombre}</strong>
                    {coleccion?.totalSamples ? ` (${coleccion.totalSamples} samples)` : ''}.
                    Esta acción no se puede deshacer.
                </p>

                {/* Opción: qué hacer con los samples */}
                <div className="modalEliminarCampo">
                    <span className="modalEliminarCampoEtiqueta">Samples de esta colección</span>
                    <SelectorMenu
                        opciones={opcionesSamples}
                        valor={borrarSamples}
                        onChange={setBorrarSamples}
                    />
                </div>

                {/* Opciones para subcolecciones (solo si tiene hijas) */}
                {tieneHijas && (
                    <>
                        <div className="modalEliminarCampo">
                            <span className="modalEliminarCampoEtiqueta">
                                Subcolecciones ({coleccion?.subcolecciones?.length ?? 0})
                            </span>
                            <SelectorMenu
                                opciones={opcionesManejoHijas}
                                valor={manejoHijas}
                                onChange={setManejoHijas}
                            />
                        </div>

                        {manejoHijas === 'eliminar' && (
                            <div className="modalEliminarCampo">
                                <span className="modalEliminarCampoEtiqueta">
                                    Samples de las subcolecciones
                                    {totalSamplesHijas > 0 ? ` (${totalSamplesHijas})` : ''}
                                </span>
                                <SelectorMenu
                                    opciones={opcionesSamplesHijas}
                                    valor={borrarSamplesHijas}
                                    onChange={setBorrarSamplesHijas}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Advertencia si se eliminan samples */}
                {(borrarSamples === 'eliminar' || (manejoHijas === 'eliminar' && borrarSamplesHijas === 'eliminar')) && (
                    <div className="modalEliminarAdvertencia">
                        <AlertTriangle size={16} />
                        <span>Los samples eliminados se borrarán permanentemente de la plataforma.</span>
                    </div>
                )}

                <ModalAcciones>
                    <BotonBase variante="secundario" onClick={onCerrar}>
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="peligro"
                        onClick={manejarEliminar}
                        disabled={eliminando}
                    >
                        {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalEliminarColeccion;
