/*
 * PanelConfiguracionTarea
 * Panel modal para configurar opciones avanzadas de una tarea
 * Responsabilidad: prioridad, fecha limite, descripcion, repeticion
 */

import {useState, useCallback, useEffect} from 'react';
import {X, Calendar, FileText, Repeat, AlertCircle, Flag} from 'lucide-react';
import type {Tarea, TareaConfiguracion, TipoRepeticion, DiaSemana, NivelPrioridad} from '../../types/dashboard';
import {AccionesFormulario, Modal, SeccionPanel, SelectorNivel} from '../shared';

export interface PanelConfiguracionTareaProps {
    tarea: Tarea;
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string) => void;
}

const DIAS_SEMANA: {valor: DiaSemana; etiqueta: string}[] = [
    {valor: 'lunes', etiqueta: 'Lun'},
    {valor: 'martes', etiqueta: 'Mar'},
    {valor: 'miercoles', etiqueta: 'Mié'},
    {valor: 'jueves', etiqueta: 'Jue'},
    {valor: 'viernes', etiqueta: 'Vie'},
    {valor: 'sabado', etiqueta: 'Sáb'},
    {valor: 'domingo', etiqueta: 'Dom'}
];

export function PanelConfiguracionTarea({tarea, estaAbierto, onCerrar, onGuardar}: PanelConfiguracionTareaProps): JSX.Element | null {
    /* Estado local para edicion */
    const [prioridad, setPrioridad] = useState<NivelPrioridad | null>(tarea.prioridad || null);
    const [fechaMaxima, setFechaMaxima] = useState<string>(tarea.configuracion?.fechaMaxima || '');
    const [descripcion, setDescripcion] = useState<string>(tarea.configuracion?.descripcion || '');
    const [tieneRepeticion, setTieneRepeticion] = useState<boolean>(!!tarea.configuracion?.repeticion);
    const [tipoRepeticion, setTipoRepeticion] = useState<TipoRepeticion>(tarea.configuracion?.repeticion?.tipo || 'intervaloFijo');
    const [intervalo, setIntervalo] = useState<number>(tarea.configuracion?.repeticion?.intervalo || 7);
    const [diasSemana, setDiasSemana] = useState<DiaSemana[]>(tarea.configuracion?.repeticion?.diasSemana || []);
    const [texto, setTexto] = useState(tarea.texto);

    /* Sincronizar estado cuando cambia la tarea */
    useEffect(() => {
        setPrioridad(tarea.prioridad || null);
        setFechaMaxima(tarea.configuracion?.fechaMaxima || '');
        setDescripcion(tarea.configuracion?.descripcion || '');
        setTieneRepeticion(!!tarea.configuracion?.repeticion);
        setTipoRepeticion(tarea.configuracion?.repeticion?.tipo || 'intervaloFijo');
        setIntervalo(tarea.configuracion?.repeticion?.intervalo || 7);
        setDiasSemana(tarea.configuracion?.repeticion?.diasSemana || []);
        setTexto(tarea.texto);
    }, [tarea]);

    const toggleDiaSemana = (dia: DiaSemana) => {
        setDiasSemana(prev => (prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]));
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
            configuracion.repeticion = {
                tipo: tipoRepeticion,
                intervalo,
                ...(diasSemana.length > 0 && {diasSemana})
            };
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
                    <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '-1.5rem', marginBottom: '1rem'}}>
                        <label className="panelConfiguracionToggle">
                            <input type="checkbox" checked={tieneRepeticion} onChange={e => setTieneRepeticion(e.target.checked)} />
                            <span className="panelConfiguracionToggleSlider" />
                        </label>
                    </div>

                    {tieneRepeticion && (
                        <div className="panelConfiguracionRepeticion">
                            {/* Tipo de repeticion */}
                            <div className="panelConfiguracionTipoRepeticion">
                                <button type="button" className={`panelConfiguracionTipoBoton ${tipoRepeticion === 'intervaloFijo' ? 'panelConfiguracionTipoBotonActivo' : ''}`} onClick={() => setTipoRepeticion('intervaloFijo')}>
                                    <span className="panelConfiguracionTipoTitulo">Intervalo Fijo</span>
                                    <span className="panelConfiguracionTipoDesc">Repetir cada X dias</span>
                                </button>
                                <button type="button" className={`panelConfiguracionTipoBoton ${tipoRepeticion === 'despuesCompletar' ? 'panelConfiguracionTipoBotonActivo' : ''}`} onClick={() => setTipoRepeticion('despuesCompletar')}>
                                    <span className="panelConfiguracionTipoTitulo">Tras Completar</span>
                                    <span className="panelConfiguracionTipoDesc">Repetir X dias despues</span>
                                </button>
                            </div>

                            {/* Intervalo */}
                            <div className="panelConfiguracionIntervalo">
                                <label className="panelConfiguracionIntervaloLabel">{tipoRepeticion === 'intervaloFijo' ? 'Cada' : 'Despues de'}</label>
                                <input type="number" className="panelConfiguracionIntervaloInput" min={1} max={365} value={intervalo} onChange={e => setIntervalo(Math.max(1, parseInt(e.target.value) || 1))} />
                                <span className="panelConfiguracionIntervaloSufijo">dias</span>
                            </div>

                            {/* Dias de la semana (solo para intervalo fijo) */}
                            {tipoRepeticion === 'intervaloFijo' && (
                                <div className="panelConfiguracionDiasSemana">
                                    <span className="panelConfiguracionDiasSemanaLabel">O dias especificos:</span>
                                    <div className="panelConfiguracionDiasBotones">
                                        {DIAS_SEMANA.map(dia => (
                                            <button key={dia.valor} type="button" className={`panelConfiguracionDiaBoton ${diasSemana.includes(dia.valor) ? 'panelConfiguracionDiaBotonActivo' : ''}`} onClick={() => toggleDiaSemana(dia.valor)}>
                                                {dia.etiqueta}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SeccionPanel>
            </div>

            {/* Acciones reutilizables */}
            <AccionesFormulario onCancelar={onCerrar} onGuardar={manejarGuardar} textoGuardar="Guardar configuracion" />
        </Modal>
    );
}
