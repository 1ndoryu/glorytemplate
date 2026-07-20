/*
 * TareaConColapsador
 * Wrapper que añade funcionalidad de colapso de subtareas y swipe en móvil
 * Tarea 0.1: Integración de SwipeableItem para gestos móviles
 */

import React from 'react';
import {Check, Trash2, Clock} from 'lucide-react';
import {Boton} from '../../ui';
import {Tarea, Proyecto, DatosEdicionTarea, DatosNuevoHabito, TareaHabito, esTareaHabito} from '../../../types/dashboard';
import {TareaItem} from '../TareaItem';
import {tieneSubtareas, contarSubtareas} from '../../../utils/jerarquiaTareas';
import {SwipeableItem} from '../../shared/SwipeableItem';
import {useEsMovil} from '../../../hooks/useEsMovil';

interface TareaConColapsadorProps {
    tarea: Tarea;
    esSubtarea: boolean;
    tareas: Tarea[];
    tareasExpandidas: Set<number>;
    onToggleExpandir: (id: number) => void;
    proyectos: Proyecto[];
    modoCompacto: boolean;
    ocultarBadgeProyecto: boolean;
    mensajesNoLeidos: number;
    estaCompartida: boolean;

    // Callbacks
    onToggleTarea?: (id: number) => void;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onIndent: (id: number) => void;
    onOutdent: (id: number) => void;
    onCrearNueva: (parentId: number | undefined, tareaActualId: number) => void;
    onConfigurar: (id: number) => void;
    onMoverProyecto: (tarea: Tarea) => void;
    onCompartir?: (tarea: Tarea) => void;

    // Hábitos - Sincronizado con TablaHabitos (Fase UI/UX)
    onEditarHabito?: (id: number) => void;
    onEliminarHabito?: (id: number) => void;
    onToggleHabito?: (id: number) => void;
    onPosponerHabito?: (id: number) => void;
    onPosponerHabitoConTiempo?: (id: number, hasta: string | null) => void;
    onPausarHabito?: (id: number) => void;
    onActualizarHabito?: (id: number, datos: Partial<DatosNuevoHabito>) => void;

    // Selección múltiple (Ctrl+Click) - TAREA 3.1
    estaSeleccionada?: boolean;
    onSeleccionMultiple?: (tarea: Tarea, evento: React.MouseEvent) => void;
    modoSeleccionActivo?: boolean;

    /* [207A-3] Subhábitos: callbacks para menú contextual */
    onToggleSubHabito?: (habitoId: number, subHabitoId: number) => void;
    onEliminarSubHabito?: (habitoId: number, subHabitoId: number) => void;
}

