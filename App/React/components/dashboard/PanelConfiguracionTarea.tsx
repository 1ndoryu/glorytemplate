/*
 * PanelConfiguracionTarea
 * Panel modal para configurar opciones avanzadas de una tarea
 * Responsabilidad: prioridad, fecha limite, descripcion, repeticion
 */

import {useState, useCallback, useEffect} from 'react';
import {X, Calendar, FileText, Repeat, AlertCircle, Flag} from 'lucide-react';
import type {Tarea, TareaConfiguracion, TipoRepeticion, DiaSemana, NivelPrioridad} from '../../types/dashboard';
import {AccionesFormulario, Modal, SeccionPanel, SelectorNivel} from '../shared';
import {SelectorFrecuencia} from './SelectorFrecuencia';
import type {FrecuenciaHabito} from '../../types/dashboard';

export interface PanelConfiguracionTareaProps {
    tarea: Tarea;
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string) => void;
}

export function PanelConfiguracionTarea({tarea, estaAbierto, onCerrar, onGuardar}: PanelConfiguracionTareaProps): JSX.Element | null {
    /* Estado local para edicion */
    const [prioridad, setPrioridad] = useState<NivelPrioridad | null>(tarea.prioridad || null);
    const [fechaMaxima, setFechaMaxima] = useState<string>(tarea.configuracion?.fechaMaxima || '');
    const [descripcion, setDescripcion] = useState<string>(tarea.configuracion?.descripcion || '');
    const [tieneRepeticion, setTieneRepeticion] = useState<boolean>(!!tarea.configuracion?.repeticion);
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>({tipo: 'diario'});
    const [texto, setTexto] = useState(tarea.texto);

    /* Sincronizar estado cuando cambia la tarea */
    useEffect(() => {
        setPrioridad(tarea.prioridad || null);
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

        setTexto(tarea.texto);
    }, [tarea]);

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
            /* Por defecto siempre es 'despuesCompletar' segun requerimiento */
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
                    /* Aproximacion para mensual */
                    repeticion.intervalo = Math.floor(30 / (frecuencia.vecesAlMes || 1));
                    break;
            }

            configuracion.repeticion = repeticion;
        }

        onGuardar(configuracion, prioridad, texto.trim());
        onCerrar();
    };

    /* Calcular estado de urgencia de la fecha */
    const obtenerEstadoFecha = (): 'vencida' | 'urgente' | 'proxima' | 'normal' | null => {
        if (!fechaMaxima) return null;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fecha = new Date(fechaMaxima);
        const diferenciaDias = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        if (diferenciaDias < 0) return 'vencida';
        if (diferenciaDias === 0) return 'urgente';
        if (diferenciaDias <= 3) return 'proxima';
        return 'normal';
    };

    const estadoFecha = obtenerEstadoFecha();

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configurar Tarea" claseExtra="panelConfiguracionContenedor">
            {/* Contenido (sin padding extra porque el modal ya tiene) */}
            <div className="panelConfiguracionContenido" style={{padding: 0}}>
                {/* Nombre de la tarea (Editable) */}
                <SeccionPanel titulo="Nombre de la tarea">
                    <input className="formularioInput" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Nombre de la tarea" />
                </SeccionPanel>

                {/* Seccion: Prioridad */}
                <SeccionPanel titulo="Prioridad" icono={<Flag size={14} />}>
                    <SelectorNivel<NivelPrioridad> niveles={['Alta', 'Media', 'Baja'].map(n => n.toLowerCase() as NivelPrioridad)} seleccionado={prioridad} onSeleccionar={nivel => setPrioridad(prioridad === nivel ? null : nivel)} />
                </SeccionPanel>

                {/* Seccion: Fecha Limite */}
                <SeccionPanel titulo="Fecha Limite" icono={<Calendar size={14} />}>
                    <div className={`panelConfiguracionCampo ${estadoFecha ? `panelConfiguracionCampo${estadoFecha.charAt(0).toUpperCase() + estadoFecha.slice(1)}` : ''}`}>
                        <input type="date" className="panelConfiguracionInputFecha" value={fechaMaxima} onChange={e => setFechaMaxima(e.target.value)} />
                        {estadoFecha === 'vencida' && (
                            <span className="panelConfiguracionAlerta panelConfiguracionAlertaVencida">
                                <AlertCircle size={12} />
                                Vencida
                            </span>
                        )}
                        {estadoFecha === 'urgente' && (
                            <span className="panelConfiguracionAlerta panelConfiguracionAlertaUrgente">
                                <AlertCircle size={12} />
                                Hoy
                            </span>
                        )}
                        {estadoFecha === 'proxima' && <span className="panelConfiguracionAlerta panelConfiguracionAlertaProxima">Pronto</span>}
                        {fechaMaxima && (
                            <button type="button" className="panelConfiguracionBotonLimpiar" onClick={() => setFechaMaxima('')} title="Quitar fecha">
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </SeccionPanel>

                {/* Seccion: Descripcion */}
                <SeccionPanel titulo="Descripcion" icono={<FileText size={14} />}>
                    <textarea className="panelConfiguracionTextarea" placeholder="Notas adicionales sobre esta tarea..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} />
                </SeccionPanel>

                {/* Seccion: Repeticion */}
                <SeccionPanel titulo="Repeticion" icono={<Repeat size={14} />}>
                    <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '-1.5rem'}}>
                        <label className="panelConfiguracionToggle">
                            <input type="checkbox" checked={tieneRepeticion} onChange={e => setTieneRepeticion(e.target.checked)} />
                            <span className="panelConfiguracionToggleSlider" />
                        </label>
                    </div>

                    {tieneRepeticion && (
                        <div className="panelConfiguracionRepeticion">
                            {/* Intervalo usando el selector compartido */}
                            <div style={{marginTop: '1rem'}}>
                                <SelectorFrecuencia frecuencia={frecuencia} onChange={setFrecuencia} />
                            </div>
                        </div>
                    )}
                </SeccionPanel>
            </div>

            {/* Acciones reutilizables */}
            <AccionesFormulario onCancelar={onCerrar} onGuardar={manejarGuardar} textoGuardar="Guardar configuracion" />
        </Modal>
    );
}
