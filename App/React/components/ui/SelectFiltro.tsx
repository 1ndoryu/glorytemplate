/*
 * SelectFiltro — Kamples (C116)
 * Dropdown personalizado para filtrar tags por categoría.
 * Estilo minimalista inspirado en MenuContextual.
 * Cada opción puede incluirse (+) o excluirse (-) del filtro.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown, Plus, Minus, X } from 'lucide-react';
import '../../styles/componentes/selectFiltro.css';

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
}

export const SelectFiltro = ({
    etiqueta,
    opciones,
    tagsIncluidos,
    tagsExcluidos,
    onIncluir,
    onExcluir,
    onQuitar,
}: SelectFiltroProps): JSX.Element | null => {
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Cantidad de tags activos en esta categoría */
    const activos = opciones.filter(
        (o) => tagsIncluidos.includes(o) || tagsExcluidos.includes(o)
    ).length;

    /* Cerrar al hacer click fuera */
    useEffect(() => {
        if (!abierto) return;
        const cerrar = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrar);
        return () => document.removeEventListener('mousedown', cerrar);
    }, [abierto]);

    /* Cerrar con Escape */
    useEffect(() => {
        if (!abierto) return;
        const manejarEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('keydown', manejarEscape);
        return () => document.removeEventListener('keydown', manejarEscape);
    }, [abierto]);

    const manejarClickOpcion = useCallback((tag: string) => {
        if (tagsIncluidos.includes(tag)) {
            onQuitar(tag);
        } else {
            onIncluir(tag);
        }
    }, [tagsIncluidos, onIncluir, onQuitar]);

    const manejarExcluir = useCallback((e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        if (tagsExcluidos.includes(tag)) {
            onQuitar(tag);
        } else {
            onExcluir(tag);
        }
    }, [tagsExcluidos, onExcluir, onQuitar]);

    if (opciones.length === 0) return null;

    return (
        <div className="selectFiltro" ref={contenedorRef}>
            <button
                type="button"
                className={`selectFiltroBoton ${activos > 0 ? 'selectFiltroBotonActivo' : ''}`}
                onClick={() => setAbierto(!abierto)}
                aria-expanded={abierto}
                aria-haspopup="listbox"
            >
                <span className="selectFiltroEtiqueta">{etiqueta}</span>
                {activos > 0 && <span className="selectFiltroContador">{activos}</span>}
                <ChevronDown size={12} className={`selectFiltroFlecha ${abierto ? 'selectFiltroFlechaAbierta' : ''}`} />
            </button>

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
                                    <button
                                        type="button"
                                        className="selectFiltroOpcionBtn selectFiltroOpcionBtnExcluir"
                                        title={excluido ? 'Quitar exclusión' : 'Excluir'}
                                        onClick={(e) => manejarExcluir(e, opcion)}
                                    >
                                        {excluido ? <X size={10} /> : <Minus size={10} />}
                                    </button>
                                    <button
                                        type="button"
                                        className="selectFiltroOpcionBtn selectFiltroOpcionBtnIncluir"
                                        title={incluido ? 'Quitar inclusión' : 'Incluir'}
                                        onClick={(e) => { e.stopPropagation(); manejarClickOpcion(opcion); }}
                                    >
                                        {incluido ? <X size={10} /> : <Plus size={10} />}
                                    </button>
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
