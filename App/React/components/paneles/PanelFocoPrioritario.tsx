/*
 * PanelFocoPrioritario
 * Componente que renderiza el panel de hábitos (Foco Prioritario)
 * Responsabilidad única: renderizar la tabla de hábitos con sus controles
 */

import {AlertCircle, ArrowUpDown, Plus, Settings} from 'lucide-react';
import {SeccionEncabezado, TablaHabitos} from '../dashboard';
import {SelectorBadge} from '../shared/SelectorBadge';
import type {Habito} from '../../types/dashboard';
import type {ConfiguracionHabitos} from '../../hooks/useConfiguracionHabitos';

interface PanelFocoPrioritarioProps {
    habitos: Habito[];
    modoOrdenHabitos: string;
    opcionesOrdenHabitos: Array<{id: string; etiqueta: string; descripcion: string}>;
    configuracion: ConfiguracionHabitos;
    onAbrirModalCrearHabito: () => void;
    onAbrirModalConfigHabitos: () => void;
    onToggleHabito: (id: number) => void;
    onEditarHabito: (habito: Habito) => void;
    onEliminarHabito: (id: number) => void;
    onCambiarModoHabitos: (modo: any) => void;
    handleArrastre: JSX.Element;
}

export function PanelFocoPrioritario({habitos, modoOrdenHabitos, opcionesOrdenHabitos, configuracion, onAbrirModalCrearHabito, onAbrirModalConfigHabitos, onToggleHabito, onEditarHabito, onEliminarHabito, onCambiarModoHabitos, handleArrastre}: PanelFocoPrioritarioProps): JSX.Element {
    return (
        <div className="panelDashboard">
            <SeccionEncabezado
                icono={<AlertCircle size={12} />}
                titulo="Foco Prioritario"
                acciones={
                    <>
                        {handleArrastre}
                        <SelectorBadge opciones={opcionesOrdenHabitos} valorActual={modoOrdenHabitos} onChange={valor => onCambiarModoHabitos(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar hábitos" />
                        <button className="selectorBadgeBoton" onClick={onAbrirModalCrearHabito} title="Nuevo Hábito">
                            <span className="selectorBadgeIcono">
                                <Plus size={10} />
                            </span>
                        </button>
                        <button className="selectorBadgeBoton" onClick={onAbrirModalConfigHabitos} title="Configuración">
                            <span className="selectorBadgeIcono">
                                <Settings size={10} />
                            </span>
                        </button>
                    </>
                }
            />
            <TablaHabitos habitos={habitos} onAñadirHabito={onAbrirModalCrearHabito} onToggleHabito={onToggleHabito} onEditarHabito={onEditarHabito} onEliminarHabito={onEliminarHabito} configuracion={configuracion} />
        </div>
    );
}
