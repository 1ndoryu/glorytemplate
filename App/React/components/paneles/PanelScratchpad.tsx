/*
 * PanelScratchpad
 * Componente que renderiza el panel de notas rápidas (Scratchpad)
 * Nota: En móvil el header del panel se oculta via CSS (Fase 10.8.3)
 *
 * Sistema de notas persistentes con autoguardado:
 * - Siempre hay una nota activa siendo editada
 * - Los cambios se guardan automáticamente después de 2 segundos de inactividad
 * - El título se extrae de la primera línea con #
 *
 * Fase 15.6: Se añadió autoguardado debounced y restauración de última nota
 */

import {useState, useRef} from 'react';
import {Eraser, Settings, FolderOpen, Plus, Maximize2, X, Copy, FileText, Columns} from 'lucide-react';
import {SeccionEncabezado, Scratchpad, ModalNotasExpandido} from '../dashboard';
import {OverlayEnfoque, MenuContextual} from '../shared';
import {Boton} from '../ui';
import type {ConfiguracionScratchpad} from '../../hooks/useConfiguracionScratchpad';
import {usePanelScratchpad} from '../../hooks/paneles/usePanelScratchpad';

interface PanelScratchpadProps {
    configuracion: ConfiguracionScratchpad;
    onAbrirModalConfigScratchpad: () => void;
    onCambiarAltura: (altura: string) => void;
    renderHandleArrastre: (titulo?: string) => JSX.Element;
    handleMinimizar: JSX.Element;
    /* [263A-3] Props para duplicación de panel */
    panelId?: string;
    onDuplicarPanel?: () => void;
    onCerrarPanel?: () => void;
    onDividirPanel?: () => void;
}

export function PanelScratchpad({configuracion, onAbrirModalConfigScratchpad, onCambiarAltura, renderHandleArrastre, handleMinimizar, onDuplicarPanel, onCerrarPanel, onDividirPanel, panelId}: PanelScratchpadProps): JSX.Element {
    /* [263A-12] Cada panel usa su propio panelId para notas independientes */
    const panelIdResuelto = panelId ?? 'scratchpad';
    const {modalNotasExpandidoAbierto, setModalNotasExpandidoAbierto, modoEnfoque, setModoEnfoque, notaActiva, actualizarContenido, tituloActivo, esNotaNueva, manejarNuevaNota, manejarLimpiar, manejarAbrirCarpeta} = usePanelScratchpad(panelIdResuelto);

    /* [253A-10] Submenú del botón + para crear nota en panel o ventana */
    const [menuNuevaNota, setMenuNuevaNota] = useState<{visible: boolean; x: number; y: number}>({visible: false, x: 0, y: 0});
    const btnNuevaNotaRef = useRef<HTMLButtonElement>(null);

    const abrirMenuNuevaNota = () => {
        if (btnNuevaNotaRef.current) {
            const rect = btnNuevaNotaRef.current.getBoundingClientRect();
            setMenuNuevaNota({visible: true, x: rect.left, y: rect.bottom + 4});
        }
    };

    /* [263A-3] Determinar si es un panel duplicado (tiene sufijo numérico) */
    const esDuplicado = !!onCerrarPanel;

    return (
        <div className="internaColumna internaColumna--notas">
            <SeccionEncabezado
                icono={null}
                titulo={renderHandleArrastre('Notas')}
                subtitulo={undefined}
                variante="panelHeader"
                acciones={
                    <>
                        {/* [263A-3] Botón nueva nota con submenú (duplicar panel) */}
                        <Boton
                            ref={btnNuevaNotaRef}
                            variante="badge"
                            soloIcono
                            onClick={abrirMenuNuevaNota}
                            icono={<Plus size={12} />}
                            title="Nueva nota"
                        />
                        {/* Botón abrir notas guardadas */}
                        <Boton
                            variante="badge"
                            soloIcono
                            onClick={manejarAbrirCarpeta}
                            icono={<FolderOpen size={12} />}
                            title="Ver notas guardadas"
                        />
                        {/* Botón limpiar */}
                        <Boton
                            variante="badge"
                            soloIcono
                            onClick={manejarLimpiar}
                            icono={<Eraser size={12} />}
                            title="Limpiar / Nueva nota"
                        />
                        {/* Botón configuración */}
                        <Boton
                            variante="badge"
                            soloIcono
                            onClick={onAbrirModalConfigScratchpad}
                            icono={<Settings size={12} />}
                            title="Configuración"
                        />
                        {/* Botón modo enfoque */}
                        <Boton
                            variante="badge"
                            soloIcono
                            onClick={() => setModoEnfoque(true)}
                            icono={<Maximize2 size={12} />}
                            title="Modo enfoque"
                        />
                        {/* Botón dividir panel */}
                        {onDividirPanel && (
                            <Boton
                                variante="badge"
                                soloIcono
                                onClick={onDividirPanel}
                                icono={<Columns size={12} />}
                                title="Dividir panel"
                            />
                        )}
                        {/* [263A-3] Botón cerrar para paneles duplicados */}
                        {esDuplicado ? (
                            <Boton
                                variante="badge"
                                soloIcono
                                onClick={onCerrarPanel}
                                icono={<X size={12} />}
                                title="Cerrar panel duplicado"
                            />
                        ) : (
                            handleMinimizar
                        )}
                    </>
                }
            />
            <Scratchpad valorInicial={notaActiva.contenido} onChange={actualizarContenido} tamanoFuente={configuracion.tamanoFuente} altura={configuracion.altura} delayGuardado={configuracion.autoGuardadoIntervalo} onCambiarAltura={onCambiarAltura} />

            <ModalNotasExpandido abierto={modalNotasExpandidoAbierto} onCerrar={() => setModalNotasExpandidoAbierto(false)} tamanoFuente={configuracion.tamanoFuente} delayGuardado={configuracion.autoGuardadoIntervalo} panelId={panelIdResuelto} />

            {/* [263A-3] Submenú nueva nota: aquí o duplicar panel */}
            {menuNuevaNota.visible && (
                <MenuContextual
                    opciones={[
                        {id: 'aqui', etiqueta: 'Nueva nota', icono: <FileText size={12} />},
                        ...(onDuplicarPanel ? [{id: 'duplicar', etiqueta: 'Nota en nuevo panel', icono: <Copy size={12} />}] : [])
                    ]}
                    posicionX={menuNuevaNota.x}
                    posicionY={menuNuevaNota.y}
                    onSeleccionar={(id) => {
                        setMenuNuevaNota(prev => ({...prev, visible: false}));
                        if (id === 'aqui') {
                            manejarNuevaNota();
                        } else if (id === 'duplicar' && onDuplicarPanel) {
                            onDuplicarPanel();
                        }
                    }}
                    onCerrar={() => setMenuNuevaNota(prev => ({...prev, visible: false}))}
                />
            )}

            {/* Overlay modo enfoque */}
            <OverlayEnfoque estaActivo={modoEnfoque} onCerrar={() => setModoEnfoque(false)} titulo={esNotaNueva ? 'Nueva nota' : tituloActivo}>
                <Scratchpad valorInicial={notaActiva.contenido} onChange={actualizarContenido} tamanoFuente={configuracion.tamanoFuente} altura="100%" delayGuardado={configuracion.autoGuardadoIntervalo} mostrarResizeHandle={false} />
            </OverlayEnfoque>
        </div>
    );
}
