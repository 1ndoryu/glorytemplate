/**
 * PanelHorarios
 *
 * Configuración de horarios de clase (mañana, tarde, viernes especial).
 * Incluye toggle para horario especial de viernes.
 */

import {useState, useEffect} from 'react';
import {Input, Boton, Tarjeta, TarjetaHeader, TarjetaBody} from '../ui';
import {IconoReloj, IconoGuardar} from '../icons';
import type {ConfiguracionHorarios} from '../../hooks/useConfiguracion';

interface PanelHorariosProps {
    config: ConfiguracionHorarios | null;
    guardando: boolean;
    onGuardar: (datos: Partial<ConfiguracionHorarios>) => Promise<boolean>;
}

export function PanelHorarios({config, guardando, onGuardar}: PanelHorariosProps) {
    const [formData, setFormData] = useState({
        hora_inicio_manana: '09:00',
        hora_fin_manana: '14:00',
        hora_inicio_tarde: '16:00',
        hora_fin_tarde: '21:00',
        viernes_especial: false,
        hora_fin_viernes: '15:00'
    });

    const [modificado, setModificado] = useState(false);

    useEffect(() => {
        if (config) {
            setFormData({
                hora_inicio_manana: config.hora_inicio_manana || '09:00',
                hora_fin_manana: config.hora_fin_manana || '14:00',
                hora_inicio_tarde: config.hora_inicio_tarde || '16:00',
                hora_fin_tarde: config.hora_fin_tarde || '21:00',
                viernes_especial: Boolean(config.viernes_especial),
                hora_fin_viernes: config.hora_fin_viernes || '15:00'
            });
        }
    }, [config]);

    const handleChange = (campo: keyof typeof formData, valor: string | boolean) => {
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
                        <IconoReloj />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Horarios de Clase</h3>
                </div>
            </TarjetaHeader>
            <TarjetaBody>
                <form onSubmit={handleSubmit} className="capFormConfig">
                    {/* Horario de mañana */}
                    <div className="capFormConfig__seccion">
                        <h4 className="capTexto capTexto--secundario capMb--sm">Turno de Mañana</h4>
                        <div className="capGrid capGrid--2cols capGap--md">
                            <Input etiqueta="Hora inicio" tipo="text" value={formData.hora_inicio_manana} onChange={e => handleChange('hora_inicio_manana', e.target.value)} placeholder="09:00" />
                            <Input etiqueta="Hora fin" tipo="text" value={formData.hora_fin_manana} onChange={e => handleChange('hora_fin_manana', e.target.value)} placeholder="14:00" />
                        </div>
                    </div>

                    {/* Horario de tarde */}
                    <div className="capFormConfig__seccion">
                        <h4 className="capTexto capTexto--secundario capMb--sm">Turno de Tarde</h4>
                        <div className="capGrid capGrid--2cols capGap--md">
                            <Input etiqueta="Hora inicio" tipo="text" value={formData.hora_inicio_tarde} onChange={e => handleChange('hora_inicio_tarde', e.target.value)} placeholder="16:00" />
                            <Input etiqueta="Hora fin" tipo="text" value={formData.hora_fin_tarde} onChange={e => handleChange('hora_fin_tarde', e.target.value)} placeholder="21:00" />
                        </div>
                    </div>

                    {/* Viernes especial */}
                    <div className="capFormConfig__seccion">
                        <label className="capToggle">
                            <input type="checkbox" checked={formData.viernes_especial} onChange={e => handleChange('viernes_especial', e.target.checked)} className="capToggle__input" />
                            <span className="capToggle__track"></span>
                            <span className="capToggle__label">Horario especial los viernes</span>
                        </label>

                        {formData.viernes_especial && (
                            <div className="capFormConfig__subSeccion capAnimFadeIn">
                                <Input etiqueta="Hora fin viernes" tipo="text" value={formData.hora_fin_viernes} onChange={e => handleChange('hora_fin_viernes', e.target.value)} placeholder="15:00" ayuda="El viernes termina antes que otros días" />
                            </div>
                        )}
                    </div>

                    <div className="capFormConfig__acciones">
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
