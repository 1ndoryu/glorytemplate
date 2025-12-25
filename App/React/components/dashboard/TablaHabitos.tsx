/*
 * TablaHabitos
 * Componente para mostrar la tabla de hábitos prioritarios
 * Responsabilidad única: renderizar lista de hábitos con su estado
 */

import {useState, useCallback} from 'react';
import {Clock, Check, Edit3, AlertTriangle, Flame, Calendar, Pause} from 'lucide-react';
import type {Habito} from '../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {tocaHoy, describirFrecuencia, obtenerIntervaloFrecuencia, calcularUmbralInactividad} from '../../utils/frecuenciaHabitos';
import {MenuContextual} from '../shared/MenuContextual';
import type {OpcionMenu} from '../shared/MenuContextual';
import {DashboardPanel} from '../shared/DashboardPanel';
import {BadgeInfo, BadgeGroup} from '../shared/BadgeInfo';
import {AccionesItem} from '../shared/AccionesItem';
import type {VarianteBadge} from '../shared/BadgeInfo';
import {ConfiguracionHabitos, CONFIG_HABITOS_POR_DEFECTO} from '../../hooks/useConfiguracionHabitos';

interface TablaHabitosProps {
    habitos: Habito[];
    onAñadirHabito?: () => void;
    onToggleHabito?: (id: number) => void;
    onEditarHabito?: (habito: Habito) => void;
    onEliminarHabito?: (id: number) => void;
    onPosponerHabito?: (id: number) => void;
    configuracion?: ConfiguracionHabitos;
}

function obtenerVariantePrioridad(importancia: Habito['importancia']): VarianteBadge {
    switch (importancia) {
        case 'Alta':
            return 'prioridadAlta';
        case 'Media':
            return 'prioridadMedia';
        case 'Baja':
            return 'prioridadBaja';
    }
}

/*
 * Determina si el habito fue completado hoy
 */
function fueCompletadoHoy(ultimoCompletado: string | undefined): boolean {
    if (!ultimoCompletado) return false;
    const hoy = new Date().toISOString().split('T')[0];
    return ultimoCompletado === hoy;
}

/*
 * Determina si el habito fue pospuesto hoy
 */
function fuePospuestoHoy(historialPospuestos: string[] | undefined): boolean {
    if (!historialPospuestos || historialPospuestos.length === 0) return false;
    const hoy = new Date().toISOString().split('T')[0];
    return historialPospuestos.includes(hoy);
}

interface FilaHabitoProps {
    habito: Habito;
    indice: number;
    onToggle?: (id: number) => void;
    onEditar?: (habito: Habito) => void;
    onEliminar?: (id: number) => void;
    onPosponer?: (id: number) => void;
    configuracion: ConfiguracionHabitos;
    estiloGrid: React.CSSProperties;
}

interface MenuContextualEstado {
    visible: boolean;
    x: number;
    y: number;
}

