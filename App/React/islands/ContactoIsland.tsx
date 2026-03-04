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

            <div className="contactoLayout">
                <div className="contactoContenedor">
                    {/* Título */}
                    <div className="confirmacionExito">
                        <h1 className="heroInteriorTitulo">Contacto</h1>
                        <p className="heroInteriorSubtitulo">
                            ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
                        </p>
                    </div>

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
                        <div>
                            <div className="panelBlanco">
                                <h2 className="panelTitulo">{empresa.nombre}</h2>
                                <div className="reservarPasoContenido">
                                    {empresa.email && (
                                        <div className="contactoInfoItem">
                                            <span className="contactoInfoIcono">📧</span>
                                            <div>
                                                <div className="contactoInfoLabel">Email</div>
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
                                                <div className="contactoInfoLabel">Teléfono</div>
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
                                                <div className="contactoInfoLabel">Dirección</div>
                                                <p className="contactoInfoValor">{empresa.direccion}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Horarios */}
                            <div className="horariosBox">
                                <h3 className="horariosBoxTitulo">Horario de atención</h3>
                                <div className="horariosBoxLista">
                                    <p>Lunes a Viernes: 9:00 — 19:00</p>
                                    <p>Sábados: 10:00 — 14:00</p>
                                    <p>Domingos: Cerrado</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
