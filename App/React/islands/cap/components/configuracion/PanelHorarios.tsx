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

const DIAS_SEMANA = [
    {id: 'lunes', label: 'Lunes'},
    {id: 'martes', label: 'Martes'},
    {id: 'miercoles', label: 'Miércoles'},
    {id: 'jueves', label: 'Jueves'},
    {id: 'viernes', label: 'Viernes'},
    {id: 'sabado', label: 'Sábado'},
    {id: 'domingo', label: 'Domingo'}
];

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
                        horariosLimpio[dia.id] = Array.isArray(parsed[dia.id]) ? parsed[dia.id] : [];
                    });
                    setHorarios(horariosLimpio);
                    return;
                } catch (e) {
                    console.error('Error al parsear horarios semanales', e);
                }
            }

            /* Fallback: Migrar configuración legacy a flexible */
            const fallback: HorariosSemanales = {};
            const manana = {inicio: config.hora_inicio_manana || '09:00', fin: config.hora_fin_manana || '14:00'};
            const tarde = {inicio: config.hora_inicio_tarde || '16:00', fin: config.hora_fin_tarde || '21:00'};
            const tardeViernes = {inicio: config.hora_inicio_tarde || '16:00', fin: config.hora_fin_viernes || '15:00'};

            DIAS_SEMANA.forEach(dia => {
                fallback[dia.id] = [];
                if (dia.id === 'sabado' || dia.id === 'domingo') return;

                /* Añadir turnos por defecto */
                fallback[dia.id].push({...manana});

                if (dia.id === 'viernes' && config.viernes_especial) {
                    /* Viernes especial a veces no tiene tarde o termina antes */
                    // Si el horario especial implica solo mañana extendida o diferente:
                    // La lógica antigua era confusa, aqui simplificamos a lo que haya en variables
                    if (config.hora_fin_viernes) {
                        // Asumimos que viernes especial reemplaza la tarde normal
                        fallback[dia.id].push({inicio: config.hora_inicio_tarde || '16:00', fin: config.hora_fin_viernes});
                    }
                } else {
                    fallback[dia.id].push({...tarde});
                }
            });
            setHorarios(fallback);
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
                            <div key={dia.id} className="capHorarioDia" style={{borderBottom: '1px solid var(--cap-borde)', paddingBottom: '1rem'}}>
                                <div className="capFlexBetween capMb--sm">
                                    <h4 className="capTexto capTexto--negrita">{dia.label}</h4>
                                    <Boton type="button" onClick={() => agregarRango(dia.id)} variante="secundario" tamano="sm" className="capBtnIcono" title="Añadir tramo horario">
                                        <IconoMas size={16} /> Añadir
                                    </Boton>
                                </div>

                                {horarios[dia.id] && horarios[dia.id].length > 0 ? (
                                    <div className="capGrid capGrid--2cols capGap--sm">
                                        {horarios[dia.id].map((rango, index) => (
                                            <div key={index} className="capFlexCenter capGap--xs" style={{alignItems: 'flex-end'}}>
                                                <div style={{flex: 1}}>
                                                    <Input tipo="text" value={rango.inicio} onChange={e => handleRangoChange(dia.id, index, 'inicio', e.target.value)} placeholder="09:00" etiqueta={index === 0 ? 'Inicio' : undefined} />
                                                </div>
                                                <div style={{flex: 1}}>
                                                    <Input tipo="text" value={rango.fin} onChange={e => handleRangoChange(dia.id, index, 'fin', e.target.value)} placeholder="14:00" etiqueta={index === 0 ? 'Fin' : undefined} />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarRango(dia.id, index)}
                                                    className="capBtnEliminarRango"
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--cap-rojo)',
                                                        cursor: 'pointer',
                                                        padding: '0.5rem',
                                                        marginBottom: '0.2rem'
                                                    }}
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

                    <div className="capFormConfig__acciones capMt--lg">
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
