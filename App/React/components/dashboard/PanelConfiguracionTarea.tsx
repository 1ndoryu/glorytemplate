/*
 * PanelConfiguracionTarea
 * Panel modal para configurar opciones avanzadas de una tarea
 * Responsabilidad: prioridad, fecha limite, descripcion, repeticion
 *
 * Usa campos compartidos: CampoTexto, CampoPrioridad, CampoFechaLimite
 */

import {useState, useEffect} from 'react';
import type {Tarea, TareaConfiguracion, NivelPrioridad} from '../../types/dashboard';
import {AccionesFormulario, Modal, SeccionPanel, ToggleSwitch, CampoTexto, CampoPrioridad, CampoFechaLimite} from '../shared';
import {SelectorFrecuencia} from './SelectorFrecuencia';
import {SeccionAdjuntos} from './SeccionAdjuntos';
import type {FrecuenciaHabito, Adjunto} from '../../types/dashboard';

export interface PanelConfiguracionTareaProps {
    tarea?: Tarea;
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string) => void;
}

export function PanelConfiguracionTarea({tarea, estaAbierto, onCerrar, onGuardar}: PanelConfiguracionTareaProps): JSX.Element | null {
    /* Estado local para edicion */
    const [prioridad, setPrioridad] = useState<NivelPrioridad | null>(tarea?.prioridad || null);
    const [fechaMaxima, setFechaMaxima] = useState<string>(tarea?.configuracion?.fechaMaxima || '');
    const [descripcion, setDescripcion] = useState<string>(tarea?.configuracion?.descripcion || '');
    const [tieneRepeticion, setTieneRepeticion] = useState<boolean>(!!tarea?.configuracion?.repeticion);
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>({tipo: 'diario'});
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>(tarea?.configuracion?.adjuntos || []);
    const [texto, setTexto] = useState(tarea?.texto || '');

    /* Sincronizar estado cuando cambia la tarea */
    useEffect(() => {
        if (tarea) {
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

            setAdjuntos(tarea.configuracion?.adjuntos || []);
            setTexto(tarea.texto);
        } else {
            /* Resetear si no hay tarea (modo creacion) */
            // Solo si se acaba de abrir (esta logica puede requerir mejorar si el componente no se desmonta)
            // Pero si se usa con renderizado condicional en el padre, esto es el estado inicial.
        }
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

        if (adjuntos.length > 0) {
            configuracion.adjuntos = adjuntos;
        }

        onGuardar(configuracion, prioridad, texto.trim());
        /* No cerramos aqui automaticamente para dar control al padre si es necesario, 
           pero en la implementacion actual el padre suele cerrar o el componente se desmonta */
        // onCerrar(); // El padre debe cerrarlo
        // Correction: The original code called onCerrar(). Keeping it consistent.
        onCerrar();
    };

    const esModoCreacion = !tarea;

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo={esModoCreacion ? 'Nueva Tarea' : 'Configurar Tarea'} claseExtra="panelConfiguracionContenedor">
            <div className="panelConfiguracionContenido" style={{padding: 0}}>
                {/* Nombre de la tarea - Campo reutilizable */}
                <CampoTexto titulo="Nombre de la tarea" valor={texto} onChange={setTexto} placeholder="Nombre de la tarea" />

                {/* Prioridad - Campo reutilizable */}
                <CampoPrioridad<NivelPrioridad> tipo="prioridad" valor={prioridad} onChange={setPrioridad} permitirNulo={true} />

                {/* Fecha Limite - Campo reutilizable */}
                <CampoFechaLimite valor={fechaMaxima} onChange={setFechaMaxima} />

                {/* Descripcion - Campo reutilizable */}
                <CampoTexto titulo="Descripcion" valor={descripcion} onChange={setDescripcion} placeholder="Notas adicionales sobre esta tarea..." tipo="textarea" filas={3} />

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
