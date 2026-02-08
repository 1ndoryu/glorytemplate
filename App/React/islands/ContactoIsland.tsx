/**
 * Componente: ContactoIsland
 * Pagina de contacto completa con formulario.
 * Campos: nombre, email, telefono, descripcion, presupuesto.
 */
import React, {useState} from 'react';
import '../styles/variables.css';
import './ContactoIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {Button} from '../components/ui/Button';
import {INFO_CONTACTO} from '../data/contacto';

interface ContactoIslandProps {
    titulo?: string;
}

interface FormularioContacto {
    nombre: string;
    email: string;
    telefono: string;
    descripcion: string;
    presupuesto: string;
}

const PRESUPUESTOS = [
    {value: '', label: 'Selecciona un rango'},
    {value: 'menos-5k', label: 'Menos de $5,000'},
    {value: '5k-10k', label: '$5,000 - $10,000'},
    {value: '10k-25k', label: '$10,000 - $25,000'},
    {value: '25k-50k', label: '$25,000 - $50,000'},
    {value: 'mas-50k', label: 'Más de $50,000'},
];

export const ContactoIsland = ({titulo = 'Contacto'}: ContactoIslandProps): JSX.Element => {
    const [formulario, setFormulario] = useState<FormularioContacto>({
        nombre: '',
        email: '',
        telefono: '',
        descripcion: '',
        presupuesto: '',
    });
    const [enviado, setEnviado] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormulario(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        /* TO-DO: Integrar con backend (REST API o email) */
        setEnviado(true);
    };

    return (
        <LayoutPagina className="contactoMain" id="paginaContacto">
            {/* Hero */}
            <section className="contactoHero">
                <div className="contactoHeroContenido">
                    <div className="contactoHeroTexto">
                        <h1 className="contactoHeroTitulo">{titulo}</h1>
                    </div>
                    <div className="contactoHeroDescripcion">
                        <p>
                            Cuéntanos sobre tu proyecto. Nos encanta escuchar ideas nuevas y
                            encontrar la mejor manera de hacerlas realidad.
                        </p>
                    </div>
                </div>
            </section>

            {/* Formulario */}
            <section className="contactoFormularioSeccion">
                <div className="contactoFormularioContenedor">
                    {enviado ? (
                        <div className="contactoExito" role="status" aria-live="polite">
                            <h2 className="contactoExitoTitulo">Mensaje enviado</h2>
                            <p className="contactoExitoTexto">
                                Gracias por contactarnos. Revisaremos tu solicitud y te
                                responderemos en menos de 24 horas.
                            </p>
                            <Button
                                variante="outline"
                                onClick={() => {
                                    setEnviado(false);
                                    setFormulario({nombre: '', email: '', telefono: '', descripcion: '', presupuesto: ''});
                                }}
                            >
                                Enviar otro mensaje
                            </Button>
                        </div>
                    ) : (
                        <form className="contactoFormulario" onSubmit={handleSubmit}>
                            <div className="formularioGrid">
                                {/* Nombre */}
                                <div className="campoCampo">
                                    <label htmlFor="nombre" className="campoEtiqueta">Nombre completo</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        name="nombre"
                                        value={formulario.nombre}
                                        onChange={handleChange}
                                        placeholder="Tu nombre"
                                        className="campoInput"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div className="campoCampo">
                                    <label htmlFor="email" className="campoEtiqueta">Correo electrónico</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formulario.email}
                                        onChange={handleChange}
                                        placeholder="tu@email.com"
                                        className="campoInput"
                                        required
                                    />
                                </div>

                                {/* Teléfono */}
                                <div className="campoCampo">
                                    <label htmlFor="telefono" className="campoEtiqueta">Teléfono (opcional)</label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        name="telefono"
                                        value={formulario.telefono}
                                        onChange={handleChange}
                                        placeholder="+1 234 567 890"
                                        className="campoInput"
                                    />
                                </div>

                                {/* Presupuesto */}
                                <div className="campoCampo">
                                    <label htmlFor="presupuesto" className="campoEtiqueta">Presupuesto estimado</label>
                                    <select
                                        id="presupuesto"
                                        name="presupuesto"
                                        value={formulario.presupuesto}
                                        onChange={handleChange}
                                        className="campoSelect"
                                    >
                                        {PRESUPUESTOS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Descripción - campo completo */}
                            <div className="campoCampo campoCompleto">
                                <label htmlFor="descripcion" className="campoEtiqueta">Descripción del proyecto</label>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={formulario.descripcion}
                                    onChange={handleChange}
                                    placeholder="Cuéntanos sobre tu proyecto, objetivos y plazos..."
                                    className="campoTextarea"
                                    rows={6}
                                    required
                                />
                            </div>

                            <div className="formularioAcciones">
                                <Button variante="primario" tamano="mediano" className="formularioBoton">
                                    Enviar mensaje
                                </Button>
                                <p className="formularioNota">
                                    Responderemos en menos de 24 horas hábiles.
                                </p>
                            </div>
                        </form>
                    )}

                    {/* Info lateral - datos centralizados */}
                    <aside className="contactoInfo" aria-label="Información de contacto">
                        <div className="contactoInfoBloque">
                            <h3 className="contactoInfoTitulo">Email</h3>
                            <a href={`mailto:${INFO_CONTACTO.email}`} className="contactoInfoEnlace">{INFO_CONTACTO.email}</a>
                        </div>
                        <div className="contactoInfoBloque">
                            <h3 className="contactoInfoTitulo">Teléfono</h3>
                            <a href={`tel:${INFO_CONTACTO.telefono.replace(/\s/g, '')}`} className="contactoInfoEnlace">{INFO_CONTACTO.telefono}</a>
                        </div>
                        <div className="contactoInfoBloque">
                            <h3 className="contactoInfoTitulo">Ubicación</h3>
                            <p className="contactoInfoTexto">{INFO_CONTACTO.ubicacionDetalle}</p>
                        </div>
                        <div className="contactoInfoBloque">
                            <h3 className="contactoInfoTitulo">Redes</h3>
                            <div className="contactoInfoRedes">
                                {INFO_CONTACTO.redesSociales.map(red => (
                                    <a key={red.nombre} href={red.url} className="contactoInfoEnlace" target="_blank" rel="noopener noreferrer">
                                        {red.nombre}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </LayoutPagina>
    );
};

export default ContactoIsland;
