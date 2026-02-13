import React, { useState, useCallback } from 'react';
import { useGloryForm } from '@app/hooks/useGloryForm';
import '@app/styles/contactForm.css';

interface FormularioContactoProps {
    /* ID del formulario para tracking */
    formId?: string;
    /* Servicio preseleccionado (ej: desde pagina de servicio detalle) */
    servicioPreseleccionado?: string;
    /* Titulo encima del formulario */
    titulo?: string;
    /* Si true, muestra badge del servicio */
    mostrarBadgeServicio?: boolean;
    className?: string;
}

interface DatosLocales {
    nombre: string;
    email: string;
    telefono: string;
    hotel: string;
    mensaje: string;
    servicio: string;
    privacidad: boolean;
}

/*
 * Formulario de contacto reutilizable.
 * Usa useGloryForm para enviar datos al endpoint REST glory/v1/form.
 */
export function FormularioContacto({
    formId = 'contacto-general',
    servicioPreseleccionado = '',
    titulo,
    mostrarBadgeServicio = false,
    className = '',
}: FormularioContactoProps): React.JSX.Element {
    const [datos, setDatos] = useState<DatosLocales>({
        nombre: '',
        email: '',
        telefono: '',
        hotel: '',
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

        if (!datos.privacidad) {
            return;
        }

        const exito = await enviar({
            formId,
            nombre: datos.nombre,
            email: datos.email,
            telefono: datos.telefono,
            mensaje: datos.mensaje,
            extra: {
                hotel: datos.hotel,
                servicio: datos.servicio,
            },
        });

        if (exito) {
            setDatos({
                nombre: '', email: '', telefono: '', hotel: '',
                mensaje: '', servicio: servicioPreseleccionado, privacidad: false,
            });
        }
    }, [datos, formId, servicioPreseleccionado, enviar]);

    return (
        <div className={`contenedorContacto ${className}`}>
            {titulo && <h3 className="tituloFormulario">{titulo}</h3>}

            {mostrarBadgeServicio && servicioPreseleccionado && (
                <span className="badgeServicio">{servicioPreseleccionado}</span>
            )}

            <form className="formularioContacto" onSubmit={handleEnviar}>
                <div className="filaFormulario">
                    <div className="grupoFormulario">
                        <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre"
                            value={datos.nombre}
                            onChange={handleCambio}
                            required
                        />
                    </div>
                    <div className="grupoFormulario">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={datos.email}
                            onChange={handleCambio}
                            required
                        />
                    </div>
                </div>

                <div className="filaFormulario">
                    <div className="grupoFormulario">
                        <input
                            type="tel"
                            name="telefono"
                            placeholder="Teléfono"
                            value={datos.telefono}
                            onChange={handleCambio}
                        />
                    </div>
                    <div className="grupoFormulario">
                        <input
                            type="text"
                            name="hotel"
                            placeholder="Hotel / Alojamiento"
                            value={datos.hotel}
                            onChange={handleCambio}
                        />
                    </div>
                </div>

                <div className="grupoFormulario campoCompleto">
                    <textarea
                        name="mensaje"
                        placeholder="Cuéntanos sobre tu proyecto..."
                        rows={4}
                        value={datos.mensaje}
                        onChange={handleCambio}
                        required
                    />
                </div>

                <div className="grupoCheckbox">
                    <label>
                        <input
                            type="checkbox"
                            name="privacidad"
                            checked={datos.privacidad}
                            onChange={handleCambio}
                            required
                        />
                        <span>
                            Acepto la{' '}
                            <a href="/politica-privacidad/" target="_blank" rel="noopener">
                                política de privacidad
                            </a>
                        </span>
                    </label>
                </div>

                {(estado.exito !== null) && (
                    <div className={`mensajeResultado ${estado.exito ? 'exito' : 'error'}`}>
                        {estado.mensaje}
                    </div>
                )}

                {estado.errores.nombre && <span className="errorCampo">{estado.errores.nombre}</span>}
                {estado.errores.email && <span className="errorCampo">{estado.errores.email}</span>}

                <button
                    type="submit"
                    className="botonEnviar"
                    disabled={estado.enviando}
                >
                    {estado.enviando ? 'Enviando...' : 'Solicitar auditoría gratuita'}
                </button>
            </form>
        </div>
    );
}
