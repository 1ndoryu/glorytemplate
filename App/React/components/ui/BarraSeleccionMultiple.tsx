/*
 * BarraSeleccionMultiple — Barra inferior para acciones en lote sobre samples.
 * QL116: Reemplaza al reproductor cuando hay samples seleccionados.
 * Mismo tamaño y estilo que el ReproductorGlobal.
 */

import { Heart, HeartOff, Download, Trash2, FolderPlus, X, Loader2 } from 'lucide-react';
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
        todosConLike,
        manejarLikeTodos,
        manejarQuitarLikeTodos,
        manejarGuardarEnColeccion,
        manejarDescargarTodos,
        manejarEliminarTodos,
        limpiarSeleccion,
    } = useBarraSeleccionMultiple();

    /* [193A-66] useT DEBE ir antes de cualquier return condicional — Rules of Hooks */
    const { t } = useT();

    if (cantidad === 0) return null;

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
                        <Tooltip texto={todosConLike ? t('seleccionMultiple.quitarLike') : t('seleccionMultiple.darLike')} posicion="top">
                            <BotonBase variante="ghost" className="barraSeleccionBtn" onClick={todosConLike ? manejarQuitarLikeTodos : manejarLikeTodos} type="button" aria-label={todosConLike ? t('seleccionMultiple.quitarLike') : t('seleccionMultiple.darLike')}>
                                {todosConLike ? <HeartOff size={18} /> : <Heart size={18} />}
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
