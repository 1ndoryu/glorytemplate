/**
 * PanelCapacidad
 *
 * Configuración de capacidad máxima por clase y duración.
 * Incluye texto informativo sobre alertas de exceso.
 */

import {useState, useEffect} from 'react';
import {Input, Boton, Tarjeta, TarjetaHeader, TarjetaBody, Alerta} from '../ui';
import {IconoUsuarios, IconoGuardar} from '../icons';
import type {ConfiguracionHorarios} from '../../hooks/useConfiguracion';

interface PanelCapacidadProps {
    config: ConfiguracionHorarios | null;
    guardando: boolean;
    onGuardar: (datos: Partial<ConfiguracionHorarios>) => Promise<boolean>;
}

export function PanelCapacidad({config, guardando, onGuardar}: PanelCapacidadProps) {
    const [formData, setFormData] = useState({
        alumnos_max_clase: 20,
        duracion_clase: 60,
        duracion_descanso: 15
    });

    const [modificado, setModificado] = useState(false);

    useEffect(() => {
        if (config) {
            setFormData({
                alumnos_max_clase: config.alumnos_max_clase || 20,
                duracion_clase: config.duracion_clase || 60,
                duracion_descanso: config.duracion_descanso || 15
            });
        }
    }, [config]);

    const handleChange = (campo: keyof typeof formData, valor: number) => {
        setFormData(prev => ({...prev, [campo]: valor}));
        setModificado(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const exito = await onGuardar(formData);
        if (exito) setModificado(false);
    };

    return (
        <Tarjeta className="capPanelConfig">
            <TarjetaHeader>
                <div className="capFlexStart capGap--sm">
                    <span className="capPanelConfig__icono">
                        <IconoUsuarios />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Capacidad y Duración</h3>
                </div>
            </TarjetaHeader>
            <TarjetaBody>
                <form onSubmit={handleSubmit} className="capFormConfig">
                    <Alerta variante="info" className="capMb--md">
                        Cuando la demanda supere la capacidad máxima, el sistema te mostrará una alerta para que puedas elegir qué alumnos asignar a cada clase.
                    </Alerta>

                    <Input etiqueta="Alumnos máximos por clase" tipo="number" value={formData.alumnos_max_clase.toString()} onChange={e => handleChange('alumnos_max_clase', parseInt(e.target.value) || 1)} min={1} max={100} ayuda="Límite de aforo para cada clase programada" />

                    <div className="capGrid capGrid--2cols capGap--md">
                        <Input etiqueta="Duración de clase (min)" tipo="number" value={formData.duracion_clase.toString()} onChange={e => handleChange('duracion_clase', parseInt(e.target.value) || 30)} min={30} max={120} ayuda="Entre 30 y 120 minutos" />

                        <Input etiqueta="Duración de descanso (min)" tipo="number" value={formData.duracion_descanso.toString()} onChange={e => handleChange('duracion_descanso', parseInt(e.target.value) || 5)} min={5} max={60} ayuda="Tiempo entre clases" />
                    </div>

                    <div className="capFormConfig__acciones">
                        <Boton type="submit" variante="primario" tamano="md" disabled={!modificado || guardando} cargando={guardando}>
                            <IconoGuardar />
                            Guardar Capacidad
                        </Boton>
                    </div>
                </form>
            </TarjetaBody>
        </Tarjeta>
    );
}

export default PanelCapacidad;
