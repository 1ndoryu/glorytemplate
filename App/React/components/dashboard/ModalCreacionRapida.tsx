/*
 * ModalCreacionRapida
 * Modal minimalista para creación rápida de Tareas, Hábitos y Proyectos.
 * Diseño estilo "Spotlight" / "Command Palette" con efecto glass.
 * Lógica extraída a useModalCreacionRapida, menús a MenusCreacionRapida,
 * opciones a OpcionesCreacionRapida.
 */

import {ArrowRight} from 'lucide-react';
import {Boton} from '../ui';
import {Input} from '../ui/Input';
import type {Proyecto} from '../../types/dashboard';
import type {DatosCreacion} from '../../hooks/dashboard/useModalCreacionRapida';
import {useModalCreacionRapida} from '../../hooks/dashboard/useModalCreacionRapida';
import {MenusCreacionRapida} from './creacion-rapida/MenusCreacionRapida';
import {OpcionesCreacionRapida} from './creacion-rapida/OpcionesCreacionRapida';
import '../../styles/dashboard/componentes/modalCreacionRapida.css';

interface ModalCreacionRapidaProps {
    tipo: 'tarea' | 'habito' | 'proyecto';
    proyectos?: Proyecto[];
    valoresIniciales?: {
        proyectoId?: number;
        prioridad?: string;
        urgencia?: string;
        grupoEjecucion?: string | null;
    };
    onCerrar: () => void;
    onGuardar: (datos: DatosCreacion) => Promise<void>;
    onCambiarTipo: (tipo: 'tarea' | 'habito' | 'proyecto') => void;
}

export function ModalCreacionRapida({tipo, proyectos = [], valoresIniciales = {}, onCerrar, onGuardar, onCambiarTipo}: ModalCreacionRapidaProps): JSX.Element {
    const hook = useModalCreacionRapida({tipo, valoresIniciales, onCerrar, onGuardar, onCambiarTipo});

    return (
        /* sentinel-disable-next-line componente-artesanal — modal de creacion rapida con logica especifica */
        <div className="creacionRapidaOverlay" onClick={hook.manejarClickOverlay}>
            <div className="creacionRapidaContenedor" onClick={hook.manejarClickContenedor}>
                <form onSubmit={hook.manejarSubmit}>
                    <div className="creacionRapidaInputWrapper">
                        <Input ref={hook.inputRef} tipo="text" value={hook.texto} onChange={e => hook.setTexto(e.target.value)} onKeyDown={hook.manejarKeyDown} placeholder={hook.obtenerPlaceholder()} claseAdicional="creacionRapidaInput" autoFocus />
                        <Boton type="submit" variante="primario" disabled={!hook.texto.trim() || hook.cargando} icono={<ArrowRight size={20} />} claseAdicional="creacionRapidaBotonEnviar" />
                    </div>

                    <OpcionesCreacionRapida
                        tipo={tipo}
                        opciones={hook.opciones}
                        proyectos={proyectos}
                        adjuntosCount={hook.adjuntos.length}
                        subiendo={hook.estadoSubida.subiendo}
                        obtenerEtiquetaFecha={hook.obtenerEtiquetaFecha}
                        abrirMenu={hook.abrirMenu}
                        abrirSelectorArchivo={hook.abrirSelectorArchivo}
                        setMenuProyecto={hook.setMenuProyecto}
                        setMenuFecha={hook.setMenuFecha}
                        setMenuPrioridad={hook.setMenuPrioridad}
                        setMenuUrgencia={hook.setMenuUrgencia}
                        setMenuFrecuencia={hook.setMenuFrecuencia}
                        setMenuImportancia={hook.setMenuImportancia}
                    />

                    <Input tipo="file" ref={hook.fileInputRef} claseAdicional="inputOculto" onChange={hook.manejarArchivoSeleccionado} />
                </form>
            </div>

            <MenusCreacionRapida
                proyectos={proyectos}
                fechaActual={hook.opciones.fecha}
                menuTipo={hook.menuTipo}
                menuProyecto={hook.menuProyecto}
                menuPrioridad={hook.menuPrioridad}
                menuUrgencia={hook.menuUrgencia}
                menuFrecuencia={hook.menuFrecuencia}
                menuFecha={hook.menuFecha}
                menuImportancia={hook.menuImportancia}
                seleccionarTipo={hook.seleccionarTipo}
                seleccionarProyecto={hook.seleccionarProyecto}
                seleccionarPrioridad={hook.seleccionarPrioridad}
                seleccionarUrgencia={hook.seleccionarUrgencia}
                seleccionarFrecuencia={hook.seleccionarFrecuencia}
                seleccionarFecha={hook.seleccionarFecha}
                seleccionarImportancia={hook.seleccionarImportancia}
                cerrarMenuTipo={hook.cerrarMenuTipo}
                cerrarMenuProyecto={hook.cerrarMenuProyecto}
                cerrarMenuPrioridad={hook.cerrarMenuPrioridad}
                cerrarMenuUrgencia={hook.cerrarMenuUrgencia}
                cerrarMenuFrecuencia={hook.cerrarMenuFrecuencia}
                cerrarMenuFecha={hook.cerrarMenuFecha}
                cerrarMenuImportancia={hook.cerrarMenuImportancia}
            />
        </div>
    );
}