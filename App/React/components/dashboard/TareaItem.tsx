/*
 * TareaItem
 * Componente individual de tarea
 */

import {useState, useCallback, useRef, useEffect, type KeyboardEvent, type ChangeEvent} from 'react';
import {Check, X, Flag, Trash2, Settings, Calendar, Paperclip, FileText, Repeat, Folder, Share2, Users, Zap, Repeat2, MessageCircle} from 'lucide-react';
import type {Tarea, NivelPrioridad, NivelUrgencia, DatosEdicionTarea, TareaHabito} from '../../types/dashboard';
import {esTareaHabito} from '../../types/dashboard';
import {MenuContextual, type OpcionMenu} from '../shared/MenuContextual';
import {BadgeInfo, BadgeGroup} from '../shared/BadgeInfo';
import {AccionesItem} from '../shared/AccionesItem';
import type {VarianteBadge} from '../shared/BadgeInfo';
import {obtenerTextoFechaLimite as obtenerTextoFechaLim, obtenerVarianteFechaLimite as obtenerVarianteFecha, formatearFechaCorta as formatearFecha} from '../../utils/fecha';

export interface TareaItemProps {
    tarea: Tarea;
    onToggle?: () => void;
    onEditar?: (datos: DatosEdicionTarea) => void;
    onEliminar?: () => void;
    esSubtarea?: boolean;
    onIndent?: () => void;
    onOutdent?: () => void;
    /* Crear nueva tarea debajo (hereda parentId si es subtarea, tareaActualId para posicion) */
    onCrearNueva?: (parentId: number | undefined, tareaActualId: number) => void;
    /* Abrir panel de configuracion */
    onConfigurar?: () => void;
    /* Nombre del proyecto al que pertenece (opcional) */
    nombreProyecto?: string;
    /* Mostrar solo el icono del proyecto sin texto */
    soloIconoProyecto?: boolean;
    /* Mover tarea a otro proyecto */
    onMoverProyecto?: () => void;
    /* Compartir tarea con companeros */
    onCompartir?: () => void;
    /* Indica si la tarea esta siendo compartida */
    estaCompartida?: boolean;
    /* Contador de mensajes no leídos (para badge) */
    mensajesNoLeidos?: number;
    /* Callbacks específicos para tareas-hábito (Fase 7.6.1) */
    onEditarHabito?: (habitoId: number) => void;
    onEliminarHabito?: (habitoId: number) => void;
    onPosponerHabito?: (habitoId: number) => void;
}

export interface MenuContextualEstado {
    visible: boolean;
    x: number;
    y: number;
}

