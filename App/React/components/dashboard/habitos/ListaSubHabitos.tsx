/*
 * ListaSubHabitos
 * Componente para gestionar subhábitos dentro de la configuración de un Hábito padre.
 * Usa los mismos estilos CSS que ListaSubtareas (listaTareasHabito__*) para consistencia visual.
 * Los subhábitos heredan frecuencia e importancia del padre al crearse.
 *
 * [253A-1] Edición inline de nombre: doble clic o Enter para editar.
 *   Filtrado de subhábitos fantasma (sin nombre válido).
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import {Check, Plus, Trash2, Pencil, Flame, Settings} from 'lucide-react';
import type {SubHabito, NivelImportancia, FrecuenciaHabito, DatosNuevoSubHabito} from '../../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../../types/dashboard';
import {obtenerFechaHoy} from '../../../utils/fecha';
import {Boton, Input} from '../../ui';

interface ListaSubHabitosProps {
    subhabitos: SubHabito[];
    onCrear: (datos: DatosNuevoSubHabito) => void;
    onEditar?: (subHabitoId: number, datos: DatosNuevoSubHabito) => void;
    onEliminar: (subHabitoId: number) => void;
    onToggle: (subHabitoId: number) => void;
    onConfigurarSubHabito?: (subhabito: SubHabito) => void;
    importanciaPadre: NivelImportancia;
    frecuenciaPadre?: FrecuenciaHabito;
}

/*
 * Fila individual de subhábito - Usa clases listaTareasHabito__* para consistencia con subtareas
 * [253A-1] Soporta edición inline de nombre: doble clic para activar.
 */
interface FilaSubHabitoProps {
    subhabito: SubHabito;
    onToggle: () => void;
    onEliminar: () => void;
    onEditar?: (nombre: string) => void;
    onConfigurar?: () => void;
}

function FilaSubHabito({subhabito, onToggle, onEliminar, onEditar, onConfigurar}: FilaSubHabitoProps): JSX.Element {
    const hoy = obtenerFechaHoy();
    const completadoHoy = subhabito.ultimoCompletado === hoy;
    const [editando, setEditando] = useState(false);
    const [textoEdicion, setTextoEdicion] = useState(subhabito.nombre);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editando && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editando]);

    const confirmarEdicion = useCallback(() => {
        const nuevoNombre = textoEdicion.trim();
        if (nuevoNombre && nuevoNombre !== subhabito.nombre && onEditar) {
            onEditar(nuevoNombre);
        }
        setEditando(false);
    }, [textoEdicion, subhabito.nombre, onEditar]);

    const cancelarEdicion = useCallback(() => {
        setTextoEdicion(subhabito.nombre);
        setEditando(false);
    }, [subhabito.nombre]);

    return (
        <div className={`listaTareasHabito__item ${completadoHoy ? 'listaTareasHabito__item--completado' : ''} listaTareasHabito__item--sinDrag`}>
            {/* Checkbox - Estilo unificado con tareaCheckbox */}
            <div
                className={`tareaCheckbox ${completadoHoy ? 'tareaCheckboxCompletado' : ''}`}
                onClick={e => {
                    e.stopPropagation();
                    onToggle();
                }}
                onPointerDown={e => e.stopPropagation()}>
                {completadoHoy && <Check size={10} color="white" />}
            </div>

            {/* Contenido (Texto) - doble clic para editar */}
            <div className="listaTareasHabito__contenido">
                {editando ? (
                    <Input
                        ref={inputRef}
                        tipo="text"
                        claseAdicional="listaTareasHabito__inputEdicion"
                        value={textoEdicion}
                        onChange={e => setTextoEdicion(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') confirmarEdicion();
                            if (e.key === 'Escape') cancelarEdicion();
                        }}
                        onBlur={confirmarEdicion}
                        onClick={e => e.stopPropagation()}
                        onPointerDown={e => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className="listaTareasHabito__texto"
                        onClick={() => {
                            if (onEditar) {
                                setTextoEdicion(subhabito.nombre);
                                setEditando(true);
                            }
                        }}>
                        {subhabito.nombre}
                    </span>
                )}
                {/* Badge de racha si tiene */}
                {!editando && subhabito.racha > 0 && (
                    <span className="badgeInfo badgeInfo--racha">
                        {/* [044A-14] Reemplazado emoji por icono SVG Flame */}
                        <span className="badgeInfoTexto"><Flame size={12} /> {subhabito.racha}</span>
                    </span>
                )}
            </div>

            {/* Botón configurar hábito padre */}
            {onConfigurar && !editando && (
                <Boton
                    variante="icono"
                    claseAdicional="listaTareasHabito__eliminar"
                    onClick={e => {
                        e.stopPropagation();
                        onConfigurar();
                    }}
                    onPointerDown={e => e.stopPropagation()}
                    title="Configurar hábito">
                    <Settings size={14} />
                </Boton>
            )}

            {/* Botón editar (solo si hay callback) */}
            {onEditar && !editando && (
                <Boton
                    variante="icono"
                    claseAdicional="listaTareasHabito__eliminar"
                    onClick={e => {
                        e.stopPropagation();
                        setTextoEdicion(subhabito.nombre);
                        setEditando(true);
                    }}
                    onPointerDown={e => e.stopPropagation()}
                    title="Editar nombre">
                    <Pencil size={14} />
                </Boton>
            )}

            {/* Botón eliminar */}
            {/* [243A-11] variante=icono para no heredar estilos de boton--primario que tapan el opacity:0 base */}
            <Boton
                variante="icono"
                claseAdicional="listaTareasHabito__eliminar"
                onClick={e => {
                    e.stopPropagation();
                    onEliminar();
                }}
                onPointerDown={e => e.stopPropagation()}
                title="Eliminar">
                <Trash2 size={14} />
            </Boton>
        </div>
    );
}

