/*
 * PanelScratchpad
 * Componente que renderiza el panel de notas rápidas (Scratchpad)
 *
 * Sistema de notas persistentes con autoguardado:
 * - Siempre hay una nota activa siendo editada
 * - Los cambios se guardan automáticamente después de 2 segundos de inactividad
 * - El título se extrae de la primera línea con #
 */

import {useState} from 'react';
import {FileText, Eraser, Settings, FolderOpen, Plus} from 'lucide-react';
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
    const {estado, seleccionarNota, crearNuevaNota, actualizarContenido, obtenerTituloDeContenido, guardarNotaActiva} = useNotas();
    const {mostrarExito} = useAlertas();

    const {notaActiva} = estado;

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

    /* Guardar la nota activa antes de abrir el modal de notas guardadas
     * para evitar que la nota editándose aparezca desincronizada */
    const manejarAbrirCarpeta = async () => {
        /* Si hay contenido modificado, guardarlo primero */
        if (notaActiva.modificada && notaActiva.contenido.trim()) {
            await guardarNotaActiva();
        }
        setModalNotasAbierto(true);
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
                        {/* Botón abrir notas guardadas */}
                        <button className="selectorBadgeBoton selectorBadgeBotonCompacto" onClick={manejarAbrirCarpeta} title="Ver notas guardadas">
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
