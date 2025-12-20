/*
 * TablaHabitos
 * Componente para mostrar la tabla de hábitos prioritarios
 * Responsabilidad única: renderizar lista de hábitos con su estado
 */

import {Clock, Check, Edit3, AlertTriangle, Flame} from 'lucide-react';
import type {Habito} from '../../types/dashboard';

interface TablaHabitosProps {
    habitos: Habito[];
    onAñadirHabito?: () => void;
    onToggleHabito?: (id: number) => void;
    onEditarHabito?: (habito: Habito) => void;
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
}

function FilaHabito({habito, indice, onToggle, onEditar}: FilaHabitoProps): JSX.Element {
    /* Configuracion de umbrales (debe coincidir con useDashboard) */
    const UMBRAL_RESETEO_RACHA = 7;
    const DIAS_ADVERTENCIA_RACHA = 2;

    const esUrgente = habito.diasInactividad > 2;
    const porcentajeUrgencia = Math.min((habito.diasInactividad / 7) * 100, 100);
    const completadoHoy = fueCompletadoHoy(habito.ultimoCompletado);

    /* Logica de advertencia de racha */
    const diasAntesDePerder = UMBRAL_RESETEO_RACHA - habito.diasInactividad;
    const rachaEnPeligro = habito.racha > 0 && diasAntesDePerder <= DIAS_ADVERTENCIA_RACHA && diasAntesDePerder > 0;
    const rachaPerdida = habito.diasInactividad > UMBRAL_RESETEO_RACHA;

    const manejarToggle = (evento: React.MouseEvent) => {
        evento.stopPropagation();
        if (onToggle) {
            onToggle(habito.id);
        }
    };

    const manejarEditar = () => {
        if (onEditar) {
            onEditar(habito);
        }
    };

    /* Determinar clase de urgencia para la barra */
    const obtenerClaseUrgencia = (): string => {
        if (completadoHoy) return 'barraRellenoCompletado';
        if (porcentajeUrgencia >= 80) return 'barraRellenoUrgenteCritico';
        if (esUrgente) return 'barraRellenoUrgente';
        if (porcentajeUrgencia >= 40) return 'barraRellenoAdvertencia';
        return '';
    };

    return (
        <div className={`tablaFila tablaFilaEditable ${completadoHoy ? 'tablaFilaCompletada' : ''}`} onClick={manejarEditar} title="Click para editar">
            {/* ID */}
            <div className="tablaColumnaId filaIndice">{String(indice + 1).padStart(2, '0')}</div>

            {/* Nombre y Tags */}
            <div className="tablaColumnaNombre">
                <div className={`filaNombre ${completadoHoy ? 'filaNombreCompletado' : ''}`}>{habito.nombre}</div>
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

            {/* Accion - solo boton toggle */}
            <div className="tablaColumnaAccion">
                <div className="accionContenedor">
                    <button className={`botonCompletarHabito ${completadoHoy ? 'botonCompletarHabitoActivo' : ''}`} onClick={manejarToggle} title={completadoHoy ? 'Desmarcar' : 'Marcar como completado'}>
                        <Check size={12} />
                        <span>{completadoHoy ? 'Hecho' : 'Hoy'}</span>
                    </button>
                    <button
                        className="botonEditarHabito"
                        onClick={evento => {
                            evento.stopPropagation();
                            manejarEditar();
                        }}
                        title="Editar habito">
                        <Edit3 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function TablaHabitos({habitos, onAñadirHabito, onToggleHabito, onEditarHabito}: TablaHabitosProps): JSX.Element {
    return (
        <div id="tabla-habitos" className="dashboardPanel">
            {/* Encabezado de tabla */}
            <div className="tablaEncabezado">
                <div className="tablaColumnaId">ID</div>
                <div className="tablaColumnaNombre">HABITO</div>
                <div className="tablaColumnaPrioridad">PRIO</div>
                <div className="tablaColumnaInactividad">DIAS</div>
                <div className="tablaColumnaUrgencia">URGENCIA</div>
                <div className="tablaColumnaRacha">RACHA</div>
                <div className="tablaColumnaAccion">ACCION</div>
            </div>

            {/* Filas de habitos */}
            {habitos.map((habito, index) => (
                <FilaHabito key={habito.id} habito={habito} indice={index} onToggle={onToggleHabito} onEditar={onEditarHabito} />
            ))}

            {/* Añadir habito */}
            <div className="añadirHabito" onClick={onAñadirHabito}>
                + Añadir nuevo habito de seguimiento
            </div>
        </div>
    );
}
