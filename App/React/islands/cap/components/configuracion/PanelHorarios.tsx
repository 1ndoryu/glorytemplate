/**
 * PanelHorarios
 *
 * Configuración de horarios flexibles por día.
 * Permite definir múltiples rangos horarios para cada día de la semana.
 */

import {useState, useEffect} from 'react';
import {Input, Boton, Tarjeta, TarjetaHeader, TarjetaBody, Alerta} from '../ui';
import {IconoReloj, IconoGuardar, IconoMas, IconoEliminar} from '../icons';
import type {ConfiguracionHorarios} from '../../hooks/useConfiguracion';

interface PanelHorariosProps {
    config: ConfiguracionHorarios | null;
    guardando: boolean;
    onGuardar: (datos: Partial<ConfiguracionHorarios>) => Promise<boolean>;
}

interface RangoHorario {
    inicio: string;
    fin: string;
}

interface HorariosSemanales {
    [key: string]: RangoHorario[];
}

/* Ajuste: ocultar fin de semana en horarios flexibles. */
const DIAS_SEMANA = [
    {id: 'lunes', label: 'Lunes'},
    {id: 'martes', label: 'Martes'},
    {id: 'miercoles', label: 'Miércoles'},
    {id: 'jueves', label: 'Jueves'},
    {id: 'viernes', label: 'Viernes'}
];

const normalizarHora = (hora?: string): string => {
    if (!hora) return '';
    const partes = hora.split(':');
    if (partes.length < 2) return hora;
    const horas = partes[0].padStart(2, '0');
    const minutos = partes[1].padStart(2, '0');
    return `${horas}:${minutos}`;
};

