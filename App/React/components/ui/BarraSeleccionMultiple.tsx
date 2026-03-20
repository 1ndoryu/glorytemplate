/*
 * BarraSeleccionMultiple — Barra inferior para acciones en lote sobre samples.
 * QL116: Reemplaza al reproductor cuando hay samples seleccionados.
 * Mismo tamaño y estilo que el ReproductorGlobal.
 */

import { Heart, Download, Trash2, FolderPlus, X, Flag, Loader2 } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Tooltip } from '@app/components/ui/Tooltip';
import { useBarraSeleccionMultiple } from '@app/hooks/useBarraSeleccionMultiple';
import { useT } from '@app/utils/i18n/useT';
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

    const { t } = useT();

    return (
        <div className="barraSeleccionMultiple" id="barraSeleccionMultiple">
            <div className="barraSeleccionInfo">
                <span className="barraSeleccionConteo">{t('seleccionMultiple.seleccionados', { cantidad: String(cantidad) })}</span>
            </div>

            <div className="barraSeleccionAcciones">
                {procesando ? (
                    <Loader2 size={18} className="barraSeleccionSpinner" />
                ) : (
                    <>
                        <Tooltip texto={t('seleccionMultiple.darLike')} posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={manejarLikeTodos} type="button" aria-label={t('seleccionMultiple.darLike')}>
                                <Heart size={18} />
                            </BotonBase>
                        </Tooltip>

                        <Tooltip texto={t('seleccionMultiple.guardarColeccion')} posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={manejarGuardarEnColeccion} type="button" aria-label={t('seleccionMultiple.guardarColeccion')}>
                                <FolderPlus size={18} />
                            </BotonBase>
                        </Tooltip>

                        <Tooltip texto={t('seleccionMultiple.descargar')} posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={manejarDescargarTodos} type="button" aria-label={t('seleccionMultiple.descargar')}>
                                <Download size={18} />
                            </BotonBase>
                        </Tooltip>

                        {puedeEliminar && (
                            <Tooltip texto={t('seleccionMultiple.eliminar')} posicion="top">
                                <BotonBase variante="ghost" className="barraSeleccionBtn barraSeleccionBtnPeligro" onClick={manejarEliminarTodos} type="button" aria-label={t('seleccionMultiple.eliminar')}>
                                    <Trash2 size={18} />
                                </BotonBase>
                            </Tooltip>
                        )}

                        <Tooltip texto={t('seleccionMultiple.reportar')} posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={() => { /* TO-DO: Implementar reporte masivo */ }} type="button" aria-label={t('seleccionMultiple.reportar')}>
                                <Flag size={18} />
                            </BotonBase>
                        </Tooltip>
                    </>
                )}
            </div>

            <BotonBase variante="ghost" className="barraSeleccionCerrar" onClick={limpiarSeleccion} type="button" aria-label={t('seleccionMultiple.cancelar')}>
                <X size={18} />
            </BotonBase>
        </div>
    );
};

export default BarraSeleccionMultiple;
