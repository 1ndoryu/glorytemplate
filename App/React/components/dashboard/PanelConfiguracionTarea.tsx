/*
 * PanelConfiguracionTarea
 * Panel modal para configurar opciones avanzadas de una tarea
 * Responsabilidad: prioridad, fecha limite, descripcion, repeticion, asignacion
 *
 * Usa campos compartidos: CampoTexto, CampoPrioridad, CampoFechaLimite
 */

import {useState, useEffect} from 'react';
import type {Tarea, TareaConfiguracion, NivelPrioridad, NivelUrgencia, Participante} from '../../types/dashboard';
import {AccionesFormulario, Modal, SeccionPanel, ToggleSwitch, CampoTexto, CampoPrioridad, CampoUrgencia, CampoFechaLimite} from '../shared';
import {SelectorFrecuencia} from './SelectorFrecuencia';
import {SeccionAdjuntos} from './SeccionAdjuntos';
import {SelectorAsignado} from '../compartidos/SelectorAsignado';
import type {FrecuenciaHabito, Adjunto} from '../../types/dashboard';

export interface PanelConfiguracionTareaProps {
    tarea?: Tarea;
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null) => void;
    /* Participantes disponibles para asignar (opcional, solo si es tarea compartida) */
    participantes?: Participante[];
}

