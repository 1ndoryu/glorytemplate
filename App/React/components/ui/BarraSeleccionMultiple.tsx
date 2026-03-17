/*
 * BarraSeleccionMultiple — Barra inferior para acciones en lote sobre samples.
 * QL116: Reemplaza al reproductor cuando hay samples seleccionados.
 * Mismo tamaño y estilo que el ReproductorGlobal.
 */

import { Heart, Download, Trash2, FolderPlus, X, Flag, Loader2 } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Tooltip } from '@app/components/ui/Tooltip';
import { useBarraSeleccionMultiple } from '@app/hooks/useBarraSeleccionMultiple';
import '../../styles/componentes/barraSeleccionMultiple.css';

export const BarraSeleccionMultiple = (): JSX.Element | null => {
    const {
        cantidad,
        procesando,
        puedeEliminar,
        manejarLikeTodos,
        manejarGuardarEnColeccion,
        manejarDescargarTodos,
        manejarEliminarTodos,
        limpiarSeleccion,
    } = useBarraSeleccionMultiple();

    if (cantidad === 0) return null;

    return (
        <div className="barraSeleccionMultiple" id="barraSeleccionMultiple">
            <div className="barraSeleccionInfo">
                <span className="barraSeleccionConteo">{cantidad} seleccionados</span>
            </div>

            <div className="barraSeleccionAcciones">
                {procesando ? (
                    <Loader2 size={18} className="barraSeleccionSpinner" />
                ) : (
                    <>
                        <Tooltip texto="Dar like" posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={manejarLikeTodos} type="button" aria-label="Dar like a seleccionados">
                                <Heart size={18} />
                            </BotonBase>
                        </Tooltip>

                        <Tooltip texto="Guardar en colección" posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={manejarGuardarEnColeccion} type="button" aria-label="Guardar en colección">
                                <FolderPlus size={18} />
                            </BotonBase>
                        </Tooltip>

                        <Tooltip texto="Descargar" posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={manejarDescargarTodos} type="button" aria-label="Descargar seleccionados">
                                <Download size={18} />
                            </BotonBase>
                        </Tooltip>

                        {puedeEliminar && (
                            <Tooltip texto="Eliminar" posicion="top">
                                <BotonBase variante="ghost" className="barraSeleccionBtn barraSeleccionBtnPeligro" onClick={manejarEliminarTodos} type="button" aria-label="Eliminar seleccionados">
                                    <Trash2 size={18} />
                                </BotonBase>
                            </Tooltip>
                        )}

                        <Tooltip texto="Reportar" posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={() => { /* TO-DO: Implementar reporte masivo */ }} type="button" aria-label="Reportar seleccionados">
                                <Flag size={18} />
                            </BotonBase>
                        </Tooltip>
                    </>
                )}
            </div>

            <BotonBase variante="ghost" className="barraSeleccionCerrar" onClick={limpiarSeleccion} type="button" aria-label="Cancelar selección">
                <X size={18} />
            </BotonBase>
        </div>
    );
};

export default BarraSeleccionMultiple;