const horaAMinutos = (hora?: string): number => {
    if (!hora) return 0;
    const limpia = normalizarHora(hora);
    const [h, m] = limpia.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

const construirHorariosPorDefecto = (configuracion: ConfiguracionHorarios | null): HorariosSemanales => {
    const base: HorariosSemanales = {};
    const manana = {
        inicio: normalizarHora(configuracion?.hora_inicio_manana || '09:00'),
        fin: normalizarHora(configuracion?.hora_fin_manana || '14:00')
    };
    const tarde = {
        inicio: normalizarHora(configuracion?.hora_inicio_tarde || '16:00'),
        fin: normalizarHora(configuracion?.hora_fin_tarde || '21:00')
    };

    DIAS_SEMANA.forEach(dia => {
        base[dia.id] = [];
        if (dia.id === 'sabado' || dia.id === 'domingo') return;

        base[dia.id].push({...manana});

        if (dia.id === 'viernes' && configuracion?.viernes_especial && configuracion?.hora_fin_viernes) {
            const inicioViernes = normalizarHora(configuracion.hora_inicio_tarde || '16:00');
            const finViernes = normalizarHora(configuracion.hora_fin_viernes);
            if (horaAMinutos(finViernes) > horaAMinutos(inicioViernes)) {
                base[dia.id].push({inicio: inicioViernes, fin: finViernes});
            }
            return;
        }

        base[dia.id].push({...tarde});
    });

    return base;
};

export function PanelHorarios({config, guardando, onGuardar}: PanelHorariosProps) {
    const [horarios, setHorarios] = useState<HorariosSemanales>({});
    const [modificado, setModificado] = useState(false);

    useEffect(() => {
        if (config) {
            /* Prioridad: Horarios semanales JSON */
            if (config.horarios_semanales) {
                try {
                    const parsed = typeof config.horarios_semanales === 'string' ? JSON.parse(config.horarios_semanales) : config.horarios_semanales;

                    /* Asegurar estructura de array por día */
                    const horariosLimpio: HorariosSemanales = {};
                    DIAS_SEMANA.forEach(dia => {
                        const rangos = Array.isArray(parsed[dia.id]) ? parsed[dia.id] : [];
                        horariosLimpio[dia.id] = rangos.map((rango: { inicio: string | undefined; fin: string | undefined; }) => ({
                            inicio: normalizarHora(rango.inicio),
                            fin: normalizarHora(rango.fin)
                        }));
                    });
                    setHorarios(horariosLimpio);
                    setModificado(false);
                    return;
                } catch (e) {
                    console.error('Error al parsear horarios semanales', e);
                    return;
                }
            }

            /* Fallback: Construir configuración por defecto */
            const fallback = construirHorariosPorDefecto(config);
            setHorarios(fallback);
            setModificado(false);
        }
    }, [config]);

    const handleRangoChange = (diaId: string, index: number, campo: keyof RangoHorario, valor: string) => {
        const nuevosHorarios = {...horarios};
        nuevosHorarios[diaId][index][campo] = valor;
        setHorarios(nuevosHorarios);
        setModificado(true);
    };

    const agregarRango = (diaId: string) => {
        const nuevosHorarios = {...horarios};
        if (!nuevosHorarios[diaId]) nuevosHorarios[diaId] = [];

        // Sugerir horario basado en el anterior o default
        const ultimo = nuevosHorarios[diaId][nuevosHorarios[diaId].length - 1];
        const inicioSugerido = ultimo ? ultimo.fin : '09:00';

        nuevosHorarios[diaId].push({inicio: inicioSugerido, fin: '14:00'});
        setHorarios(nuevosHorarios);
        setModificado(true);
    };

    const eliminarRango = (diaId: string, index: number) => {
        const nuevosHorarios = {...horarios};
        nuevosHorarios[diaId].splice(index, 1);
        setHorarios(nuevosHorarios);
        setModificado(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Enviar como JSON stringificado
        const exito = await onGuardar({
            horarios_semanales: JSON.stringify(horarios)
        });

        if (exito) setModificado(false);
    };

    const handleRestablecer = () => {
        const confirmacion = window.confirm(
            '¿Estás seguro de que deseas restablecer los horarios a la configuración por defecto? Los cambios sin guardar se perderán.'
        );

        if (confirmacion) {
            /* Ajuste: restablecer vuelve al horario por defecto, no al último guardado. */
            setHorarios(construirHorariosPorDefecto(config));
            setModificado(true);
        }
    };

    return (
        <Tarjeta className="capPanelConfig">
            <TarjetaHeader>
                <div className="capFlexStart capGap--sm">
                    <span className="capPanelConfig__icono">
                        <IconoReloj />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Horarios de Clase (Flexible)</h3>
                </div>
            </TarjetaHeader>
            <TarjetaBody>
                <form onSubmit={handleSubmit} className="capFormConfig">
                    <Alerta variante="info" className="capMb--md">
                        Define los rangos horarios exactos para cada día. Puedes añadir múltiples tramos o dejar días libres.
                    </Alerta>

                    <div className="capGrid capGap--lg">
                        {DIAS_SEMANA.map(dia => (
                            <div key={dia.id} className="capHorarioDia">
                                <div className="capFlexBetween capMb--sm">
                                    <h4 className="capTexto capTexto--negrita">{dia.label}</h4>
                                    <Boton type="button" onClick={() => agregarRango(dia.id)} variante="secundario" tamano="sm" className="capBotonIcono" title="Añadir tramo horario">
                                        <IconoMas size={16} /> Añadir
                                    </Boton>
                                </div>

                                {horarios[dia.id] && horarios[dia.id].length > 0 ? (
                                    <div className="capGrid capGrid--2cols capGap--sm">
                                        {horarios[dia.id].map((rango, index) => (
                                            <div key={index} className="capHorarioFila">
                                                <div className="capHorarioCampo">
                                                    <Input tipo="text" value={rango.inicio} onChange={e => handleRangoChange(dia.id, index, 'inicio', e.target.value)} placeholder="09:00" etiqueta={index === 0 ? 'Inicio' : undefined} />
                                                </div>
                                                <div className="capHorarioCampo">
                                                    <Input tipo="text" value={rango.fin} onChange={e => handleRangoChange(dia.id, index, 'fin', e.target.value)} placeholder="14:00" etiqueta={index === 0 ? 'Fin' : undefined} />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarRango(dia.id, index)}
                                                    className="capBotonEliminarRango"
                                                    title="Eliminar tramo">
                                                    <IconoEliminar size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="capTexto capTexto--xs capTexto--gris">Sin clases programadas</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="capFormConfig__acciones capFormConfig__acciones--horarios capMt--lg">
                        <Boton type="button" variante="secundario" tamano="md" onClick={handleRestablecer} disabled={guardando} title="Restablecer a valores por defecto">
                            Restablecer
                        </Boton>
                        <Boton type="submit" variante="primario" tamano="md" disabled={!modificado || guardando} cargando={guardando}>
                            <IconoGuardar />
                            Guardar Horarios
                        </Boton>
                    </div>
                </form>
            </TarjetaBody>
        </Tarjeta>
    );
}

export default PanelHorarios;
