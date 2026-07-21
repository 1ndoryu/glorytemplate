/*
 * PanelFocoPrioritario
 * Componente que renderiza el panel de hábitos (Foco Prioritario)
 * Responsabilidad única: renderizar la tabla de hábitos con sus controles
 * Nota: En móvil el header del panel se oculta via CSS (Fase 10.8.3)
 */

import {useState} from 'react';
import {ArrowUpDown, Plus, Settings, Maximize2} from 'lucide-react';
import {SeccionEncabezado, TablaHabitos} from '../dashboard';
import {SelectorBadge, OverlayEnfoque} from '../shared';
import {Boton} from '../ui';
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
    onPosponerHabito: (id: number) => void;
    onPausarHabito: (id: number) => void;
    onMarcarDiaHabito?: (habitoId: number, fecha: string, estado: 'completado' | 'pospuesto') => void;
    onDesmarcarDiaHabito?: (habitoId: number, fecha: string) => void;
    onActualizarHabito?: (id: number, datos: Partial<Habito>) => void;
    onCambiarModoHabitos: (modo: string) => void;
    /* [218A-1] Orden manual para hábitos */
    esOrdenManual?: boolean;
    onReordenarHabitos?: (habitos: Habito[]) => void;
    /* [217A-5] Callbacks para subhábitos */
    onToggleSubHabito?: (habitoId: number, subHabitoId: number) => void;
    onConfigurarSubHabito?: (habitoId: number, subHabitoId: number) => void;
    onPosponerSubHabitoConTiempo?: (habitoId: number, subHabitoId: number, hasta: string | null) => void;
    renderHandleArrastre: (titulo?: string) => JSX.Element;
    handleMinimizar: JSX.Element;
}

export function PanelFocoPrioritario({habitos, modoOrdenHabitos, opcionesOrdenHabitos, configuracion, onAbrirModalCrearHabito, onAbrirModalConfigHabitos, onToggleHabito, onEditarHabito, onEliminarHabito, onPosponerHabito, onPausarHabito, onMarcarDiaHabito, onDesmarcarDiaHabito, onActualizarHabito, onCambiarModoHabitos, esOrdenManual, onReordenarHabitos, onToggleSubHabito, onConfigurarSubHabito, onPosponerSubHabitoConTiempo, renderHandleArrastre, handleMinimizar}: PanelFocoPrioritarioProps): JSX.Element {
    const [modoEnfoque, setModoEnfoque] = useState(false);

    return (
        <>
            <SeccionEncabezado
                icono={null}
                titulo={renderHandleArrastre('Habitos')}
                variante="panelHeader"
                acciones={
                    <>
                        <SelectorBadge opciones={opcionesOrdenHabitos} valorActual={modoOrdenHabitos} onChange={valor => onCambiarModoHabitos(valor)} icono={<ArrowUpDown size={12} />} titulo="Ordenar hábitos" soloIcono={true} />
                        <Boton variante="badge" soloIcono onClick={onAbrirModalCrearHabito} icono={<Plus size={12} />} title="Nuevo Hábito" />
                        <Boton variante="badge" soloIcono onClick={onAbrirModalConfigHabitos} icono={<Settings size={12} />} title="Configuración" />
                        <Boton variante="badge" soloIcono onClick={() => setModoEnfoque(true)} icono={<Maximize2 size={12} />} title="Modo enfoque" />
                        {handleMinimizar}
                    </>
                }
            />
            <TablaHabitos habitos={habitos} onAñadirHabito={onAbrirModalCrearHabito} onToggleHabito={onToggleHabito} onEditarHabito={onEditarHabito} onEliminarHabito={onEliminarHabito} onPosponerHabito={onPosponerHabito} onPausarHabito={onPausarHabito} onMarcarDiaHabito={onMarcarDiaHabito} onDesmarcarDiaHabito={onDesmarcarDiaHabito} onActualizarHabito={onActualizarHabito} onToggleSubHabito={onToggleSubHabito} onConfigurarSubHabito={onConfigurarSubHabito} onPosponerSubHabitoConTiempo={onPosponerSubHabitoConTiempo} configuracion={configuracion} habilitarDrag={esOrdenManual} onReordenarHabitos={esOrdenManual ? onReordenarHabitos : undefined} />

            <OverlayEnfoque estaActivo={modoEnfoque} onCerrar={() => setModoEnfoque(false)} titulo="Habitos">
                <TablaHabitos habitos={habitos} onAñadirHabito={onAbrirModalCrearHabito} onToggleHabito={onToggleHabito} onEditarHabito={onEditarHabito} onEliminarHabito={onEliminarHabito} onPosponerHabito={onPosponerHabito} onPausarHabito={onPausarHabito} onMarcarDiaHabito={onMarcarDiaHabito} onDesmarcarDiaHabito={onDesmarcarDiaHabito} onActualizarHabito={onActualizarHabito} onToggleSubHabito={onToggleSubHabito} onConfigurarSubHabito={onConfigurarSubHabito} onPosponerSubHabitoConTiempo={onPosponerSubHabitoConTiempo} configuracion={configuracion} habilitarDrag={esOrdenManual} onReordenarHabitos={esOrdenManual ? onReordenarHabitos : undefined} />
            </OverlayEnfoque>
        </>
    );
}