/*
 * Lista principal de subhábitos - Usa clases listaTareasHabito__* para consistencia con subtareas
 */
export function ListaSubHabitos({subhabitos, onCrear, onEditar, onEliminar, onToggle, onConfigurarSubHabito, importanciaPadre, frecuenciaPadre}: ListaSubHabitosProps): JSX.Element {
    const [textoNuevo, setTextoNuevo] = useState('');
    const [mostrarInput, setMostrarInput] = useState(false);

    /* Crear nuevo subhábito - hereda propiedades del padre */
    const manejarCrear = useCallback(() => {
        if (!textoNuevo.trim()) return;

        onCrear({
            nombre: textoNuevo.trim(),
            importancia: importanciaPadre,
            frecuencia: frecuenciaPadre || FRECUENCIA_POR_DEFECTO
        });

        setTextoNuevo('');
    }, [textoNuevo, onCrear, importanciaPadre, frecuenciaPadre]);

    const hoy = obtenerFechaHoy();
    /* [253A-1] Filtrar subhábitos fantasma (sin nombre válido) para evitar items irremovibles */
    const subhabitosValidos = subhabitos.filter(sh => sh.nombre && sh.nombre.trim());
    const completados = subhabitosValidos.filter(sh => sh.ultimoCompletado === hoy).length;
    const total = subhabitosValidos.length;

    return (
        <div className="listaTareasHabito listaTareasHabito--compacto">
            {/* Header con contador - Sin colapsar */}
            <div className="listaTareasHabito__encabezado">
                <span className="listaTareasHabito__titulo">Subhábitos</span>
                {total > 0 && (
                    <span className="listaTareasHabito__contador">
                        {completados}/{total}
                    </span>
                )}
            </div>

            {/* Lista de subhábitos */}
            {subhabitosValidos.length > 0 && (
                <div className="listaTareasHabito__lista">
                    {subhabitosValidos.map(sh => (
                        <FilaSubHabito
                            key={sh.id}
                            subhabito={sh}
                            onToggle={() => onToggle(sh.id)}
                            onEliminar={() => onEliminar(sh.id)}
                            onEditar={
                                onEditar
                                    ? nombre =>
                                          onEditar(sh.id, {
                                              nombre,
                                              importancia: sh.importancia,
                                              frecuencia: sh.frecuencia
                                          })
                                    : undefined
                            }
                            onConfigurar={onConfigurarSubHabito ? () => onConfigurarSubHabito(sh) : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {subhabitosValidos.length === 0 && !mostrarInput && <div className="listaTareasHabito__vacio">No hay subhábitos</div>}

            {/* Input simple - Enter para guardar */}
            {mostrarInput ? (
                <form
                    className="listaTareasHabito__inputContenedor"
                    onSubmit={e => {
                        e.preventDefault();
                        manejarCrear();
                    }}>
                    <Input
                        tipo="text"
                        claseAdicional="listaTareasHabito__input"
                        placeholder="Nuevo subhábito..."
                        value={textoNuevo}
                        onChange={e => setTextoNuevo(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Escape') {
                                setMostrarInput(false);
                                setTextoNuevo('');
                            }
                        }}
                        onBlur={() => {
                            if (!textoNuevo.trim()) {
                                setTimeout(() => setMostrarInput(false), 150);
                            }
                        }}
                        autoFocus
                    />
                </form>
            ) : (
                /* Estilo unificado con añadirHabito — claseAdicional sobreescribe variante via selector .añadirHabito.boton */
                <Boton type="button" variante="ghost" claseAdicional="añadirHabito" onClick={() => setMostrarInput(true)}>
                    <Plus size={12} />
                    <span>Añadir subhábito</span>
                </Boton>
            )}
        </div>
    );
}
