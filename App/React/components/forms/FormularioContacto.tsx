import React, { useState, useCallback } from 'react';
import { useGloryForm } from '@app/hooks/useGloryForm';

interface FormularioContactoProps {
    formId?: string;
    servicioPreseleccionado?: string;
    titulo?: string;
    mostrarBadgeServicio?: boolean;
    mostrarHabitaciones?: boolean;
    className?: string;
}

interface DatosLocales {
    nombre: string;
    email: string;
    telefono: string;
    alojamiento: string;
    habitaciones: string;
    pms: string;
    mensaje: string;
    servicio: string;
    privacidad: boolean;
}

/*
 * Formulario de contacto reutilizable.
 * Replica la estructura exacta de ContactForm.php de App1.
 * Clases: contact-section, contact-container, section-header, section-title,
 * contact-form, form-row, form-group, full-width, form-footer, checkbox-label,
 * btn-submit, service-contact-section, service-selected-badge, badge-label, badge-value
 */
export function FormularioContacto({
    formId = 'contacto-general',
    servicioPreseleccionado = '',
    titulo = 'Contacto',
    mostrarBadgeServicio = false,
    mostrarHabitaciones = true,
    className = '',
}: FormularioContactoProps): React.JSX.Element {
    const [datos, setDatos] = useState<DatosLocales>({
        nombre: '',
        email: '',
        telefono: '',
        alojamiento: '',
        habitaciones: '',
        pms: '',
        mensaje: '',
        servicio: servicioPreseleccionado,
        privacidad: false,
    });

    const { estado, enviar } = useGloryForm();

    const handleCambio = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setDatos((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    }, []);

    const handleEnviar = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!datos.privacidad) return;

        const exito = await enviar({
            formId,
            nombre: datos.nombre,
            email: datos.email,
            telefono: datos.telefono,
            mensaje: datos.mensaje,
            extra: {
                alojamiento: datos.alojamiento,
                habitaciones: datos.habitaciones,
                pms: datos.pms,
                servicio: datos.servicio,
            },
        });

        if (exito) {
            setDatos({
                nombre: '', email: '', telefono: '', alojamiento: '',
                habitaciones: '', pms: '', mensaje: '',
                servicio: servicioPreseleccionado, privacidad: false,
            });
        }
    }, [datos, formId, servicioPreseleccionado, enviar]);

    const claseSeccion = mostrarBadgeServicio
        ? `contact-section service-contact-section ${className}`
        : `contact-section ${className}`;

    return (
        <section className={claseSeccion} style={{ width: '100%', maxWidth: 'unset' }}>
            <div className="contact-container">
                {titulo && (
                    <div className="section-header">
                        <h2 className="section-title">{titulo}</h2>
                    </div>
                )}

                {mostrarBadgeServicio && servicioPreseleccionado && (
                    <div className="service-selected-badge">
                        <span className="badge-label">Servicio seleccionado:</span>
                        <span className="badge-value">{servicioPreseleccionado}</span>
                    </div>
                )}

                <form className="contact-form" onSubmit={handleEnviar}>
                    {servicioPreseleccionado && (
                        <input type="hidden" name="servicio_interes" value={servicioPreseleccionado} />
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre" value={datos.nombre} onChange={handleCambio} required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={datos.email} onChange={handleCambio} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Telefono</label>
                            <input type="tel" name="telefono" value={datos.telefono} onChange={handleCambio} />
                        </div>
                        <div className="form-group">
                            <label>Alojamiento</label>
                            <input type="text" name="alojamiento" value={datos.alojamiento} onChange={handleCambio} />
                        </div>
                    </div>

                    {mostrarHabitaciones && (
                        <div className="form-row">
                            <div className="form-group">
                                <label>N habitaciones</label>
                                <input type="text" name="habitaciones" value={datos.habitaciones} onChange={handleCambio} />
                            </div>
                            <div className="form-group">
                                <label>PMS/Channel</label>
                                <input type="text" name="pms" value={datos.pms} onChange={handleCambio} />
                            </div>
                        </div>
                    )}

                    <div className="form-group full-width">
                        <label>Mensaje</label>
                        <textarea name="mensaje" rows={1} value={datos.mensaje} onChange={handleCambio} />
                    </div>

                    <div className="form-footer">
                        <label className="checkbox-label">
                            <input type="checkbox" name="privacidad" checked={datos.privacidad} onChange={handleCambio} required />
                            He leído y acepto la Politica de Privacidad.
                        </label>
                        <button type="submit" className="btn-submit" disabled={estado.enviando}>
                            {estado.enviando ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                </form>

                {(estado.exito !== null) && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: estado.exito ? '#4caf50' : '#f44336' }}>
                        {estado.mensaje}
                    </div>
                )}
            </div>
        </section>
    );
}
