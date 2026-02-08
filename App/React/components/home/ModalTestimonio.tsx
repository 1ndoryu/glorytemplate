/*
 * Componente: ModalTestimonio
 * Modal para que un visitante escriba un testimonio/comentario.
 * Campos: foto, nombre, puesto, servicio/proyecto relacionado, red social, comentario.
 * El testimonio queda pendiente de aprobación (no se muestra en tiempo real).
 */
import React, {useState, useEffect, useRef} from 'react';
import {Button} from '../ui/Button';
import {useFocusTrap} from '../../hooks/useFocusTrap';
import './ModalTestimonio.css';

interface ModalTestimonioProps {
    abierto: boolean;
    onCerrar: () => void;
}

interface FormularioTestimonio {
    nombre: string;
    cargo: string;
    comentario: string;
    proyectoRelacionado: string;
    redSocial: string;
    foto: File | null;
}

const ESTADO_INICIAL: FormularioTestimonio = {
    nombre: '',
    cargo: '',
    comentario: '',
    proyectoRelacionado: '',
    redSocial: '',
    foto: null,
};

export const ModalTestimonio: React.FC<ModalTestimonioProps> = ({abierto, onCerrar}) => {
    const [formulario, setFormulario] = useState<FormularioTestimonio>(ESTADO_INICIAL);
    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const [estado, setEstado] = useState<'idle' | 'enviando' | 'exito' | 'error'>('idle');
    const modalRef = useRef<HTMLDivElement>(null);

    /* Focus trap: atrapa Tab dentro del modal */
    useFocusTrap(modalRef, abierto);

    /* Cerrar con Escape y bloquear scroll */
    useEffect(() => {
        if (!abierto) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [abierto, onCerrar]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormulario(prev => ({...prev, [name]: value}));
    };

    const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0] || null;
        setFormulario(prev => ({...prev, foto: archivo}));
        if (archivo) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewFoto(reader.result as string);
            reader.readAsDataURL(archivo);
        } else {
            setPreviewFoto(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEstado('enviando');

        try {
            /*
             * TO-DO: Enviar al backend via REST API.
             * Endpoint esperado: POST /wp-json/glory/v1/testimonios
             * Body: FormData con los campos del formulario.
             * El testimonio se guardará con estado "pendiente" en WP.
             */
            await new Promise(resolve => setTimeout(resolve, 1000));
            setEstado('exito');
            setFormulario(ESTADO_INICIAL);
            setPreviewFoto(null);
        } catch {
            setEstado('error');
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onCerrar();
    };

    if (!abierto) return null;

    return (
        <div className="modalTestimonioOverlay" onClick={handleOverlayClick}>
            <div className="modalTestimonioContenedor" ref={modalRef} role="dialog" aria-modal="true">
                <button className="modalTestimonioCerrar" onClick={onCerrar} aria-label="Cerrar">×</button>

                {estado === 'exito' ? (
                    <div className="modalTestimonioExito">
                        <h2 className="modalTestimonioExitoTitulo">Gracias por tu comentario</h2>
                        <p className="modalTestimonioExitoTexto">
                            Tu testimonio ha sido enviado y está pendiente de aprobación.
                            Lo revisaremos y publicaremos lo antes posible.
                        </p>
                        <Button variante="primario" onClick={onCerrar}>Cerrar</Button>
                    </div>
                ) : (
                    <>
                        <h2 className="modalTestimonioTitulo">Escribir un comentario</h2>
                        <p className="modalTestimonioSubtitulo">Comparte tu experiencia trabajando con nosotros.</p>

                        <form className="modalTestimonioFormulario" onSubmit={handleSubmit}>
                            {/* Foto de perfil */}
                            <div className="testimonioFotoWrapper">
                                <label htmlFor="testimonioFoto" className="testimonioFotoLabel">
                                    {previewFoto ? (
                                        <img src={previewFoto} alt="Preview" className="testimonioFotoPreview" />
                                    ) : (
                                        <div className="testimonioFotoPlaceholder">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                            <span>Foto</span>
                                        </div>
                                    )}
                                </label>
                                <input
                                    type="file"
                                    id="testimonioFoto"
                                    accept="image/*"
                                    onChange={handleFoto}
                                    className="testimonioFotoInput"
                                />
                            </div>

                            <div className="testimonioGridCampos">
                                {/* Nombre */}
                                <div className="testimonioCampo">
                                    <label htmlFor="testimonioNombre">Nombre completo *</label>
                                    <input
                                        type="text"
                                        id="testimonioNombre"
                                        name="nombre"
                                        value={formulario.nombre}
                                        onChange={handleChange}
                                        placeholder="Tu nombre"
                                        required
                                    />
                                </div>

                                {/* Cargo / Puesto */}
                                <div className="testimonioCampo">
                                    <label htmlFor="testimonioCargo">Puesto / Empresa</label>
                                    <input
                                        type="text"
                                        id="testimonioCargo"
                                        name="cargo"
                                        value={formulario.cargo}
                                        onChange={handleChange}
                                        placeholder="CEO, Empresa XYZ"
                                    />
                                </div>

                                {/* Proyecto / Servicio relacionado */}
                                <div className="testimonioCampo">
                                    <label htmlFor="testimonioProyecto">Servicio o proyecto relacionado</label>
                                    <input
                                        type="text"
                                        id="testimonioProyecto"
                                        name="proyectoRelacionado"
                                        value={formulario.proyectoRelacionado}
                                        onChange={handleChange}
                                        placeholder="Diseño Web, Branding, etc."
                                    />
                                </div>

                                {/* Red social */}
                                <div className="testimonioCampo">
                                    <label htmlFor="testimonioRedSocial">Red social (perfil)</label>
                                    <input
                                        type="url"
                                        id="testimonioRedSocial"
                                        name="redSocial"
                                        value={formulario.redSocial}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                            </div>

                            {/* Comentario */}
                            <div className="testimonioCampo testimonioCampoCompleto">
                                <label htmlFor="testimonioComentario">Tu comentario *</label>
                                <textarea
                                    id="testimonioComentario"
                                    name="comentario"
                                    value={formulario.comentario}
                                    onChange={handleChange}
                                    placeholder="Comparte tu experiencia..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="testimonioAcciones">
                                <Button variante="primario" className="testimonioBotonEnviar" disabled={estado === 'enviando'}>
                                    {estado === 'enviando' ? 'Enviando...' : 'Enviar testimonio'}
                                </Button>
                                {estado === 'error' && (
                                    <p className="testimonioError">Hubo un error. Intenta de nuevo.</p>
                                )}
                                <p className="testimonioNota">
                                    Tu comentario será revisado antes de publicarse.
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
