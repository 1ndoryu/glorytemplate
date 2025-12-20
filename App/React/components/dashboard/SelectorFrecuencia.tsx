/*
 * SelectorFrecuencia
 * Componente para seleccionar la frecuencia de un habito
 * Responsabilidad unica: capturar y mostrar configuracion de frecuencia
 */

import {useState, useCallback} from 'react';
import type {FrecuenciaHabito, TipoFrecuencia, DiaSemana} from '../../types/dashboard';
import {SelectorDias} from '../shared';

interface SelectorFrecuenciaProps {
    frecuencia: FrecuenciaHabito;
    onChange: (frecuencia: FrecuenciaHabito) => void;
    deshabilitado?: boolean;
}

const TIPOS_FRECUENCIA: {tipo: TipoFrecuencia; etiqueta: string; descripcion: string}[] = [
    {tipo: 'diario', etiqueta: 'Diario', descripcion: 'Cada dia'},
    {tipo: 'cadaXDias', etiqueta: 'Cada X dias', descripcion: 'Intervalo personalizado'},
    {tipo: 'semanal', etiqueta: 'Semanal', descripcion: 'Una vez por semana'},
    {tipo: 'diasEspecificos', etiqueta: 'Dias especificos', descripcion: 'Dias de la semana'},
    {tipo: 'mensual', etiqueta: 'Mensual', descripcion: 'X veces al mes'}
];

const DIAS_SEMANA: {dia: DiaSemana; etiqueta: string; corto: string}[] = [
    {dia: 'lunes', etiqueta: 'Lunes', corto: 'L'},
    {dia: 'martes', etiqueta: 'Martes', corto: 'M'},
    {dia: 'miercoles', etiqueta: 'Miercoles', corto: 'X'},
    {dia: 'jueves', etiqueta: 'Jueves', corto: 'J'},
    {dia: 'viernes', etiqueta: 'Viernes', corto: 'V'},
    {dia: 'sabado', etiqueta: 'Sabado', corto: 'S'},
    {dia: 'domingo', etiqueta: 'Domingo', corto: 'D'}
];

