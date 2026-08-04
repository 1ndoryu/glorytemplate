/*
 * BottomSheetTarea
 * Bottom Sheet para crear/editar tareas en móvil
 * Diseño compacto y minimalista específico para móvil
 *
 * Características:
 * - Input principal con autofocus
 * - Opciones compactas con iconos (solo mostrar cuando tienen valor)
 * - Botón de crear/guardar destacado
 * - Cierra automáticamente al guardar
 * - Soporta modo edición con tareaExistente
 * - Modales de selección para propiedades
 * - Badges de propiedades seleccionadas
 */

import React from 'react';
import {Send, Calendar, Flag, Zap, Layers, Settings} from 'lucide-react';
import {BottomSheet, ModalSeleccionPropiedad, BadgesPropiedad} from '../shared';
import {Input, Boton} from '../ui';
import type {Proyecto, Tarea} from '../../types/dashboard';
import {OPCIONES_PRIORIDAD, OPCIONES_URGENCIA, OPCIONES_FECHA_TAREA, obtenerTextoPrioridad, obtenerTextoUrgencia} from '../../utils/constantes';
import {useBottomSheetTarea} from '../../hooks/dashboard/useBottomSheetTarea';

interface BottomSheetTareaProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosTarea) => Promise<void>;
    proyectos?: Proyecto[];
    valoresIniciales?: {
        proyectoId?: number;
        prioridad?: string;
        urgencia?: string;
        grupoEjecucion?: string | null;
    };
    /* Modo edición: si se pasa una tarea, se edita en lugar de crear */
    tareaExistente?: Tarea;
    onAbrirConfiguracion?: () => void;
}

export interface DatosTarea {
    texto: string;
    proyectoId?: number;
    prioridad?: string;
    urgencia?: string;
    fecha?: string;
    grupoEjecucion?: string | null;
    /* ID de tarea existente para edición */
    id?: number;
}

