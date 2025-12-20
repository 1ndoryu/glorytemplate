/*
 * TablaHabitos
 * Componente para mostrar la tabla de hábitos prioritarios
 * Responsabilidad única: renderizar lista de hábitos con su estado
 */

import {useState, useCallback} from 'react';
import {Clock, Check, Edit3, AlertTriangle, Flame} from 'lucide-react';
import type {Habito} from '../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {tocaHoy, describirFrecuencia, obtenerIntervaloFrecuencia, calcularUmbralInactividad} from '../../utils/frecuenciaHabitos';
import {MenuContextual} from '../shared/MenuContextual';
import type {OpcionMenu} from '../shared/MenuContextual';

interface TablaHabitosProps {
    habitos: Habito[];
    onAñadirHabito?: () => void;
    onToggleHabito?: (id: number) => void;
    onEditarHabito?: (habito: Habito) => void;
    onEliminarHabito?: (id: number) => void;
}

function obtenerClasesPrioridad(importancia: Habito['importancia']): string {
    const clases = 'etiquetaPrioridad ';
    switch (importancia) {
        case 'Alta':
            return clases + 'etiquetaAlta';
        case 'Media':
            return clases + 'etiquetaMedia';
        case 'Baja':
            return clases + 'etiquetaBaja';
    }
}

/*
 * Determina si el hábito fue completado hoy
 */
function fueCompletadoHoy(ultimoCompletado: string | undefined): boolean {
    if (!ultimoCompletado) return false;
    const hoy = new Date().toISOString().split('T')[0];
    return ultimoCompletado === hoy;
}

interface FilaHabitoProps {
    habito: Habito;
    indice: number;
    onToggle?: (id: number) => void;
    onEditar?: (habito: Habito) => void;
    onEliminar?: (id: number) => void;
}

interface MenuContextualEstado {
    visible: boolean;
    x: number;
    y: number;
}

