/*
 * usePanelConfiguracionTarea
 * Hook que gestiona toda la lógica del panel de configuración de tareas.
 * Incluye: estado del formulario, sincronización con tarea, autoguardado,
 * panel de chat y handlers de cambios.
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import type {Tarea, TareaConfiguracion, NivelPrioridad, NivelUrgencia, Participante, FrecuenciaHabito, Adjunto, ReferenciaDependencia} from '../../types/dashboard';
import {usePanelChat} from '../usePanelChat';
import {useAutoguardado} from '../useAutoguardado';
import {useEsDispositivoMovil} from '../useEsMovil';

interface UsePanelConfiguracionTareaParams {
    tarea?: Tarea;
    onCerrar: () => void;
    onGuardar: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null, tags?: string[], dependencias?: ReferenciaDependencia[], grupoEjecucion?: string | null) => void;
    participantes?: Participante[];
    onCambiarProyecto?: (proyectoId: number | undefined) => void;
    onToggleCompletado?: (completado: boolean) => void;
}

export function usePanelConfiguracionTarea({tarea, onCerrar, onGuardar, participantes = [], onCambiarProyecto, onToggleCompletado}: UsePanelConfiguracionTareaParams) {
    const modoEdicion = !!tarea;
    const esMovil = useEsDispositivoMovil();

    /* Estado del formulario */
    const [texto, setTexto] = useState(tarea?.texto || '');
    const [descripcion, setDescripcion] = useState(tarea?.configuracion?.descripcion || '');
    const [prioridad, setPrioridad] = useState<NivelPrioridad | null>(tarea?.prioridad || null);
    const [urgencia, setUrgencia] = useState<NivelUrgencia | null>(tarea?.urgencia || null);
    const [fechaMaxima, setFechaMaxima] = useState<string>(tarea?.configuracion?.fechaMaxima || '');
    const [tieneRepeticion, setTieneRepeticion] = useState<boolean>(!!tarea?.configuracion?.repeticion);
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>({tipo: 'diario'});
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>(tarea?.configuracion?.adjuntos || []);
    const [tags, setTags] = useState<string[]>(tarea?.tags || []);
    const [dependencias, setDependencias] = useState<ReferenciaDependencia[]>(tarea?.dependencias || []);
    const [grupoEjecucion, setGrupoEjecucion] = useState<string | null>(tarea?.grupoEjecucion || null);

    /* Estado de asignación */
    const [asignadoA, setAsignadoA] = useState<number | null>(tarea?.asignadoA || null);
    const [asignadoANombre, setAsignadoANombre] = useState<string>(tarea?.asignadoANombre || '');
    const [asignadoAAvatar, setAsignadoAAvatar] = useState<string>(tarea?.asignadoAAvatar || '');

    /* Estado local para proyecto y completado */
    const [proyectoIdLocal, setProyectoIdLocal] = useState<number | undefined>(tarea?.proyectoId);
    const [completadoLocal, setCompletadoLocal] = useState<boolean>(tarea?.completado ?? false);

    /* Hook para panel de chat */
    const panelChat = usePanelChat({
        elementoId: tarea?.id,
        elementoTipo: 'tarea',
        participantes,
        habilitado: modoEdicion
    });

    /* Campos actuales para detección de cambios */
    const camposActuales = {
        texto, descripcion, prioridad, urgencia, fechaMaxima,
        tieneRepeticion, frecuencia, adjuntos, asignadoA, tags, dependencias
    };

    /* Guardar tarea */
    const manejarGuardar = useCallback(() => {
        const configuracion: TareaConfiguracion = {};

        if (fechaMaxima) {
            configuracion.fechaMaxima = fechaMaxima;
        } else {
            configuracion.fechaMaxima = null as unknown as string;
        }

        if (descripcion.trim()) {
            configuracion.descripcion = descripcion.trim();
        } else {
            configuracion.descripcion = null as unknown as string;
        }

        if (tieneRepeticion) {
            const repeticion: import('../../types/dashboard').RepeticionTarea = {tipo: 'despuesCompletar', intervalo: 1};

            switch (frecuencia.tipo) {
                case 'diario':
                    repeticion.intervalo = 1;
                    break;
                case 'cadaXDias':
                    repeticion.intervalo = frecuencia.cadaDias || 2;
                    break;
                case 'semanal':
                    repeticion.intervalo = 7;
                    break;
                case 'diasEspecificos':
                    repeticion.intervalo = 1;
                    repeticion.diasSemana = frecuencia.diasSemana || [];
                    break;
                case 'mensual':
                    repeticion.intervalo = Math.floor(30 / (frecuencia.vecesAlMes || 1));
                    break;
            }

            configuracion.repeticion = repeticion;
        } else {
            configuracion.repeticion = undefined;
        }

        configuracion.adjuntos = adjuntos;
        const asignacion = {asignadoA, asignadoANombre, asignadoAAvatar};
        onGuardar(configuracion, prioridad, texto.trim(), asignacion, urgencia, tags, dependencias, grupoEjecucion);
        onCerrar();
    }, [fechaMaxima, descripcion, tieneRepeticion, frecuencia, adjuntos, asignadoA, asignadoANombre, asignadoAAvatar, prioridad, texto, urgencia, tags, dependencias, grupoEjecucion, onGuardar, onCerrar]);

    /* Hook de autoguardado */
    const {guardarEstadoInicial, manejarCerrarConGuardado} = useAutoguardado({
        camposActuales,
        onGuardar: manejarGuardar,
        onCerrar,
        validar: () => texto.trim().length > 0
    });

    /* Ref para evitar loops infinitos en useEffect */
    const lastTareaIdRef = useRef<number | undefined>(undefined);

    /* Sincronizar estado cuando cambia la tarea */
    useEffect(() => {
        if (tarea?.id === lastTareaIdRef.current) return;
        lastTareaIdRef.current = tarea?.id;

        if (tarea) {
            setTexto(tarea.texto);
            setDescripcion(tarea.configuracion?.descripcion || '');
            setPrioridad(tarea.prioridad || null);
            setUrgencia(tarea.urgencia || null);
            setFechaMaxima(tarea.configuracion?.fechaMaxima || '');
            setTieneRepeticion(!!tarea.configuracion?.repeticion);

            let nuevaFrecuencia: FrecuenciaHabito = {tipo: 'diario'};
            if (tarea.configuracion?.repeticion) {
                const {intervalo, diasSemana} = tarea.configuracion.repeticion;
                if (diasSemana && diasSemana.length > 0) {
                    nuevaFrecuencia = {tipo: 'diasEspecificos', diasSemana};
                } else if (intervalo === 1) {
                    nuevaFrecuencia = {tipo: 'diario'};
                } else if (intervalo === 7) {
                    nuevaFrecuencia = {tipo: 'semanal'};
                } else {
                    nuevaFrecuencia = {tipo: 'cadaXDias', cadaDias: intervalo};
                }
            }
            setFrecuencia(nuevaFrecuencia);
            setAdjuntos(tarea.configuracion?.adjuntos || []);
            setAsignadoA(tarea.asignadoA || null);
            setAsignadoANombre(tarea.asignadoANombre || '');
            setAsignadoAAvatar(tarea.asignadoAAvatar || '');
            setProyectoIdLocal(tarea.proyectoId);
            setCompletadoLocal(tarea.completado);
            setTags(tarea.tags || []);
            setDependencias(tarea.dependencias || []);
            setGrupoEjecucion(tarea.grupoEjecucion || null);

            guardarEstadoInicial({
                texto: tarea.texto,
                descripcion: tarea.configuracion?.descripcion || '',
                prioridad: tarea.prioridad || null,
                urgencia: tarea.urgencia || null,
                fechaMaxima: tarea.configuracion?.fechaMaxima || '',
                tieneRepeticion: !!tarea.configuracion?.repeticion,
                frecuencia: nuevaFrecuencia,
                adjuntos: tarea.configuracion?.adjuntos || [],
                asignadoA: tarea.asignadoA || null,
                tags: tarea.tags || [],
                dependencias: tarea.dependencias || []
            });
        } else {
            setTexto('');
            setDescripcion('');
            setPrioridad(null);
            setUrgencia(null);
            setFechaMaxima('');
            setTieneRepeticion(false);
            setFrecuencia({tipo: 'diario'});
            setAdjuntos([]);
            setAsignadoA(null);
            setAsignadoANombre('');
            setAsignadoAAvatar('');
            setTags([]);
            setDependencias([]);
        }
    }, [tarea?.id]);

    const manejarAsignacion = useCallback((usuarioId: number | null, nombre: string, avatar: string) => {
        setAsignadoA(usuarioId);
        setAsignadoANombre(nombre);
        setAsignadoAAvatar(avatar);
    }, []);

    const manejarCambioProyecto = useCallback(
        (nuevoProyectoId: number | undefined) => {
            setProyectoIdLocal(nuevoProyectoId);
            onCambiarProyecto?.(nuevoProyectoId);
        },
        [onCambiarProyecto]
    );

    const manejarCambioCompletado = useCallback(
        (nuevoCompletado: boolean) => {
            setCompletadoLocal(nuevoCompletado);
            onToggleCompletado?.(nuevoCompletado);
        },
        [onToggleCompletado]
    );

    const claseModal = modoEdicion ? 'panelConfiguracionContenedor modalContenedor--expandido' : 'modalContenedor--moderno';

    return {
        texto, setTexto, descripcion, setDescripcion,
        prioridad, setPrioridad, urgencia, setUrgencia,
        fechaMaxima, setFechaMaxima, tieneRepeticion, setTieneRepeticion,
        frecuencia, setFrecuencia, adjuntos, setAdjuntos, tags, setTags,
        dependencias, setDependencias, grupoEjecucion, setGrupoEjecucion,
        asignadoA, asignadoANombre, asignadoAAvatar,
        proyectoIdLocal, completadoLocal,
        modoEdicion, esMovil, claseModal,
        panelChat,
        manejarGuardar, manejarCerrarConGuardado,
        manejarAsignacion, manejarCambioProyecto, manejarCambioCompletado
    };
}
