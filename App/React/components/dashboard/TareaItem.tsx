import {useCallback, type ChangeEvent} from 'react';
import {Check, Play, Square} from 'lucide-react';
import {Input} from '../ui';
import type {TareaHabito} from '../../types/dashboard';
import {esTareaHabito, esTareaSubHabito} from '../../types/dashboard';
import {MenuContextualAdaptivo} from '../shared/MenuContextualAdaptivo';
import {BadgeGroup} from '../shared/BadgeInfo';
import {AccionesItem} from '../shared/AccionesItem';
import {TareaBadges} from './tarea-item/TareaBadges';
import {useTareaEdicion} from './tarea-item/useTareaEdicion';
import {useTareaMenu} from './tarea-item/useTareaMenu';
import {useCantidadSeleccionadas} from '../../stores/seleccionMultipleStore';
import {useTimeTrackerStore} from '../../stores/timeTrackerStore';
import {useShallow} from 'zustand/react/shallow';

import type {TareaItemProps} from './tarea-item/types';

export function TareaItem(props: TareaItemProps): JSX.Element {
    const {tarea, onToggle, onEditar, onEliminar, esSubtarea = false, onIndent, onOutdent, onCrearNueva, onConfigurar, nombreProyecto, soloIconoProyecto = false, onMoverProyecto, onCompartir, estaCompartida = false, mensajesNoLeidos = 0, onEditarHabito, onEliminarHabito, onToggleHabito, onPosponerHabito, onPosponerHabitoConTiempo, onPausarHabito, onActualizarHabito, habitoCompletadoHoy = false, habitoPausado = false, habitoPospuestoHoy = false, onToggleSubHabito, onEliminarSubHabito, onPosponerSubHabitoConTiempo, onActualizarSubHabito, onConfigurarSubHabito, tieneSubtareas = false, modoCompacto = false, estaSeleccionada = false, onSeleccionMultiple, modoSeleccionActivo = false, suprimirClickRef} = props;

    /* Detectar si es una tarea-hábito virtual */
    const esHabito = esTareaHabito(tarea);
    const tracker = useTimeTrackerStore(useShallow(s => ({sesionActiva: s.sesionActiva, estado: s.estado, iniciarTracking: s.iniciarTracking, completarTracking: s.completarTracking})));
    const entidadTrackingId = esHabito ? (tarea as TareaHabito).habitoId : tarea.id;
    const estaEnTracking = tracker.sesionActiva?.entidadId === entidadTrackingId && tracker.estado !== 'inactivo';

    const manejarTracking = useCallback(() => {
        if (estaEnTracking) {
            tracker.completarTracking();
            return;
        }

        if (esHabito) {
            tracker.iniciarTracking((tarea as TareaHabito).habitoId, 'habito', tarea.texto);
            return;
        }

        tracker.iniciarTracking(tarea.id, 'tarea', tarea.texto);
    }, [estaEnTracking, tracker, esHabito, tarea]);

    /* Hook de Edición */
    const {editando, textoEditado, setTextoEditado, inputRef, iniciarEdicion, guardarEdicion, manejarTecla} = useTareaEdicion({
        tarea,
        onEditar,
        onEliminar,
        onIndent,
        onOutdent,
        onCrearNueva,
        onConfigurar
    });

    /* Hook de Menú Contextual */
    const cantidadSeleccionadas = useCantidadSeleccionadas();
    const {menuContextual, manejarClickDerecho, manejarOpcionMenu, opcionesMenu, opcionesMenuHabito} = useTareaMenu({
        tarea,
        esHabito,
        onEditar,
        onEliminar,
        onConfigurar,
        onCrearNueva,
        onMoverProyecto,
        onCompartir,
        onEditarHabito,
        onEliminarHabito,
        onToggleHabito,
        onPosponerHabito,
        onPosponerHabitoConTiempo,
        onPausarHabito,
        onActualizarHabito,
        habitoCompletadoHoy,
        habitoPausado,
        habitoPospuestoHoy,
        onToggleSubHabito,
        onEliminarSubHabito,
        onPosponerSubHabitoConTiempo,
        onActualizarSubHabito,
        onConfigurarSubHabito,
        estaSeleccionada,
        cantidadSeleccionadas
    });

    /* Handler para clicks en el contenido de la tarea */
    const manejarClickContenido = useCallback(
        (evento: React.MouseEvent) => {
            /* [218A-2] Si acabamos de terminar un drag, ignorar el click para evitar
             * que se abra la configuración del hábito al soltar. */
            if (suprimirClickRef?.current) {
                evento.preventDefault();
                evento.stopPropagation();
                return;
            }

            /* 1. Si el modo de selección manual está activo (móvil) -> Seleccionar */
            if (modoSeleccionActivo && onSeleccionMultiple) {
                evento.preventDefault();
                evento.stopPropagation();
                onSeleccionMultiple(tarea, evento);
                return;
            }

            /* 2. Ctrl+Click (Windows/Linux) o Cmd+Click (Mac) = selección múltiple */
            if ((evento.ctrlKey || evento.metaKey) && onSeleccionMultiple) {
                evento.preventDefault();
                evento.stopPropagation();
                onSeleccionMultiple(tarea, evento);
                return;
            }

            /* 
             * TAREA 5: Hábitos en panel de ejecución abren BottomSheet 
             * Comportamiento idéntico a TablaHabitos - onClick abre edición
             */
            if (esHabito && onEditarHabito) {
                evento.stopPropagation();
                onEditarHabito((tarea as TareaHabito).habitoId);
                return;
            }

            /* [217A-2] Subhábitos: click abre la configuración del subhábito (no del padre) */
            if (esTareaSubHabito(tarea) && onConfigurarSubHabito) {
                evento.stopPropagation();
                onConfigurarSubHabito(tarea.habitoPadreId, tarea.subHabitoId);
                return;
            }

            /* 3. Click normal en tarea = editar/configurar */
            iniciarEdicion();
        },
        [iniciarEdicion, onSeleccionMultiple, tarea, modoSeleccionActivo, esHabito, onEditarHabito, onConfigurarSubHabito, suprimirClickRef]
    );

    if (editando) {
        return (
            <div className={`tareaItem tareaItemEditando ${esSubtarea ? 'tareaItemSubtarea' : ''} ${modoCompacto ? 'tareaItem--compacto' : ''}`}>
                <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`}>{tarea.completado && <Check size={8} color="white" />}</div>
                <div className="tareaContenido">
                    <Input ref={inputRef} tipo="text" claseAdicional="tareaEdicionInput" value={textoEditado} onChange={(e: ChangeEvent<HTMLInputElement>) => setTextoEditado(e.target.value)} onKeyDown={manejarTecla} onBlur={guardarEdicion} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`tareaItem ${esSubtarea ? 'tareaItemSubtarea' : ''} ${tieneSubtareas ? 'tareaItem--conSubtareas' : ''} ${modoCompacto ? 'tareaItem--compacto' : ''} ${estaSeleccionada ? 'tareaItem--seleccionada' : ''}`} onContextMenu={manejarClickDerecho}>
                <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`} onClick={onToggle} onPointerDown={e => e.stopPropagation()}>
                    {tarea.completado && <Check size={8} color="white" />}
                </div>
                <div className="tareaContenido" onClick={manejarClickContenido}>
                    <div className="tareaTextoWrapper">
                        <p className={`tareaTexto ${tarea.completado ? 'tareaTextoCompletado' : ''} ${modoCompacto ? 'tareaTexto--compacto' : ''}`}>{tarea.texto}</p>
                        <BadgeGroup>
                            <TareaBadges tarea={tarea} nombreProyecto={nombreProyecto} soloIconoProyecto={soloIconoProyecto} estaCompartida={estaCompartida} mensajesNoLeidos={mensajesNoLeidos} onConfigurar={onConfigurar} />
                        </BadgeGroup>
                    </div>
                </div>

                <div className="tareaAccionesContenedor" onPointerDown={e => e.stopPropagation()}>
                    {!esHabito && !esTareaSubHabito(tarea) && (
                        <AccionesItem
                            acciones={[{id: estaEnTracking ? 'detener-tracking' : 'iniciar-tracking', icono: estaEnTracking ? <Square size={12} /> : <Play size={12} />, titulo: estaEnTracking ? 'Detener tracking' : 'Iniciar tracking', onClick: manejarTracking}]}
                            mostrarConfigurar={true}
                            mostrarEliminar={true}
                            onConfigurar={onConfigurar}
                            onEliminar={onEliminar}
                        />
                    )}
                    {esHabito && (
                        <AccionesItem
                            acciones={[{id: estaEnTracking ? 'detener-tracking' : 'iniciar-tracking', icono: estaEnTracking ? <Square size={12} /> : <Play size={12} />, titulo: estaEnTracking ? 'Detener tracking' : 'Iniciar tracking', onClick: manejarTracking}]}
                            mostrarConfigurar={!!(onEditarHabito || onConfigurar)}
                            mostrarEliminar={!!(onEliminarHabito || onEliminar)}
                            onConfigurar={onEditarHabito ? () => onEditarHabito((tarea as TareaHabito).habitoId) : onConfigurar}
                            onEliminar={onEliminarHabito ? () => onEliminarHabito((tarea as TareaHabito).habitoId) : onEliminar}
                        />
                    )}
                    {/* [217A-2] Subhábitos: acciones independientes (configurar=subhábito, eliminar=subhábito) */}
                    {esTareaSubHabito(tarea) && (
                        <AccionesItem
                            acciones={[{id: estaEnTracking ? 'detener-tracking' : 'iniciar-tracking', icono: estaEnTracking ? <Square size={12} /> : <Play size={12} />, titulo: estaEnTracking ? 'Detener tracking' : 'Iniciar tracking', onClick: manejarTracking}]}
                            mostrarConfigurar={!!onConfigurarSubHabito}
                            mostrarEliminar={!!onEliminarSubHabito}
                            onConfigurar={onConfigurarSubHabito ? () => onConfigurarSubHabito(tarea.habitoPadreId, tarea.subHabitoId) : undefined}
                            onEliminar={onEliminarSubHabito ? () => onEliminarSubHabito(tarea.habitoPadreId, tarea.subHabitoId) : undefined}
                        />
                    )}
                </div>
            </div>

            {menuContextual.visible && !esHabito && <MenuContextualAdaptivo opciones={opcionesMenu} posicionX={menuContextual.posicion.x} posicionY={menuContextual.posicion.y} onSeleccionar={manejarOpcionMenu} onCerrar={menuContextual.cerrar} titulo={tarea.texto} />}
            {menuContextual.visible && esHabito && <MenuContextualAdaptivo opciones={opcionesMenuHabito} posicionX={menuContextual.posicion.x} posicionY={menuContextual.posicion.y} onSeleccionar={manejarOpcionMenu} onCerrar={menuContextual.cerrar} titulo={tarea.texto} />}
        </>
    );
}