export function SelectorFrecuencia({frecuencia, onChange, deshabilitado = false}: SelectorFrecuenciaProps): JSX.Element {
    const [expandido, setExpandido] = useState(frecuencia.tipo !== 'diario');

    const manejarCambioTipo = useCallback(
        (nuevoTipo: TipoFrecuencia) => {
            const nuevaFrecuencia: FrecuenciaHabito = {tipo: nuevoTipo};

            /* Valores por defecto segun el tipo */
            if (nuevoTipo === 'cadaXDias') {
                nuevaFrecuencia.cadaDias = 2;
            } else if (nuevoTipo === 'diasEspecificos') {
                nuevaFrecuencia.diasSemana = ['lunes', 'miercoles', 'viernes'];
            } else if (nuevoTipo === 'mensual') {
                nuevaFrecuencia.vecesAlMes = 4;
            }

            onChange(nuevaFrecuencia);
            setExpandido(nuevoTipo !== 'diario');
        },
        [onChange]
    );

    const manejarCambioDias = useCallback(
        (nuevoDias: number) => {
            onChange({...frecuencia, cadaDias: Math.max(2, Math.min(30, nuevoDias))});
        },
        [frecuencia, onChange]
    );

    /* manejarToggleDiaSemana eliminado - gestionado por SelectorDias */

    const manejarCambioVecesMes = useCallback(
        (nuevasVeces: number) => {
            onChange({...frecuencia, vecesAlMes: Math.max(1, Math.min(30, nuevasVeces))});
        },
        [frecuencia, onChange]
    );

    /* Texto descriptivo de la frecuencia actual */
    const obtenerDescripcion = (): string => {
        switch (frecuencia.tipo) {
            case 'diario':
                return 'Todos los dias';
            case 'cadaXDias':
                return `Cada ${frecuencia.cadaDias || 2} dias`;
            case 'semanal':
                return 'Una vez por semana';
            case 'diasEspecificos': {
                const dias = frecuencia.diasSemana || [];
                if (dias.length === 0) return 'Sin dias seleccionados';
                if (dias.length === 7) return 'Todos los dias';
                return dias.map(d => DIAS_SEMANA.find(ds => ds.dia === d)?.corto || d).join(', ');
            }
            case 'mensual':
                return `${frecuencia.vecesAlMes || 4} veces al mes`;
            default:
                return '';
        }
    };

    return (
        <div className="selectorFrecuencia">
            {/* Cabecera colapsable */}
            <button type="button" className="selectorFrecuenciaCabecera" onClick={() => setExpandido(!expandido)} disabled={deshabilitado}>
                <span className="selectorFrecuenciaEtiqueta">Frecuencia</span>
                <span className="selectorFrecuenciaValor">{obtenerDescripcion()}</span>
                <span className="selectorFrecuenciaFlecha">{expandido ? '▲' : '▼'}</span>
            </button>

            {/* Panel expandido */}
            {expandido && (
                <div className="selectorFrecuenciaPanel">
                    {/* Selector de tipo */}
                    <div className="selectorFrecuenciaTipos">
                        {TIPOS_FRECUENCIA.map(({tipo, etiqueta}) => (
                            <button key={tipo} type="button" className={`selectorFrecuenciaTipo ${frecuencia.tipo === tipo ? 'selectorFrecuenciaTipoActivo' : ''}`} onClick={() => manejarCambioTipo(tipo)} disabled={deshabilitado}>
                                {etiqueta}
                            </button>
                        ))}
                    </div>

                    {/* Configuracion especifica del tipo */}
                    {frecuencia.tipo === 'cadaXDias' && (
                        <div className="selectorFrecuenciaConfig">
                            <label className="selectorFrecuenciaConfigLabel">Repetir cada</label>
                            <div className="selectorFrecuenciaNumero">
                                <button type="button" className="selectorFrecuenciaBotonNumero" onClick={() => manejarCambioDias((frecuencia.cadaDias || 2) - 1)} disabled={deshabilitado || (frecuencia.cadaDias || 2) <= 2}>
                                    −
                                </button>
                                <span className="selectorFrecuenciaNumeroValor">{frecuencia.cadaDias || 2}</span>
                                <button type="button" className="selectorFrecuenciaBotonNumero" onClick={() => manejarCambioDias((frecuencia.cadaDias || 2) + 1)} disabled={deshabilitado || (frecuencia.cadaDias || 2) >= 30}>
                                    +
                                </button>
                                <span className="selectorFrecuenciaNumeroUnidad">dias</span>
                            </div>
                        </div>
                    )}

                    {frecuencia.tipo === 'diasEspecificos' && (
                        <div className="selectorFrecuenciaConfig">
                            <label className="selectorFrecuenciaConfigLabel">Dias de la semana</label>
                            <SelectorDias seleccionados={frecuencia.diasSemana || []} onChange={dias => onChange({...frecuencia, diasSemana: dias})} deshabilitado={deshabilitado} />
                        </div>
                    )}

                    {frecuencia.tipo === 'mensual' && (
                        <div className="selectorFrecuenciaConfig">
                            <label className="selectorFrecuenciaConfigLabel">Veces por mes</label>
                            <div className="selectorFrecuenciaNumero">
                                <button type="button" className="selectorFrecuenciaBotonNumero" onClick={() => manejarCambioVecesMes((frecuencia.vecesAlMes || 4) - 1)} disabled={deshabilitado || (frecuencia.vecesAlMes || 4) <= 1}>
                                    −
                                </button>
                                <span className="selectorFrecuenciaNumeroValor">{frecuencia.vecesAlMes || 4}</span>
                                <button type="button" className="selectorFrecuenciaBotonNumero" onClick={() => manejarCambioVecesMes((frecuencia.vecesAlMes || 4) + 1)} disabled={deshabilitado || (frecuencia.vecesAlMes || 4) >= 30}>
                                    +
                                </button>
                                <span className="selectorFrecuenciaNumeroUnidad">veces</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export type {SelectorFrecuenciaProps};