export const TareaConColapsador: React.FC<TareaConColapsadorProps> = ({tarea, esSubtarea, tareas, tareasExpandidas, onToggleExpandir, proyectos, modoCompacto, ocultarBadgeProyecto, mensajesNoLeidos, estaCompartida, onToggleTarea, onEditarTarea, onEliminarTarea, onIndent, onOutdent, onCrearNueva, onConfigurar, onMoverProyecto, onCompartir, onEditarHabito, onEliminarHabito, onToggleHabito, onPosponerHabito, onPosponerHabitoConTiempo, onPausarHabito, onActualizarHabito, estaSeleccionada, onSeleccionMultiple, modoSeleccionActivo, onToggleSubHabito, onEliminarSubHabito}) => {
    const {esMovil} = useEsMovil();
    const esHabito = esTareaHabito(tarea);
    const esColapsable = !esSubtarea && tieneSubtareas(tareas, tarea.id);
    const estaExpandida = tareasExpandidas.has(tarea.id);
    const subtareasOcultas = !estaExpandida;
    const numSubtareas = contarSubtareas(tareas, tarea.id);

    const proyecto = tarea.proyectoId ? proyectos?.find(p => p.id === tarea.proyectoId) : undefined;
    let nombreProyecto: string | undefined = undefined;

    if (proyecto?.nombre) {
        nombreProyecto = proyecto.nombre;
        if (!ocultarBadgeProyecto && nombreProyecto.length > 20) {
            nombreProyecto = nombreProyecto.substring(0, 20) + '...';
        }
    }

    /* Callbacks para swipe - Diferenciado para hábitos y tareas */
    const manejarSwipeCompletar = () => {
        if (esHabito && onToggleHabito) {
            onToggleHabito((tarea as TareaHabito).habitoId);
        } else {
            onToggleTarea?.(tarea.id);
        }
    };

    /*
     * TAREA 6: Swipe izquierda diferenciado
     * - Hábitos: Posponer (más útil que eliminar)
     * - Tareas normales: Eliminar
     */
    const manejarSwipeIzquierda = () => {
        if (esHabito && onPosponerHabito) {
            onPosponerHabito((tarea as TareaHabito).habitoId);
        } else {
            onEliminarTarea?.(tarea.id);
        }
    };

    /* Configuración de acciones de swipe */
    const accionCompletar = {
        color: 'var(--dashboard-estadoExito)',
        icono: <Check size={20} />,
        etiqueta: tarea.completado ? 'Reactivar' : 'Completar'
    };

    /* TAREA 6: Acción izquierda diferenciada para hábitos (posponer) vs tareas (eliminar) */
    const accionIzquierda = esHabito
        ? {
              color: 'var(--dashboard-estadoAdvertencia)',
              icono: <Clock size={20} />,
              etiqueta: 'Posponer'
          }
        : {
              color: 'var(--dashboard-estadoError)',
              icono: <Trash2 size={20} />,
              etiqueta: 'Eliminar'
          };

    /* TareaItem con todas las props */
    const tareaItemElement = (
        <TareaItem
            tarea={tarea}
            esSubtarea={esSubtarea}
            onToggle={() => onToggleTarea?.(tarea.id)}
            onEditar={datos => onEditarTarea?.(tarea.id, datos)}
            onEliminar={() => onEliminarTarea?.(tarea.id)}
            onIndent={() => onIndent(tarea.id)}
            onOutdent={() => onOutdent(tarea.id)}
            onCrearNueva={onCrearNueva}
            onConfigurar={() => onConfigurar(tarea.id)}
            nombreProyecto={nombreProyecto}
            soloIconoProyecto={ocultarBadgeProyecto}
            onMoverProyecto={() => onMoverProyecto(tarea)}
            onCompartir={() => onCompartir?.(tarea)}
            estaCompartida={estaCompartida}
            mensajesNoLeidos={mensajesNoLeidos}
            /* Props de hábitos - Sincronizado con TablaHabitos */
            onEditarHabito={onEditarHabito}
            onEliminarHabito={onEliminarHabito}
            onToggleHabito={onToggleHabito}
            onPosponerHabito={onPosponerHabito}
            onPosponerHabitoConTiempo={onPosponerHabitoConTiempo}
            onPausarHabito={onPausarHabito}
            onActualizarHabito={onActualizarHabito}
            /* Las tareas-hábito solo aparecen si NO están completadas ni pausadas */
            habitoCompletadoHoy={false}
            habitoPausado={false}
            tieneSubtareas={esColapsable}
            modoCompacto={modoCompacto}
            /* Props de selección múltiple - TAREA 3.1 */
            estaSeleccionada={estaSeleccionada}
            onSeleccionMultiple={onSeleccionMultiple}
            modoSeleccionActivo={modoSeleccionActivo}
            /* [207A-3] Subhábitos: callbacks para menú contextual */
            onToggleSubHabito={onToggleSubHabito}
            onEliminarSubHabito={onEliminarSubHabito}
        />
    );

    return (
        <div className={`tareaConColapsador ${modoCompacto ? 'tareaConColapsador--compacto' : ''}`} key={`wrapper-${tarea.id}`}>
            {/* En móvil: envolver con SwipeableItem para gestos */}
            {esMovil ? (
                <SwipeableItem onSwipeRight={manejarSwipeCompletar} onSwipeLeft={manejarSwipeIzquierda} accionDerecha={accionCompletar} accionIzquierda={accionIzquierda}>
                    {tareaItemElement}
                </SwipeableItem>
            ) : (
                tareaItemElement
            )}
            {esColapsable && (
                /* [243A-9] Sin flecha: solo contador, sin ChevronRight ni borde/hover */
                <Boton claseAdicional="tareaColapsadorBoton" onClick={() => onToggleExpandir(tarea.id)} onPointerDown={e => e.stopPropagation()} title={subtareasOcultas ? `Expandir ${numSubtareas.total} subtareas` : `Colapsar ${numSubtareas.total} subtareas`}>
                    <span className={`tareaColapsadorContador ${!subtareasOcultas ? 'tareaColapsadorContadorExpandido' : ''}`}>
                        {numSubtareas.completadas}/{numSubtareas.total}
                    </span>
                </Boton>
            )}
        </div>
    );
};
