/*
 * SelectorPatron — Dropdown para cambiar entre patrones.
 * Flechas ◄ ► para navegar, nombre editable, + para crear nuevo.
 */

import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { Patron } from '../../types/mezclador';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Input } from '@app/components/ui/Input';

interface SelectorPatronProps {
    patrones: Patron[];
    patronActivo: string | null;
    onSeleccionar: (id: string) => void;
    onCrear: () => void;
    onRenombrar: (id: string, nombre: string) => void;
    onEliminar: (id: string) => void;
    onDuplicar: (id: string) => void;
}

export const SelectorPatron = ({
    patrones,
    patronActivo,
    onSeleccionar,
    onCrear,
    onRenombrar,
    onEliminar,
    onDuplicar,
}: SelectorPatronProps): JSX.Element => {
    const [editando, setEditando] = useState(false);
    const [listaAbierta, setListaAbierta] = useState(false);

    const patronActual = patrones.find(p => p.id === patronActivo);
    const indiceActual = patrones.findIndex(p => p.id === patronActivo);

    const irAnterior = useCallback(() => {
        if (indiceActual > 0) {
            onSeleccionar(patrones[indiceActual - 1].id);
        }
    }, [indiceActual, patrones, onSeleccionar]);

    const irSiguiente = useCallback(() => {
        if (indiceActual < patrones.length - 1) {
            onSeleccionar(patrones[indiceActual + 1].id);
        }
    }, [indiceActual, patrones, onSeleccionar]);

    const finalizarEdicion = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const valor = (e.target as HTMLInputElement).value.trim();
            if (valor && patronActivo) {
                onRenombrar(patronActivo, valor);
            }
            setEditando(false);
        }
        if (e.key === 'Escape') setEditando(false);
    }, [patronActivo, onRenombrar]);

    return (
        <div className="selectorPatron">
            <BotonBase variante="ghost"
                className="selectorPatronFlecha"
                onClick={irAnterior}
                disabled={indiceActual <= 0}
                title="Patrón anterior"
            >
                <ChevronLeft size={14} />
            </BotonBase>

            {editando ? (
                <>
                    <Input
                        className="selectorPatronInput"
                        defaultValue={patronActual?.nombre ?? ''}
                        autoFocus
                        onKeyDown={finalizarEdicion}
                        onBlur={() => setEditando(false)}
                    />
                </>
            ) : (
                <BotonBase variante="ghost"
                    className="selectorPatronNombre"
                    onClick={() => setListaAbierta(!listaAbierta)}
                    onDoubleClick={() => setEditando(true)}
                    style={{ color: patronActual?.color }}
                    title="Click: lista | Doble-click: renombrar"
                >
                    {patronActual?.nombre ?? 'Sin patrón'}
                </BotonBase>
            )}

            <BotonBase variante="ghost"
                className="selectorPatronFlecha"
                onClick={irSiguiente}
                disabled={indiceActual >= patrones.length - 1}
                title="Patrón siguiente"
            >
                <ChevronRight size={14} />
            </BotonBase>

            <BotonBase variante="ghost"
                className="selectorPatronBoton"
                onClick={onCrear}
                title="Crear nuevo patrón"
            >
                <Plus size={12} />
            </BotonBase>

            {/* Lista desplegable */}
            {listaAbierta && (
                <div className="selectorPatronLista">
                    {patrones.map(p => (
                        <div
                            key={p.id}
                            className={`selectorPatronItem ${p.id === patronActivo ? 'selectorPatronItemActivo' : ''}`}
                        >
                            <BotonBase variante="ghost"
                                className="selectorPatronItemNombre"
                                onClick={() => { onSeleccionar(p.id); setListaAbierta(false); }}
                                style={{ color: p.color }}
                            >
                                {p.nombre}
                            </BotonBase>
                            {patrones.length > 1 && (
                                <BotonBase variante="ghost"
                                    className="selectorPatronItemEliminar"
                                    onClick={() => onEliminar(p.id)}
                                    title="Eliminar patrón"
                                >
                                    <Trash2 size={10} />
                                </BotonBase>
                            )}
                            <BotonBase variante="ghost"
                                className="selectorPatronItemDuplicar"
                                onClick={() => { onDuplicar(p.id); setListaAbierta(false); }}
                                title="Duplicar patrón"
                            >
                                ⧉
                            </BotonBase>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
