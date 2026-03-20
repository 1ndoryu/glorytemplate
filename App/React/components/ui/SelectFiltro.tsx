/*
 * SelectFiltro — Kamples (C116)
 * Dropdown personalizado para filtrar tags por categoría.
 * Estilo minimalista inspirado en MenuContextual.
 * Cada opción puede incluirse (+) o excluirse (-) del filtro.
 * Lógica extraída a useSelectFiltro hook.
 */

import { Plus, Minus, X } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { useSelectFiltro } from '../../hooks/useSelectFiltro';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/selectFiltro.css';
import { BotonBase } from './BotonBase';

export interface SelectFiltroProps {
    /* Etiqueta visible del select (ej: "Género", "Instrumento") */
    etiqueta: string;
    /* Opciones disponibles */
    opciones: string[];
    /* Tags actualmente incluidos */
    tagsIncluidos: string[];
    /* Tags actualmente excluidos */
    tagsExcluidos: string[];
    /* Callback al incluir un tag */
    onIncluir: (tag: string) => void;
    /* Callback al excluir un tag */
    onExcluir: (tag: string) => void;
    /* Callback al quitar un tag (ni incluido ni excluido) */
    onQuitar: (tag: string) => void;
    /* [193A-30] Búsqueda server-side al seleccionar una opción */
    onBuscar?: (tag: string) => void;
}

export const SelectFiltro = ({
    etiqueta,
    opciones,
    tagsIncluidos,
    tagsExcluidos,
    onIncluir,
    onExcluir,
    onQuitar,
    onBuscar,
}: SelectFiltroProps): JSX.Element | null => {
    const { t } = useT();
    const {
        abierto,
        activos,
        contenedorRef,
        toggleAbierto,
        manejarClickOpcion,
        manejarExcluir,
    } = useSelectFiltro({ opciones, tagsIncluidos, tagsExcluidos, onIncluir, onExcluir, onQuitar, onBuscar });

    if (opciones.length === 0) return null;

    return (
        <div className="selectFiltro" ref={contenedorRef}>
            <BotonBase variante="ghost"
                type="button"
                className={`selectFiltroBoton ${activos > 0 ? 'selectFiltroBotonActivo' : ''}`}
                onClick={toggleAbierto}
                aria-expanded={abierto}
                aria-haspopup="listbox"
            >
                <span className="selectFiltroEtiqueta">{etiqueta}</span>
                {activos > 0 && <span className="selectFiltroContador">{activos}</span>}
                <ChevronDown size={12} className={`selectFiltroFlecha ${abierto ? 'selectFiltroFlechaAbierta' : ''}`} />
            </BotonBase>

            {abierto && (
                <div className="selectFiltroMenu" role="listbox">
                    {opciones.map((opcion) => {
                        const incluido = tagsIncluidos.includes(opcion);
                        const excluido = tagsExcluidos.includes(opcion);
                        return (
                            <div
                                key={opcion}
                                className={`selectFiltroOpcion ${incluido ? 'selectFiltroOpcionIncluida' : ''} ${excluido ? 'selectFiltroOpcionExcluida' : ''}`}
                                role="option"
                                aria-selected={incluido}
                                onClick={() => manejarClickOpcion(opcion)}
                            >
                                <span className="selectFiltroOpcionTexto">{opcion}</span>
                                <div className="selectFiltroOpcionAcciones">
                                    <BotonBase variante="ghost"
                                        type="button"
                                        className="selectFiltroOpcionBtn selectFiltroOpcionBtnExcluir"
                                        title={excluido ? t('filtros.quitarExclusion') : t('filtros.excluir')}
                                        onClick={(e) => manejarExcluir(e, opcion)}
                                    >
                                        {excluido ? <X size={10} /> : <Minus size={10} />}
                                    </BotonBase>
                                    <BotonBase variante="ghost"
                                        type="button"
                                        className="selectFiltroOpcionBtn selectFiltroOpcionBtnIncluir"
                                        title={incluido ? t('filtros.quitarInclusion') : t('filtros.incluir')}
                                        onClick={(e) => { e.stopPropagation(); manejarClickOpcion(opcion); }}
                                    >
                                        {incluido ? <X size={10} /> : <Plus size={10} />}
                                    </BotonBase>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SelectFiltro;