export function PanelConfiguracionTarea({tarea, estaAbierto, onCerrar, onGuardar, participantes = []}: PanelConfiguracionTareaProps): JSX.Element | null {
    /* Estado local para edicion */
    const [prioridad, setPrioridad] = useState<NivelPrioridad | null>(tarea?.prioridad || null);
    const [urgencia, setUrgencia] = useState<NivelUrgencia | null>(tarea?.urgencia || null);
    const [fechaMaxima, setFechaMaxima] = useState<string>(tarea?.configuracion?.fechaMaxima || '');
    const [descripcion, setDescripcion] = useState<string>(tarea?.configuracion?.descripcion || '');
    const [tieneRepeticion, setTieneRepeticion] = useState<boolean>(!!tarea?.configuracion?.repeticion);
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>({tipo: 'diario'});
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>(tarea?.configuracion?.adjuntos || []);
    const [texto, setTexto] = useState(tarea?.texto || '');

    /* Estado para asignacion */
    const [asignadoA, setAsignadoA] = useState<number | null>(tarea?.asignadoA || null);
    const [asignadoANombre, setAsignadoANombre] = useState<string>(tarea?.asignadoANombre || '');
    const [asignadoAAvatar, setAsignadoAAvatar] = useState<string>(tarea?.asignadoAAvatar || '');

    /* Sincronizar estado cuando cambia la tarea (solo por ID, no por referencia) */
    useEffect(() => {
        if (tarea) {
            setPrioridad(tarea.prioridad || null);
            setUrgencia(tarea.urgencia || null);
            setFechaMaxima(tarea.configuracion?.fechaMaxima || '');
            setDescripcion(tarea.configuracion?.descripcion || '');
            setTieneRepeticion(!!tarea.configuracion?.repeticion);

            /* Convertir RepeticionTarea a FrecuenciaHabito */
            if (tarea.configuracion?.repeticion) {
                const {intervalo, diasSemana} = tarea.configuracion.repeticion;
                if (diasSemana && diasSemana.length > 0) {
                    setFrecuencia({tipo: 'diasEspecificos', diasSemana});
                } else if (intervalo === 1) {
                    setFrecuencia({tipo: 'diario'});
                } else if (intervalo === 7) {
                    setFrecuencia({tipo: 'semanal'});
                } else {
                    setFrecuencia({tipo: 'cadaXDias', cadaDias: intervalo});
                }
            } else {
                setFrecuencia({tipo: 'diario'});
            }

            setAdjuntos(tarea.configuracion?.adjuntos || []);
            setTexto(tarea.texto);
            setAsignadoA(tarea.asignadoA || null);
            setAsignadoANombre(tarea.asignadoANombre || '');
            setAsignadoAAvatar(tarea.asignadoAAvatar || '');
        } else {
            /* Resetear si no hay tarea (modo creacion) */
            setPrioridad(null);
            setUrgencia(null);
            setFechaMaxima('');
            setDescripcion('');
            setTieneRepeticion(false);
            setFrecuencia({tipo: 'diario'});
            setAdjuntos([]);
            setTexto('');
            setAsignadoA(null);
            setAsignadoANombre('');
            setAsignadoAAvatar('');
        }
    }, [tarea?.id]);

    /* Manejador de cambio de asignacion */
    const manejarAsignacion = (usuarioId: number | null, nombre: string, avatar: string) => {
        setAsignadoA(usuarioId);
        setAsignadoANombre(nombre);
        setAsignadoAAvatar(avatar);
    };

    const manejarGuardar = () => {
        const configuracion: TareaConfiguracion = {};

        if (fechaMaxima) {
            configuracion.fechaMaxima = fechaMaxima;
        }

        if (descripcion.trim()) {
            configuracion.descripcion = descripcion.trim();
        }

        if (tieneRepeticion) {
            /* Convertir FrecuenciaHabito a RepeticionTarea */
            const repeticion: any = {
                tipo: 'despuesCompletar',
                intervalo: 1
            };

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
        }

        /* Siempre incluir adjuntos para permitir eliminación */
        configuracion.adjuntos = adjuntos;

        /* Preparar datos de asignacion */
        const asignacion = {
            asignadoA,
            asignadoANombre,
            asignadoAAvatar
        };

        onGuardar(configuracion, prioridad, texto.trim(), asignacion, urgencia);
        onCerrar();
    };

    const esModoCreacion = !tarea;
    const tieneParticipantes = participantes.length > 0;

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo={esModoCreacion ? 'Nueva Tarea' : 'Configurar Tarea'} claseExtra="panelConfiguracionContenedor">
            <div className="panelConfiguracionContenido" style={{padding: 0}}>
                {/* Nombre de la tarea - Campo reutilizable */}
                <CampoTexto titulo="Nombre de la tarea" valor={texto} onChange={setTexto} placeholder="Nombre de la tarea" />

                {/* Prioridad - Campo reutilizable */}
                <CampoPrioridad<NivelPrioridad> tipo="prioridad" valor={prioridad} onChange={setPrioridad} permitirNulo={true} />

                {/* Urgencia - Temporalidad (bloqueante, urgente, normal, chill) */}
                <CampoUrgencia valor={urgencia} onChange={setUrgencia} permitirNulo={true} />

                {/* Fecha Limite - Campo reutilizable */}
                <CampoFechaLimite valor={fechaMaxima} onChange={setFechaMaxima} />

                {/* Descripcion - Campo reutilizable */}
                <CampoTexto titulo="Descripcion" valor={descripcion} onChange={setDescripcion} placeholder="Notas adicionales sobre esta tarea..." tipo="textarea" filas={3} />

                {/* Seccion: Asignacion (solo si hay participantes) */}
                {tieneParticipantes && (
                    <SeccionPanel titulo="Asignar a">
                        <SelectorAsignado participantes={participantes} asignadoActual={asignadoA} onAsignar={manejarAsignacion} />
                    </SeccionPanel>
                )}

                {/* Seccion: Repeticion */}
                <SeccionPanel titulo="Repeticion">
                    <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '-1.5rem'}}>
                        <ToggleSwitch checked={tieneRepeticion} onChange={setTieneRepeticion} className="panelConfiguracionToggle" />
                    </div>

                    {tieneRepeticion && (
                        <div className="panelConfiguracionRepeticion">
                            <div style={{marginTop: '1rem'}}>
                                <SelectorFrecuencia frecuencia={frecuencia} onChange={setFrecuencia} />
                            </div>
                        </div>
                    )}
                </SeccionPanel>

                {/* Seccion: Adjuntos */}
                <SeccionAdjuntos adjuntos={adjuntos} onChange={setAdjuntos} />
            </div>

            {/* Acciones reutilizables */}
            <AccionesFormulario onCancelar={onCerrar} onGuardar={manejarGuardar} textoGuardar={esModoCreacion ? 'Crear Tarea' : 'Guardar configuracion'} />
        </Modal>
    );
}
