/*
 * PanelConfiguracionTarea
 * Panel modal para configurar opciones avanzadas de una tarea
 * Responsabilidad: prioridad, fecha limite, descripcion, repeticion
 */

import {useState, useCallback, useEffect} from 'react';
import {X, Calendar, FileText, Repeat, AlertCircle, Flag} from 'lucide-react';
import type {Tarea, TareaConfiguracion, TipoRepeticion, DiaSemana, NivelPrioridad} from '../../types/dashboard';

export interface PanelConfiguracionTareaProps {
    tarea: Tarea;
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (configuracion: TareaConfiguracion, prioridad?: NivelPrioridad | null) => void;
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

    /* Sincronizar estado cuando cambia la tarea */
    useEffect(() => {
        setPrioridad(tarea.prioridad || null);
        setFechaMaxima(tarea.configuracion?.fechaMaxima || '');
        setDescripcion(tarea.configuracion?.descripcion || '');
        setTieneRepeticion(!!tarea.configuracion?.repeticion);
        setTipoRepeticion(tarea.configuracion?.repeticion?.tipo || 'intervaloFijo');
        setIntervalo(tarea.configuracion?.repeticion?.intervalo || 7);
        setDiasSemana(tarea.configuracion?.repeticion?.diasSemana || []);
    }, [tarea]);

    /* Cerrar con Escape */
    const manejarTecla = useCallback(
        (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') {
                onCerrar();
            }
        },
        [onCerrar]
    );

    useEffect(() => {
        if (estaAbierto) {
            document.addEventListener('keydown', manejarTecla);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', manejarTecla);
            document.body.style.overflow = '';
        };
    }, [estaAbierto, manejarTecla]);

    const manejarClickOverlay = (evento: React.MouseEvent<HTMLDivElement>) => {
        if (evento.target === evento.currentTarget) {
            onCerrar();
        }
    };

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

        onGuardar(configuracion, prioridad);
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

    if (!estaAbierto) return null;

    return (
        <div id="panel-configuracion-tarea-overlay" className="modalOverlay" onClick={manejarClickOverlay}>
            <div className="panelConfiguracionContenedor" role="dialog" aria-modal="true" aria-labelledby="panel-configuracion-titulo">
                {/* Encabezado */}
                <div className="panelConfiguracionEncabezado">
                    <h2 id="panel-configuracion-titulo" className="panelConfiguracionTitulo">
                        Configurar Tarea
                    </h2>
                    <button className="modalBotonCerrar" onClick={onCerrar} aria-label="Cerrar panel" type="button">
                        <X size={16} />
                    </button>
                </div>

                {/* Nombre de la tarea (solo lectura) */}
                <div className="panelConfiguracionTarea">
                    <span className="panelConfiguracionTareaNombre">{tarea.texto}</span>
                </div>

                {/* Contenido */}
                <div className="panelConfiguracionContenido">
                    {/* Seccion: Prioridad */}
                    <div className="panelConfiguracionSeccion">
                        <div className="panelConfiguracionSeccionEncabezado">
                            <Flag size={14} />
                            <span>Prioridad</span>
                        </div>
                        <div className="formularioGrupoBotones">
                            <button type="button" className={`formularioBotonImportancia ${prioridad === 'alta' ? 'formularioBotonImportanciaActivo formularioBotonImportanciaAlta' : ''}`} onClick={() => setPrioridad(prioridad === 'alta' ? null : 'alta')}>
                                Alta
                            </button>
                            <button type="button" className={`formularioBotonImportancia ${prioridad === 'media' ? 'formularioBotonImportanciaActivo formularioBotonImportanciaMedia' : ''}`} onClick={() => setPrioridad(prioridad === 'media' ? null : 'media')}>
                                Media
                            </button>
                            <button type="button" className={`formularioBotonImportancia ${prioridad === 'baja' ? 'formularioBotonImportanciaActivo formularioBotonImportanciaBaja' : ''}`} onClick={() => setPrioridad(prioridad === 'baja' ? null : 'baja')}>
                                Baja
                            </button>
                        </div>
                    </div>

                    {/* Seccion: Fecha Limite */}
                    <div className="panelConfiguracionSeccion">
                        <div className="panelConfiguracionSeccionEncabezado">
                            <Calendar size={14} />
                            <span>Fecha Limite</span>
                        </div>
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
                    </div>

                    {/* Seccion: Descripcion */}
                    <div className="panelConfiguracionSeccion">
                        <div className="panelConfiguracionSeccionEncabezado">
                            <FileText size={14} />
                            <span>Descripcion</span>
                        </div>
                        <textarea className="panelConfiguracionTextarea" placeholder="Notas adicionales sobre esta tarea..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} />
                    </div>

                    {/* Seccion: Repeticion */}
                    <div className="panelConfiguracionSeccion">
                        <div className="panelConfiguracionSeccionEncabezado">
                            <Repeat size={14} />
                            <span>Repeticion</span>
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
                    </div>
                </div>

                {/* Acciones */}
                <div className="panelConfiguracionAcciones">
                    <button type="button" className="panelConfiguracionBotonCancelar" onClick={onCerrar}>
                        Cancelar
                    </button>
                    <button type="button" className="panelConfiguracionBotonGuardar" onClick={manejarGuardar}>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