export function BottomSheetTarea({estaAbierto, onCerrar, onGuardar, proyectos = [], valoresIniciales = {}, tareaExistente, onAbrirConfiguracion}: BottomSheetTareaProps): JSX.Element | null {
    const {esEdicion, texto, setTexto, proyectoId, prioridad, urgencia, fecha, cargando, modalActivo, setModalActivo, inputRef, opcionesProyecto, badgesActivos, manejarGuardar, manejarEliminarBadge, manejarSeleccionFecha, setPrioridad, setUrgencia, setProyectoId, obtenerNombreProyecto} = useBottomSheetTarea({estaAbierto, onCerrar, onGuardar, proyectos, valoresIniciales, tareaExistente});

    if (!estaAbierto) return null;

    return (
        <BottomSheet estaAbierto={estaAbierto} onCerrar={onCerrar}>
            <div className="bottomSheetTarea">
                {/* Input principal */}
                <div className="bottomSheetTarea__inputWrapper">
                    <Input ref={inputRef as React.RefObject<HTMLInputElement>} tipo="text" value={texto} onChange={e => setTexto(e.target.value)} placeholder="¿Qué necesitas hacer?" claseAdicional="bottomSheetTarea__input" disabled={cargando} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false" data-form-type="other" inputMode="text" enterKeyHint="done" name="bottomsheet-tarea-input" data-lpignore="true" data-1p-ignore="true" aria-autocomplete="none" />
                </div>

                {/* Badges de propiedades seleccionadas */}
                <BadgesPropiedad badges={badgesActivos} onEliminar={manejarEliminarBadge} />

                {/* Barra de acciones (Opciones + Guardar) */}
                <div className="bottomSheetTarea__acciones">
                    {/* Grupo de opciones (Izquierda) */}
                    <div className="bottomSheetTarea__opcionesGrupo">
                        {/* Proyecto */}
                        {proyectos.length > 0 && (
                            <Boton type="button" variante="ghost" claseAdicional={`bottomSheetTarea__accion ${proyectoId ? 'bottomSheetTarea__accion--activa' : ''}`} onClick={() => setModalActivo('proyecto')} aria-label={obtenerNombreProyecto() || 'Proyecto'} title={obtenerNombreProyecto() || 'Proyecto'} icono={<Layers size={18} />} />
                        )}

                        {/* Prioridad */}
                        <Boton type="button" variante="ghost" claseAdicional={`bottomSheetTarea__accion ${prioridad ? 'bottomSheetTarea__accion--activa' : ''}`} onClick={() => setModalActivo('prioridad')} aria-label={obtenerTextoPrioridad(prioridad) || 'Prioridad'} title={obtenerTextoPrioridad(prioridad) || 'Prioridad'} icono={<Flag size={18} />} />

                        {/* Urgencia */}
                        <Boton type="button" variante="ghost" claseAdicional={`bottomSheetTarea__accion ${urgencia ? 'bottomSheetTarea__accion--activa' : ''}`} onClick={() => setModalActivo('urgencia')} aria-label={obtenerTextoUrgencia(urgencia) || 'Urgencia'} title={obtenerTextoUrgencia(urgencia) || 'Urgencia'} icono={<Zap size={18} />} />

                        {/* Fecha límite */}
                        <Boton type="button" variante="ghost" claseAdicional={`bottomSheetTarea__accion ${fecha ? 'bottomSheetTarea__accion--activa' : ''}`} onClick={() => setModalActivo('fecha')} aria-label={fecha || 'Fecha'} title={fecha || 'Fecha'} icono={<Calendar size={18} />} />

                        {/* Configuración avanzada (solo edición) */}
                        {esEdicion && onAbrirConfiguracion && (
                            <Boton
                                type="button"
                                variante="ghost"
                                claseAdicional="bottomSheetTarea__accion"
                                onClick={() => {
                                    onAbrirConfiguracion();
                                    onCerrar();
                                }}
                                aria-label="Configuración avanzada"
                                title="Configuración avanzada"
                                icono={<Settings size={18} />}
                            />
                        )}
                    </div>

                    {/* Botón Guardar (Derecha) */}
                    <Boton type="button" variante="primario" claseAdicional="bottomSheetTarea__botonGuardar" onClick={manejarGuardar} disabled={!texto.trim() || cargando} aria-label={esEdicion ? 'Guardar Cambios' : 'Crear Tarea'} icono={<Send size={18} />} />
                </div>
            </div>

            {/* Modal de selección de Proyecto */}
            <ModalSeleccionPropiedad estaAbierto={modalActivo === 'proyecto'} titulo="Seleccionar Proyecto" opciones={opcionesProyecto} valorActual={proyectoId?.toString()} onSeleccionar={valor => setProyectoId(valor ? parseInt(valor) : undefined)} onCerrar={() => setModalActivo(null)} textoLimpiar="Sin proyecto" />

            {/* Modal de selección de Prioridad */}
            <ModalSeleccionPropiedad estaAbierto={modalActivo === 'prioridad'} titulo="Seleccionar Prioridad" opciones={OPCIONES_PRIORIDAD} valorActual={prioridad} onSeleccionar={valor => setPrioridad(valor)} onCerrar={() => setModalActivo(null)} textoLimpiar="Sin prioridad" />

            {/* Modal de selección de Urgencia */}
            <ModalSeleccionPropiedad estaAbierto={modalActivo === 'urgencia'} titulo="Seleccionar Urgencia" opciones={OPCIONES_URGENCIA} valorActual={urgencia} onSeleccionar={valor => setUrgencia(valor)} onCerrar={() => setModalActivo(null)} textoLimpiar="Sin urgencia" />

            {/* Modal de selección de Fecha */}
            <ModalSeleccionPropiedad
                estaAbierto={modalActivo === 'fecha'}
                titulo="Fecha Límite"
                opciones={OPCIONES_FECHA_TAREA}
                valorActual={undefined}
                onSeleccionar={manejarSeleccionFecha}
                onCerrar={() => setModalActivo(null)}
                textoLimpiar="Sin fecha"
            />
        </BottomSheet>
    );
}