function FilaHabito({habito, indice, onToggle, onEditar, onEliminar, onPosponer, configuracion, estiloGrid}: FilaHabitoProps): JSX.Element {
    /* Advertencia de racha: mostrar cuando faltan pocos dias para perderla */
    const DIAS_ADVERTENCIA_RACHA = 2;

    const [menuContextual, setMenuContextual] = useState<MenuContextualEstado>({
        visible: false,
        x: 0,
        y: 0
    });
    const [mostrarAcciones, setMostrarAcciones] = useState(false);

    /* Frecuencia del habito */
    const frecuencia = habito.frecuencia || FRECUENCIA_POR_DEFECTO;
    const umbralInactividad = calcularUmbralInactividad(frecuencia);

    /* Calculos basados en el umbral de la frecuencia */
    const esUrgente = habito.diasInactividad > Math.floor(umbralInactividad * 0.4);
    const porcentajeUrgencia = Math.min((habito.diasInactividad / umbralInactividad) * 100, 100);
    const completadoHoy = fueCompletadoHoy(habito.ultimoCompletado);

    const habitoTocaHoy = tocaHoy(frecuencia, habito.ultimoCompletado);
    const pospuestoHoy = fuePospuestoHoy(habito.historialPospuestos);
    const textoFrecuencia = describirFrecuencia(frecuencia);
    const intervaloFrecuencia = obtenerIntervaloFrecuencia(frecuencia);

    /* Logica de advertencia de racha */
    const diasAntesDePerder = umbralInactividad - habito.diasInactividad;
    const rachaEnPeligro = habito.racha > 0 && diasAntesDePerder <= DIAS_ADVERTENCIA_RACHA && diasAntesDePerder > 0;
    const rachaPerdida = habito.diasInactividad > umbralInactividad;

    const manejarToggle = useCallback(
        (evento: React.MouseEvent) => {
            evento.stopPropagation();
            onToggle?.(habito.id);
        },
        [onToggle, habito.id]
    );

    const manejarEditar = useCallback(() => {
        onEditar?.(habito);
    }, [onEditar, habito]);

    const manejarClickDerecho = useCallback((evento: React.MouseEvent) => {
        evento.preventDefault();
        evento.stopPropagation();
        setMenuContextual({
            visible: true,
            x: evento.clientX,
            y: evento.clientY
        });
    }, []);

    const cerrarMenuContextual = useCallback(() => {
        setMenuContextual(prev => ({...prev, visible: false}));
    }, []);

    const manejarOpcionMenu = useCallback(
        (opcionId: string) => {
            switch (opcionId) {
                case 'editar':
                    onEditar?.(habito);
                    break;
                case 'toggle':
                    onToggle?.(habito.id);
                    break;
                case 'posponer':
                    onPosponer?.(habito.id);
                    break;
                case 'eliminar':
                    onEliminar?.(habito.id);
                    break;
            }
        },
        [habito, onEditar, onToggle, onPosponer, onEliminar]
    );

    /* Opciones del menu contextual */
    const opcionesMenu: OpcionMenu[] = [
        {
            id: 'toggle',
            etiqueta: completadoHoy ? 'Desmarcar' : 'Marcar completado',
            icono: <Check size={12} />
        },
        {
            id: 'posponer',
            etiqueta: 'Posponer hoy',
            icono: <Calendar size={12} />
        },
        {
            id: 'editar',
            etiqueta: 'Editar habito',
            icono: <Edit3 size={12} />,
            separadorDespues: true
        },
        {
            id: 'eliminar',
            etiqueta: 'Eliminar',
            icono: <AlertTriangle size={12} />,
            peligroso: true
        }
    ];

    /* Determinar clase de urgencia para la barra */
    const obtenerClaseUrgencia = (): string => {
        if (completadoHoy) return 'barraRellenoCompletado';
        if (porcentajeUrgencia >= 80) return 'barraRellenoUrgenteCritico';
        if (esUrgente) return 'barraRellenoUrgente';
        if (porcentajeUrgencia >= 40) return 'barraRellenoAdvertencia';
        return '';
    };

    return (
        <>
            <div className={`tablaFila tablaFilaEditable ${completadoHoy ? 'tablaFilaCompletada' : ''} ${configuracion.modoCompacto ? 'tablaFilaCompacta' : ''} ${habitoTocaHoy && !completadoHoy ? 'tablaFilaTocaHoy' : ''}`} onClick={manejarEditar} onContextMenu={manejarClickDerecho} onMouseEnter={() => setMostrarAcciones(true)} onMouseLeave={() => setMostrarAcciones(false)} style={estiloGrid}>
                {/* Checkbox para completar rápidamente - Indice */}
                {configuracion.columnasVisibles.indice && (
                    <div className="tablaColumnaCheckbox" onClick={manejarToggle}>
                        <div className={`habitoCheckbox ${completadoHoy ? 'habitoCheckboxCompletado' : ''}`}>{completadoHoy && <Check size={10} />}</div>
                    </div>
                )}

                {/* Nombre y Tags */}
                <div className="tablaColumnaNombre">
                    <div className="filaNombreContenedor">
                        <span className={`filaNombre ${completadoHoy ? 'filaNombreCompletado' : ''}`}>{habito.nombre}</span>
                        <BadgeGroup>
                            {configuracion.columnasVisibles.frecuencia && intervaloFrecuencia !== null && <BadgeInfo tipo="frecuencia" icono={<Clock size={10} />} texto={intervaloFrecuencia.toString()} titulo={`Frecuencia: ${textoFrecuencia}`} variante="frecuencia" />}
                            {configuracion.columnasVisibles.tocaHoy && pospuestoHoy && <BadgeInfo tipo="personalizado" icono={<Pause size={10} />} texto="Pospuesto" variante="pospuesto" />}
                            {configuracion.columnasVisibles.tocaHoy && habitoTocaHoy && !completadoHoy && !pospuestoHoy && <BadgeInfo tipo="destacado" texto="Hoy" variante="destacado" />}
                        </BadgeGroup>
                    </div>
                </div>

                {/* Prioridad */}
                {configuracion.columnasVisibles.importancia && (
                    <div className="tablaColumnaPrioridad">
                        <BadgeInfo tipo="prioridad" texto={habito.importancia.toUpperCase()} variante={obtenerVariantePrioridad(habito.importancia)} />
                    </div>
                )}

                {/* Inactividad - dias sin hacer */}
                {configuracion.columnasVisibles.inactividad && (
                    <div className="tablaColumnaInactividad">
                        <div className="inactividadIndicador">
                            <Clock size={10} className={esUrgente ? 'inactividadIconoUrgente' : 'inactividadIcono'} />
                            <span className={esUrgente ? 'inactividadTextoUrgente' : 'inactividadTexto'}>{habito.diasInactividad}d</span>
                        </div>
                    </div>
                )}

                {/* Urgencia - barra de progreso visual */}
                {configuracion.columnasVisibles.urgencia && (
                    <div className="tablaColumnaUrgencia">
                        <div className="urgenciaContenedor">
                            <div className="barraUrgenciaNueva">
                                <div className={`barraRellenoNueva ${obtenerClaseUrgencia()}`} style={{width: `${porcentajeUrgencia}%`}}></div>
                            </div>
                            <span className={`urgenciaPorcentaje ${esUrgente ? 'urgenciaPorcentajeAlto' : ''}`}>{Math.round(porcentajeUrgencia)}%</span>
                        </div>
                    </div>
                )}

                {/* Racha - indicador separado */}
                {configuracion.columnasVisibles.racha && (
                    <div className="tablaColumnaRacha">
                        <div className={`rachaContenedor ${rachaEnPeligro && !completadoHoy ? 'rachaContenedorPeligro' : ''} ${completadoHoy ? 'rachaContenedorCompletado' : ''}`}>
                            {rachaEnPeligro && !completadoHoy && <AlertTriangle size={10} className="rachaIconoAdvertencia" />}
                            {rachaPerdida && habito.racha === 0 ? <Flame size={10} className="rachaIconoPerdida" /> : <Flame size={10} className={`rachaIcono ${habito.racha > 0 ? 'rachaIconoActivo' : ''}`} />}
                            <span className="rachaNumero">{habito.racha}</span>
                            {rachaEnPeligro && !completadoHoy && <span className="rachaTiempoRestante">({diasAntesDePerder}d)</span>}
                        </div>
                    </div>
                )}

                {/* Acciones inline (hover) */}
                {configuracion.columnasVisibles.acciones && <div className="tablaColumnaAcciones">{mostrarAcciones && <AccionesItem mostrarConfigurar={true} mostrarEliminar={true} onConfigurar={manejarEditar} onEliminar={() => onEliminar?.(habito.id)} />}</div>}
            </div>

            {/* Menu contextual */}
            {menuContextual.visible && <MenuContextual opciones={opcionesMenu} posicionX={menuContextual.x} posicionY={menuContextual.y} onSeleccionar={manejarOpcionMenu} onCerrar={cerrarMenuContextual} />}
        </>
    );
}

