/**
 * PanelTimezone
 *
 * Componente para configurar la zona horaria del centro.
 * Permite seleccionar entre las zonas horarias más comunes en España.
 */

import {useState} from 'react';
import {Boton, Tarjeta, TarjetaHeader, TarjetaBody, Alerta} from '../ui';
import {IconoGuardar, IconoGlobo} from '../icons';
import type {ConfiguracionHorarios} from '../../hooks/useConfiguracion';

interface PanelTimezoneProps {
    config: ConfiguracionHorarios | null;
    guardando: boolean;
    onGuardar: (datos: Partial<ConfiguracionHorarios>) => Promise<boolean>;
}

/* Zonas horarias comunes en España y Europa */
const TIMEZONES_COMUNES = [
    {value: 'Europe/Madrid', label: 'España Peninsular (Madrid, Barcelona)'},
    {value: 'Atlantic/Canary', label: 'Islas Canarias'},
    {value: 'Europe/Lisbon', label: 'Portugal (Lisboa)'},
    {value: 'Europe/Paris', label: 'Francia (París)'},
    {value: 'Europe/London', label: 'Reino Unido (Londres)'},
    {value: 'Europe/Berlin', label: 'Alemania (Berlín)'},
    {value: 'Europe/Rome', label: 'Italia (Roma)'},
    {value: 'America/New_York', label: 'Estados Unidos (Nueva York)'},
    {value: 'America/Los_Angeles', label: 'Estados Unidos (Los Ángeles)'},
    {value: 'UTC', label: 'UTC (Coordinated Universal Time)'}
];

export function PanelTimezone({config, guardando, onGuardar}: PanelTimezoneProps) {
    const [timezone, setTimezone] = useState<string>(config?.timezone || 'Europe/Madrid');
    const [modificado, setModificado] = useState(false);

    const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimezone(e.target.value);
        setModificado(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const exito = await onGuardar({timezone});

        if (exito) {
            setModificado(false);
        }
    };

    return (
        <Tarjeta className="capPanelConfig">
            <TarjetaHeader>
                <div className="capFlexStart capGap--sm">
                    <span className="capPanelConfig__icono">
                        <IconoGlobo />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Zona Horaria</h3>
                </div>
            </TarjetaHeader>
            <TarjetaBody>
                <form onSubmit={handleSubmit} className="capFormConfig">
                    <Alerta variante="info" className="capMb--md">
                        Configura la zona horaria de tu centro. Todas las fechas y horas del sistema se ajustarán a esta zona horaria.
                    </Alerta>

                    <div className="capInput">
                        <label htmlFor="timezone" className="capInput__etiqueta">
                            Zona Horaria
                        </label>
                        <select
                            id="timezone"
                            className="capInput__campo"
                            value={timezone}
                            onChange={handleTimezoneChange}
                            disabled={guardando}>
                            {TIMEZONES_COMUNES.map(tz => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <p className="capInput__ayuda">
                            Zona horaria seleccionada: <strong>{timezone}</strong>
                        </p>
                    </div>

                    <div className="capFormConfig__acciones">
                        <Boton type="submit" variante="primario" tamano="md" disabled={!modificado || guardando} cargando={guardando}>
                            <IconoGuardar />
                            Guardar Zona Horaria
                        </Boton>
                    </div>
                </form>
            </TarjetaBody>
        </Tarjeta>
    );
}

export default PanelTimezone;