function FilaHabito({habito, indice, onToggle, onEditar, onEliminar}: FilaHabitoProps): JSX.Element {
    /* Advertencia de racha: mostrar cuando faltan pocos dias para perderla */
    const DIAS_ADVERTENCIA_RACHA = 2;

    const [menuContextual, setMenuContextual] = useState<MenuContextualEstado>({
        visible: false,
        x: 0,
        y: 0
    });

    /* Frecuencia del habito */
    const frecuencia = habito.frecuencia || FRECUENCIA_POR_DEFECTO;
    const umbralInactividad = calcularUmbralInactividad(frecuencia);

    /* Calculos basados en el umbral de la frecuencia */
    const esUrgente = habito.diasInactividad > Math.floor(umbralInactividad * 0.4);
    const porcentajeUrgencia = Math.min((habito.diasInactividad / umbralInactividad) * 100, 100);
    const completadoHoy = fueCompletadoHoy(habito.ultimoCompletado);

    const habitoTocaHoy = tocaHoy(frecuencia, habito.ultimoCompletado);
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
                case 'eliminar':
                    onEliminar?.(habito.id);
                    break;
            }
        },
        [habito, onEditar, onToggle, onEliminar]
    );

    /* Opciones del menu contextual */
    const opcionesMenu: OpcionMenu[] = [
        {
            id: 'toggle',
            etiqueta: completadoHoy ? 'Desmarcar' : 'Marcar completado',
            icono: <Check size={12} />
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
            <div className={`tablaFila tablaFilaEditable ${completadoHoy ? 'tablaFilaCompletada' : ''} ${habitoTocaHoy && !completadoHoy ? 'tablaFilaTocaHoy' : ''}`} onClick={manejarEditar} onContextMenu={manejarClickDerecho} title="Click para editar, click derecho para menu">
                {/* Checkbox para completar rápidamente */}
                <div className="tablaColumnaCheckbox" onClick={manejarToggle}>
                    <div className={`habitoCheckbox ${completadoHoy ? 'habitoCheckboxCompletado' : ''}`}>{completadoHoy && <Check size={10} />}</div>
                </div>

                {/* Nombre y Tags */}
                <div className="tablaColumnaNombre">
                    <div className="filaNombreContenedor">
                        <span className={`filaNombre ${completadoHoy ? 'filaNombreCompletado' : ''}`}>
                            {habito.nombre}
                            {intervaloFrecuencia !== null && (
                                <span className="filaNombreIndicadorFrecuencia" title={`Frecuencia: ${textoFrecuencia}`}>
                                    (<Clock size={10} />
                                    <span>{intervaloFrecuencia}</span>)
                                </span>
                            )}
                        </span>
                        {habitoTocaHoy && !completadoHoy && <span className="filaTocaHoyBadge">Hoy</span>}
                    </div>
                    <div className="filaTags">
                        {habito.tags.map(tag => (
                            <span key={tag} className="filaTag">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Prioridad */}
                <div className="tablaColumnaPrioridad">
                    <span className={obtenerClasesPrioridad(habito.importancia)}>{habito.importancia.toUpperCase()}</span>
                </div>

                {/* Inactividad - dias sin hacer */}
                <div className="tablaColumnaInactividad">
                    <div className="inactividadIndicador">
                        <Clock size={10} className={esUrgente ? 'inactividadIconoUrgente' : 'inactividadIcono'} />
                        <span className={esUrgente ? 'inactividadTextoUrgente' : 'inactividadTexto'}>{habito.diasInactividad}d</span>
                    </div>
                </div>

                {/* Urgencia - barra de progreso visual */}
                <div className="tablaColumnaUrgencia">
                    <div className="urgenciaContenedor">
                        <div className="barraUrgenciaNueva">
                            <div className={`barraRellenoNueva ${obtenerClaseUrgencia()}`} style={{width: `${porcentajeUrgencia}%`}}></div>
                        </div>
                        <span className={`urgenciaPorcentaje ${esUrgente ? 'urgenciaPorcentajeAlto' : ''}`}>{Math.round(porcentajeUrgencia)}%</span>
                    </div>
                </div>

                {/* Racha - indicador separado */}
                <div className="tablaColumnaRacha">
                    <div className={`rachaContenedor ${rachaEnPeligro && !completadoHoy ? 'rachaContenedorPeligro' : ''} ${completadoHoy ? 'rachaContenedorCompletado' : ''}`}>
                        {rachaEnPeligro && !completadoHoy && <AlertTriangle size={10} className="rachaIconoAdvertencia" />}
                        {rachaPerdida && habito.racha === 0 && <Flame size={10} className="rachaIconoPerdida" />}
                        <Flame size={10} className={`rachaIcono ${habito.racha > 0 ? 'rachaIconoActivo' : ''}`} />
                        <span className="rachaNumero">{habito.racha}</span>
                        {rachaEnPeligro && !completadoHoy && <span className="rachaTiempoRestante">({diasAntesDePerder}d)</span>}
                    </div>
                </div>
            </div>

            {/* Menu contextual */}
            {menuContextual.visible && <MenuContextual opciones={opcionesMenu} posicionX={menuContextual.x} posicionY={menuContextual.y} onSeleccionar={manejarOpcionMenu} onCerrar={cerrarMenuContextual} />}
        </>
    );
}

export function TablaHabitos({habitos, onAñadirHabito, onToggleHabito, onEditarHabito, onEliminarHabito}: TablaHabitosProps): JSX.Element {
    return (
        <div id="tabla-habitos" className="dashboardPanel">
            {/* Encabezado de tabla */}
            <div className="tablaEncabezado">
                <div className="tablaColumnaCheckbox"></div>
                <div className="tablaColumnaNombre">HABITO</div>
                <div className="tablaColumnaPrioridad">PRIO</div>
                <div className="tablaColumnaInactividad">DIAS</div>
                <div className="tablaColumnaUrgencia">URGENCIA</div>
                <div className="tablaColumnaRacha">RACHA</div>
            </div>

            {/* Filas de habitos */}
            {habitos.map((habito, index) => (
                <FilaHabito key={habito.id} habito={habito} indice={index} onToggle={onToggleHabito} onEditar={onEditarHabito} onEliminar={onEliminarHabito} />
            ))}

            {/* Añadir habito */}
            <div className="añadirHabito" onClick={onAñadirHabito}>
                + Añadir nuevo habito de seguimiento
            </div>
        </div>
    );
}
