/**
 * PanelCentro
 *
 * Formulario para editar datos básicos del centro/autoescuela.
 * Campos: nombre, dirección, teléfono, email.
 */

import {useState, useEffect} from 'react';
import {Input, Boton, Tarjeta, TarjetaHeader, TarjetaBody} from '../ui';
import {IconoEdificio, IconoGuardar} from '../icons';
import type {DatosCentro} from '../../hooks/useConfiguracion';

interface PanelCentroProps {
    centro: DatosCentro | null;
    guardando: boolean;
    onGuardar: (datos: Partial<DatosCentro>) => Promise<boolean>;
}

export function PanelCentro({centro, guardando, onGuardar}: PanelCentroProps) {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        email: ''
    });

    const [modificado, setModificado] = useState(false);

    useEffect(() => {
        if (centro) {
            setFormData({
                nombre: centro.nombre || '',
                direccion: centro.direccion || '',
                telefono: centro.telefono || '',
                email: centro.email || ''
            });
        }
    }, [centro]);

    const handleChange = (campo: keyof typeof formData, valor: string) => {
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
                        <IconoEdificio />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Datos del Centro</h3>
                </div>
            </TarjetaHeader>
            <TarjetaBody>
                <form onSubmit={handleSubmit} className="capFormConfig">
                    <Input etiqueta="Nombre del centro" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} placeholder="Autoescuela Ejemplo" required />

                    <Input etiqueta="Dirección" value={formData.direccion} onChange={e => handleChange('direccion', e.target.value)} placeholder="Calle Principal 123, Ciudad" />

                    <div className="capGrid capGrid--2cols capGap--md">
                        <Input etiqueta="Teléfono" tipo="tel" value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="600 123 456" />

                        <Input etiqueta="Email de contacto" tipo="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="contacto@autoescuela.com" />
                    </div>

                    <div className="capFormConfig__acciones">
                        <Boton type="submit" variante="primario" tamano="md" disabled={!modificado || guardando} cargando={guardando}>
                            <IconoGuardar />
                            Guardar Cambios
                        </Boton>
                    </div>
                </form>
            </TarjetaBody>
        </Tarjeta>
    );
}

export default PanelCentro;
