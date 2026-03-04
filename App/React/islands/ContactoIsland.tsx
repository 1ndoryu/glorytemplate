/**
 * ContactoIsland — Formulario de contacto + información de la empresa.
 * Integrado con FormController de Glory.
 */

import { useContacto } from '@app/hooks/useContacto';
import { Boton } from '@app/components/ui/Boton';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { CampoTextarea } from '@app/components/ui/CampoTextarea';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

export function ContactoIsland(): JSX.Element {
    const {
        form, actualizarCampo, handleSubmit,
        loading, enviado, error, resetear,
        empresa,
    } = useContacto();

    return (
        <div className="paginaBase">
            <Header />

            {/* Hero con fondo verde — título visible */}
            <section className="heroInterior">
                <div className="heroInteriorContenido">
                    <h1 className="heroInteriorTitulo">Contacto</h1>
                    <p className="heroInteriorSubtitulo">
                        ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
                    </p>
                </div>
            </section>

            <div className="contactoLayout">
                <div className="contactoContenedor">
                    <div className="contactoGrid">
                        {/* Formulario */}
                        <div>
                            {enviado ? (
                                <div className="mensajeExito">
                                    <div className="mensajeExitoIcono">✉️</div>
                                    <h2 className="mensajeExitoTitulo">¡Mensaje enviado!</h2>
                                    <p className="mensajeExitoTexto">
                                        Hemos recibido tu mensaje. Te responderemos lo antes posible.
                                    </p>
                                    <Boton variante="enlace" onClick={resetear}>
                                        Enviar otro mensaje
                                    </Boton>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="formulario">
                                    <CampoTexto
                                        label="Nombre *"
                                        value={form.nombre}
                                        onChange={v => actualizarCampo('nombre', v)}
                                        placeholder="Tu nombre"
                                    />
                                    <CampoTexto
                                        label="Email *"
                                        type="email"
                                        value={form.email}
                                        onChange={v => actualizarCampo('email', v)}
                                        placeholder="tu@email.com"
                                    />
                                    <CampoTexto
                                        label="Teléfono"
                                        type="tel"
                                        value={form.telefono}
                                        onChange={v => actualizarCampo('telefono', v)}
                                        placeholder="+34 600 000 000"
                                    />
                                    <CampoTextarea
                                        label="Mensaje *"
                                        value={form.mensaje}
                                        onChange={v => actualizarCampo('mensaje', v)}
                                        rows={5}
                                        placeholder="¿En qué podemos ayudarte?"
                                    />

                                    {error && (
                                        <div className="alertaError">{error}</div>
                                    )}

                                    <Boton type="submit" disabled={loading}>
                                        {loading ? 'Enviando...' : 'Enviar mensaje'}
                                    </Boton>
                                </form>
                            )}
                        </div>

                        {/* Info de contacto */}
                        <div className="contactoSidebar">
                            <div className="panelBlanco">
                                <h2 className="panelTitulo">{empresa.nombre}</h2>
                                <div className="contactoInfoLista">
                                    {empresa.email && (
                                        <div className="contactoInfoItem">
                                            <span className="contactoInfoIcono">📧</span>
                                            <div>
                                                <p className="contactoInfoLabel">Email</p>
                                                <a href={`mailto:${empresa.email}`} className="contactoInfoValor">
                                                    {empresa.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {empresa.telefono && (
                                        <div className="contactoInfoItem">
                                            <span className="contactoInfoIcono">📞</span>
                                            <div>
                                                <p className="contactoInfoLabel">Teléfono</p>
                                                <a href={`tel:${empresa.telefono}`} className="contactoInfoValor">
                                                    {empresa.telefono}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {empresa.direccion && (
                                        <div className="contactoInfoItem">
                                            <span className="contactoInfoIcono">📍</span>
                                            <div>
                                                <p className="contactoInfoLabel">Dirección</p>
                                                <p className="contactoInfoValor">{empresa.direccion}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Horarios */}
                            <div className="horariosBox">
                                <h3 className="horariosBoxTitulo">Horario de atención</h3>
                                <ul className="horariosLista">
                                    <li className="horariosItem">
                                        <span className="horariosDia">Lun — Vie</span>
                                        <span className="horariosHora">9:00 — 19:00</span>
                                    </li>
                                    <li className="horariosItem">
                                        <span className="horariosDia">Sábados</span>
                                        <span className="horariosHora">10:00 — 14:00</span>
                                    </li>
                                    <li className="horariosItem">
                                        <span className="horariosDia">Domingos</span>
                                        <span className="horariosHora horariosHoraCerrado">Cerrado</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
