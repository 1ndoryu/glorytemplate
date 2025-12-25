/*
 * PanelScratchpad
 * Componente que renderiza el panel de notas rápidas (Scratchpad)
 *
 * Sistema de notas persistentes:
 * - Siempre hay una nota activa siendo editada
 * - Al guardar se actualiza la nota activa (no crea nueva si ya existe)
 * - El título se extrae de la primera línea con #
 */

import {useState} from 'react';
import {FileText, Eraser, Settings, Save, FolderOpen, Loader, Plus} from 'lucide-react';
import {SeccionEncabezado, Scratchpad, ModalNotasGuardadas} from '../dashboard';
import {useNotas} from '../../hooks';
import type {Nota} from '../../hooks';
import type {ConfiguracionScratchpad} from '../../hooks/useConfiguracionScratchpad';
import {useAlertas} from '../../hooks/useAlertas';

interface PanelScratchpadProps {
    configuracion: ConfiguracionScratchpad;
    onAbrirModalConfigScratchpad: () => void;
    onCambiarAltura: (altura: string) => void;
    handleArrastre: JSX.Element;
    handleMinimizar: JSX.Element;
}

export function PanelScratchpad({configuracion, onAbrirModalConfigScratchpad, onCambiarAltura, handleArrastre, handleMinimizar}: PanelScratchpadProps): JSX.Element {
    const [modalNotasAbierto, setModalNotasAbierto] = useState(false);
    const {estado, guardarNotaActiva, seleccionarNota, crearNuevaNota, actualizarContenido, obtenerTituloDeContenido} = useNotas();
    const {mostrarExito, mostrarError, mostrarAdvertencia} = useAlertas();

    const {notaActiva} = estado;

    const manejarGuardarNota = async () => {
        if (!notaActiva.contenido.trim() || notaActiva.contenido === '# Nueva nota\n\n') {
            mostrarAdvertencia('Escribe algo antes de guardar');
            return;
        }

        const nota = await guardarNotaActiva();
        if (nota) {
            const accion = notaActiva.id ? 'actualizada' : 'guardada';
            mostrarExito(`Nota "${obtenerTituloDeContenido(nota.contenido)}" ${accion}`);
        } else {
            mostrarError('Error al guardar la nota');
        }
    };

    const manejarSeleccionarNota = (nota: Nota) => {
        seleccionarNota(nota);
        setModalNotasAbierto(false);
        mostrarExito(`Editando: ${nota.titulo}`);
    };

    const manejarNuevaNota = () => {
        crearNuevaNota();
        mostrarExito('Nueva nota creada');
    };

    const manejarLimpiar = () => {
        crearNuevaNota();
    };

    /* Título de la nota activa para mostrar en el encabezado */
    const tituloActivo = obtenerTituloDeContenido(notaActiva.contenido);
    const esNotaNueva = notaActiva.id === null;

    return (
        <div className="panelDashboard internaColumna">
            <SeccionEncabezado
                icono={<FileText size={12} />}
                titulo="Scratchpad"
                subtitulo={esNotaNueva ? 'Nueva nota' : tituloActivo}
                acciones={
                    <>
                        {handleArrastre}
                        {/* Botón nueva nota */}
                        <button className="selectorBadgeBoton selectorBadgeBotonCompacto" onClick={manejarNuevaNota} title="Nueva nota">
                            <span className="selectorBadgeIcono">
                                <Plus size={10} />
                            </span>
                        </button>
                        {/* Botón guardar nota */}
                        <button className="selectorBadgeBoton selectorBadgeBotonCompacto" onClick={manejarGuardarNota} title={notaActiva.id ? 'Guardar cambios' : 'Guardar nota'} disabled={estado.guardando}>
                            <span className="selectorBadgeIcono">{estado.guardando ? <Loader size={10} className="animacionGirar" /> : <Save size={10} />}</span>
                        </button>
                        {/* Botón abrir notas guardadas */}
                        <button className="selectorBadgeBoton selectorBadgeBotonCompacto" onClick={() => setModalNotasAbierto(true)} title="Ver notas guardadas">
                            <span className="selectorBadgeIcono">
                                <FolderOpen size={10} />
                            </span>
                        </button>
                        {/* Botón limpiar */}
                        <button className="selectorBadgeBoton selectorBadgeBotonCompacto" onClick={manejarLimpiar} title="Limpiar / Nueva nota">
                            <span className="selectorBadgeIcono">
                                <Eraser size={10} />
                            </span>
                        </button>
                        {/* Botón configuración */}
                        <button className="selectorBadgeBoton" onClick={onAbrirModalConfigScratchpad} title="Configuración">
                            <span className="selectorBadgeIcono">
                                <Settings size={10} />
                            </span>
                        </button>
                        {handleMinimizar}
                    </>
                }
            />
            <Scratchpad valorInicial={notaActiva.contenido} onChange={actualizarContenido} tamanoFuente={configuracion.tamanoFuente} altura={configuracion.altura} delayGuardado={configuracion.autoGuardadoIntervalo} onCambiarAltura={onCambiarAltura} />

            {/* Modal de notas guardadas */}
            <ModalNotasGuardadas abierto={modalNotasAbierto} onCerrar={() => setModalNotasAbierto(false)} onSeleccionarNota={manejarSeleccionarNota} />
        </div>
    );
}