export function TareaItem({tarea, onToggle, onEditar, onEliminar, esSubtarea = false, onIndent, onOutdent, onCrearNueva, onConfigurar, nombreProyecto, soloIconoProyecto = false, onMoverProyecto, onCompartir, estaCompartida = false, mensajesNoLeidos = 0, onEditarHabito, onEliminarHabito, onPosponerHabito}: TareaItemProps): JSX.Element {
    const [mostrarAcciones, setMostrarAcciones] = useState(false);
    const [editando, setEditando] = useState(false);
    const [textoEditado, setTextoEditado] = useState(tarea.texto);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Detectar si es una tarea-hábito virtual */
    const esHabito = esTareaHabito(tarea);

    /* Estado menu contextual */
    const [menuContextual, setMenuContextual] = useState<MenuContextualEstado>({
        visible: false,
        x: 0,
        y: 0
    });

    useEffect(() => {
        if (editando && inputRef.current) {
            inputRef.current.focus();
            /* Bug fix: No seleccionar todo el texto automaticamente */
            /* Ponemos el cursor al final */
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
        }
    }, [editando]);

    const iniciarEdicion = useCallback(() => {
        /* No permitir edición inline en tareas-hábito */
        if (esHabito) return;
        setTextoEditado(tarea.texto);
        setEditando(true);
    }, [tarea.texto, esHabito]);

    const guardarEdicion = useCallback(() => {
        const textoLimpio = textoEditado.trim();
        if (textoLimpio.length === 0) {
            cancelarEdicion();
            return;
        }

        if (textoLimpio !== tarea.texto) {
            onEditar?.({texto: textoLimpio});
        }
        setEditando(false);
    }, [textoEditado, tarea.texto, onEditar]);

    const cancelarEdicion = useCallback(() => {
        setTextoEditado(tarea.texto);
        setEditando(false);
    }, [tarea.texto]);

    const manejarTecla = useCallback(
        (evento: KeyboardEvent<HTMLInputElement>) => {
            if (evento.key === 'Enter') {
                evento.preventDefault();
                guardarEdicion();
                /* Crear nueva tarea debajo, heredando parentId si es subtarea */
                onCrearNueva?.(tarea.parentId, tarea.id);
            } else if (evento.key === 'Escape') {
                cancelarEdicion();
            } else if (evento.key === 'Tab') {
                /*
                 * Soporte para identacion/desidentacion (subtareas)
                 */
                evento.preventDefault();

                if (evento.shiftKey) {
                    /* Shift+Tab: Convertir en tarea principal (outdent) */
                    onOutdent?.();
                } else {
                    /* Tab: Convertir en subtarea (indent) */
                    onIndent?.();
                }
            }
        },
        [guardarEdicion, cancelarEdicion, onIndent, onOutdent, onCrearNueva, tarea.parentId, tarea.id]
    );

    /* Manejo del menu contextual */
    const manejarClickDerecho = useCallback((evento: React.MouseEvent) => {
        evento.preventDefault();
        evento.stopPropagation();
        setMenuContextual({
            visible: true,
            x: evento.clientX,
            y: evento.clientY
        });
    }, []);

    const cerrarMenuContextual = useCallback(() => {
        setMenuContextual(prev => ({...prev, visible: false}));
    }, []);

    const manejarOpcionMenu = useCallback(
        (opcionId: string) => {
            /* Acciones específicas para hábitos */
            if (esHabito) {
                const tareaHabito = tarea as TareaHabito;
                if (opcionId === 'editar-habito') {
                    onEditarHabito?.(tareaHabito.habitoId);
                } else if (opcionId === 'posponer-habito') {
                    onPosponerHabito?.(tareaHabito.habitoId);
                } else if (opcionId === 'eliminar-habito') {
                    onEliminarHabito?.(tareaHabito.habitoId);
                }
                return;
            }

            /* Acciones para tareas normales */
            if (opcionId === 'eliminar') {
                onEliminar?.();
            } else if (opcionId === 'configurar') {
                onConfigurar?.();
            } else if (opcionId === 'sin-prioridad') {
                onEditar?.({prioridad: null});
            } else if (opcionId === 'mover-proyecto') {
                onMoverProyecto?.();
            } else if (opcionId === 'compartir') {
                onCompartir?.();
            } else if (['alta', 'media', 'baja'].includes(opcionId)) {
                onEditar?.({
                    prioridad: opcionId as NivelPrioridad
                });
            }
        },
        [onEliminar, onEditar, onConfigurar, onMoverProyecto, onCompartir, esHabito, tarea, onEditarHabito, onEliminarHabito, onPosponerHabito]
    );

    /* Opciones del menu contextual */
    const opcionesMenu: OpcionMenu[] = [
        {
            id: 'configurar',
            etiqueta: 'Configurar tarea',
            icono: <Settings size={12} />,
            separadorDespues: true
        },
        {
            id: 'compartir',
            etiqueta: 'Compartir tarea',
            icono: <Share2 size={12} />
        },
        {
            id: 'mover-proyecto',
            etiqueta: 'Mover a proyecto',
            icono: <Folder size={12} />,
            separadorDespues: true
        },
        {
            id: 'alta',
            etiqueta: 'Prioridad Alta',
            icono: <Flag size={12} color="#ef4444" />
        },
        {
            id: 'media',
            etiqueta: 'Prioridad Media',
            icono: <Flag size={12} color="#f59e0b" />
        },
        {
            id: 'baja',
            etiqueta: 'Prioridad Baja',
            icono: <Flag size={12} color="#94a3b8" />,
            separadorDespues: !tarea.prioridad
        }
    ];

    /* Agregar opcion de quitar prioridad solo si tiene una */
    if (tarea.prioridad) {
        opcionesMenu.push({
            id: 'sin-prioridad',
            etiqueta: 'Sin prioridad',
            icono: <X size={12} />,
            separadorDespues: true
        });
    }

    /* Agregar opcion de eliminar al final */
    opcionesMenu.push({
        id: 'eliminar',
        etiqueta: 'Eliminar tarea',
        icono: <Trash2 size={12} />,
        peligroso: true
    });

    /* Opciones de menú contextual específicas para hábitos */
    const opcionesMenuHabito: OpcionMenu[] = [
        {
            id: 'editar-habito',
            etiqueta: 'Editar habito',
            icono: <Settings size={12} />
        },
        {
            id: 'posponer-habito',
            etiqueta: 'Posponer hoy',
            icono: <Calendar size={12} />,
            separadorDespues: true
        },
        {
            id: 'eliminar-habito',
            etiqueta: 'Eliminar habito',
            icono: <Trash2 size={12} />,
            peligroso: true
        }
    ];

    /* Renderizado del indicador de prioridad como badge (unificado con habitos) */
    const renderIndicadorPrioridad = () => {
        if (!tarea.prioridad) return null;

        const obtenerVariantePrioridad = (prioridad: NivelPrioridad): VarianteBadge => {
            switch (prioridad) {
                case 'alta':
                    return 'prioridadAlta';
                case 'media':
                    return 'prioridadMedia';
                case 'baja':
                    return 'prioridadBaja';
            }
        };

        return <BadgeInfo tipo="prioridad" texto={tarea.prioridad.toUpperCase()} variante={obtenerVariantePrioridad(tarea.prioridad)} />;
    };

    /* Renderizado del indicador de urgencia (solo si no es 'normal') */
    const renderIndicadorUrgencia = () => {
        /* No mostrar badge si es 'normal' (valor por defecto) o no tiene urgencia */
        if (!tarea.urgencia || tarea.urgencia === 'normal') return null;

        const obtenerVarianteUrgencia = (urgencia: NivelUrgencia): VarianteBadge => {
            switch (urgencia) {
                case 'bloqueante':
                    return 'urgenciaBloqueante';
                case 'urgente':
                    return 'urgenciaUrgente';
                case 'chill':
                    return 'urgenciaChill';
                default:
                    return 'normal';
            }
        };

        return <BadgeInfo tipo="personalizado" icono={<Zap size={10} />} texto={tarea.urgencia.toUpperCase()} variante={obtenerVarianteUrgencia(tarea.urgencia)} titulo={`Urgencia: ${tarea.urgencia}`} />;
    };

    /* Renderizado del indicador de fecha limite (usando funciones centralizadas) */
    const renderIndicadorFecha = () => {
        const fechaMaxima = tarea.configuracion?.fechaMaxima;
        if (!fechaMaxima) return null;

        const textoFecha = obtenerTextoFechaLim(fechaMaxima);
        const variante = obtenerVarianteFecha(fechaMaxima);

        return <BadgeInfo tipo="fecha" icono={<Calendar size={10} />} texto={textoFecha} titulo={`Fecha limite: ${formatearFecha(fechaMaxima)}`} variante={variante} onClick={onConfigurar} />;
    };

    /* Renderizado del badge de adjuntos */
    const renderBadgeAdjuntos = () => {
        const adjuntos = tarea.configuracion?.adjuntos;
        if (!adjuntos || adjuntos.length === 0) return null;

        return <BadgeInfo tipo="adjunto" icono={<Paperclip size={10} />} texto={adjuntos.length.toString()} titulo={`${adjuntos.length} archivo${adjuntos.length > 1 ? 's' : ''} adjunto${adjuntos.length > 1 ? 's' : ''}`} onClick={onConfigurar} />;
    };

    /* Renderizado del badge de descripcion */
    const renderBadgeDescripcion = () => {
        const descripcion = tarea.configuracion?.descripcion;
        if (!descripcion || descripcion.trim().length === 0) return null;

        return <BadgeInfo tipo="descripcion" icono={<FileText size={10} />} titulo="Tiene descripcion" onClick={onConfigurar} />;
    };

    /* Renderizado del badge de repeticion */
    const renderBadgeRepeticion = () => {
        const repeticion = tarea.configuracion?.repeticion;
        if (!repeticion) return null;

        const textoIntervalo = repeticion.intervalo === 1 ? 'diaria' : `cada ${repeticion.intervalo} dias`;

        return <BadgeInfo tipo="repeticion" icono={<Repeat size={10} />} titulo={`Repeticion ${textoIntervalo}`} onClick={onConfigurar} />;
    };

    /* Renderizado del badge de asignacion */
    const renderBadgeAsignado = () => {
        if (!tarea.asignadoA || !tarea.asignadoANombre) return null;

        return (
            <span className="badgeAsignado" title={`Asignado a: ${tarea.asignadoANombre}`}>
                {tarea.asignadoAAvatar && <img src={tarea.asignadoAAvatar} alt={tarea.asignadoANombre} />}
                <span className="badgeAsignadoNombre">{tarea.asignadoANombre}</span>
            </span>
        );
    };

    /* Renderizado del badge de propietario (cuando es tarea compartida de otro usuario) */
    const renderBadgePropietario = () => {
        if (!tarea.esCompartido || !tarea.propietarioNombre) return null;

        return (
            <span className="badgePropietario" title={`De: ${tarea.propietarioNombre}`}>
                {tarea.propietarioAvatar && <img src={tarea.propietarioAvatar} alt={tarea.propietarioNombre} className="badgePropietarioAvatar" />}
                <span className="badgePropietarioNombre">{tarea.propietarioNombre}</span>
            </span>
        );
    };

    /* Renderizado del badge de hábito (para tareas-hábito virtuales) */
    const renderBadgeHabito = () => {
        if (!esTareaHabito(tarea)) return null;

        const textoRacha = tarea.habitoRacha > 0 ? `${tarea.habitoRacha}` : undefined;

        return <BadgeInfo tipo="personalizado" icono={<Repeat2 size={10} />} texto={textoRacha} titulo={`Hábito: ${tarea.habitoNombre}${tarea.habitoRacha > 0 ? ` (racha: ${tarea.habitoRacha})` : ''}`} variante="habito" />;
    };

    /* Renderizado del badge de mensajes no leídos */
    const renderBadgeMensajesNoLeidos = () => {
        if (mensajesNoLeidos <= 0) return null;

        const texto = mensajesNoLeidos > 9 ? '9+' : mensajesNoLeidos.toString();
        const titulo = mensajesNoLeidos === 1 ? '1 mensaje sin leer' : `${mensajesNoLeidos} mensajes sin leer`;

        return <BadgeInfo tipo="personalizado" icono={<MessageCircle size={10} />} texto={texto} titulo={titulo} variante="mensajeNoLeido" onClick={onConfigurar} />;
    };

    if (editando) {
        return (
            <div className={`tareaItem tareaItemEditando ${esSubtarea ? 'tareaItemSubtarea' : ''}`}>
                <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`}>{tarea.completado && <Check size={8} color="white" />}</div>
                <div className="tareaContenido">
                    <input ref={inputRef} type="text" className="tareaEdicionInput" value={textoEditado} onChange={(e: ChangeEvent<HTMLInputElement>) => setTextoEditado(e.target.value)} onKeyDown={manejarTecla} onBlur={guardarEdicion} />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`tareaItem ${esSubtarea ? 'tareaItemSubtarea' : ''}`} onMouseEnter={() => setMostrarAcciones(true)} onMouseLeave={() => setMostrarAcciones(false)} onContextMenu={manejarClickDerecho}>
                <div className={`tareaCheckbox ${tarea.completado ? 'tareaCheckboxCompletado' : ''}`} onClick={onToggle}>
                    {tarea.completado && <Check size={8} color="white" />}
                </div>
                <div className="tareaContenido" onClick={iniciarEdicion}>
                    <div className="tareaTextoWrapper">
                        <p className={`tareaTexto ${tarea.completado ? 'tareaTextoCompletado' : ''}`}>{tarea.texto}</p>
                        <BadgeGroup>
                            {renderBadgePropietario()}
                            {renderIndicadorFecha()}
                            {renderBadgeAdjuntos()}
                            {renderBadgeDescripcion()}
                            {renderBadgeRepeticion()}
                            {renderBadgeAsignado()}
                            {estaCompartida && !tarea.esCompartido && <BadgeInfo tipo="personalizado" icono={<Users size={10} />} titulo="Tarea compartida" variante="normal" />}
                            {nombreProyecto && <BadgeInfo tipo="personalizado" icono={<Folder size={10} />} texto={soloIconoProyecto ? undefined : nombreProyecto} titulo={`Proyecto: ${nombreProyecto}`} variante="normal" />}
                            {renderIndicadorPrioridad()}
                            {renderIndicadorUrgencia()}
                            {renderBadgeHabito()}
                            {renderBadgeMensajesNoLeidos()}
                        </BadgeGroup>
                    </div>
                </div>
                {mostrarAcciones && !esHabito && <AccionesItem mostrarConfigurar={true} mostrarEliminar={true} onConfigurar={onConfigurar} onEliminar={onEliminar} />}
                {mostrarAcciones && esHabito && onEditarHabito && <AccionesItem mostrarConfigurar={true} mostrarEliminar={!!onEliminarHabito} onConfigurar={() => onEditarHabito((tarea as TareaHabito).habitoId)} onEliminar={onEliminarHabito ? () => onEliminarHabito((tarea as TareaHabito).habitoId) : undefined} />}
            </div>

            {menuContextual.visible && !esHabito && <MenuContextual opciones={opcionesMenu} posicionX={menuContextual.x} posicionY={menuContextual.y} onSeleccionar={manejarOpcionMenu} onCerrar={cerrarMenuContextual} />}
            {menuContextual.visible && esHabito && <MenuContextual opciones={opcionesMenuHabito} posicionX={menuContextual.x} posicionY={menuContextual.y} onSeleccionar={manejarOpcionMenu} onCerrar={cerrarMenuContextual} />}
        </>
    );
}