export function TablaHabitos({habitos, onAñadirHabito, onToggleHabito, onEditarHabito, onEliminarHabito, onPosponerHabito, configuracion = CONFIG_HABITOS_POR_DEFECTO}: TablaHabitosProps): JSX.Element {
    // Filtrar habitos segun configuracion
    const habitosVisibles = habitos.filter(habito => {
        if (configuracion.ocultarCompletadosHoy && fueCompletadoHoy(habito.ultimoCompletado)) {
            return false;
        }
        return true;
    });

    const obtenerGridTemplate = () => {
        const widths = [];
        if (configuracion.columnasVisibles.indice) widths.push('2rem');
        // Nombre siempre visible
        widths.push('3fr');
        if (configuracion.columnasVisibles.importancia) widths.push('1fr');
        if (configuracion.columnasVisibles.inactividad) widths.push('1fr');
        if (configuracion.columnasVisibles.urgencia) widths.push('2fr');
        if (configuracion.columnasVisibles.racha) widths.push('1.5fr');
        if (configuracion.columnasVisibles.acciones) widths.push('auto');
        return widths.join(' ');
    };

    const estiloGrid = {gridTemplateColumns: obtenerGridTemplate()};

    return (
        <DashboardPanel id="tabla-habitos">
            {/* Encabezado de tabla */}
            <div className="tablaEncabezado" style={estiloGrid}>
                {configuracion.columnasVisibles.indice && <div className="tablaColumnaCheckbox"></div>}
                <div className="tablaColumnaNombre">HABITO</div>
                {configuracion.columnasVisibles.importancia && <div className="tablaColumnaPrioridad">PRIO</div>}
                {configuracion.columnasVisibles.inactividad && <div className="tablaColumnaInactividad">DIAS</div>}
                {configuracion.columnasVisibles.urgencia && <div className="tablaColumnaUrgencia">URGENCIA</div>}
                {configuracion.columnasVisibles.racha && <div className="tablaColumnaRacha">RACHA</div>}
                {configuracion.columnasVisibles.acciones && <div className="tablaColumnaAcciones"></div>}
            </div>

            {/* Filas de habitos */}
            {habitosVisibles.map((habito, index) => (
                <FilaHabito key={habito.id} habito={habito} indice={index} onToggle={onToggleHabito} onEditar={onEditarHabito} onEliminar={onEliminarHabito} onPosponer={onPosponerHabito} configuracion={configuracion} estiloGrid={estiloGrid} />
            ))}

            {/* Añadir habito */}
            <div className="añadirHabito" onClick={onAñadirHabito}>
                + Añadir nuevo habito de seguimiento
            </div>
        </DashboardPanel>
    );
}
