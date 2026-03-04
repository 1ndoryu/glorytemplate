/**
 * ContactoIsland — Formulario de contacto + información de la empresa.
 * Integrado con FormController de Glory.
 */

import { useState, useCallback } from 'react';
import { useGloryContext, useGloryOptions } from '@/hooks';
import { Header } from '@app/components/Header';
import { Footer } from '@app/components/Footer';

export function ContactoIsland(): JSX.Element {
    const { restUrl, nonce } = useGloryContext();
    const { get } = useGloryOptions();

    const empresaData = get('empresa', {}) as Record<string, string>;
    const empresa = empresaData.nombre || 'Cresta Campers';
    const emailEmpresa = empresaData.email || '';
    const telefonoEmpresa = empresaData.telefono || '';
    const direccionEmpresa = empresaData.direccion || '';

    const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' });
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const baseUrl = restUrl?.replace(/\/$/, '') ?? '/wp-json';

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre || !form.email || !form.mensaje) {
            setError('Por favor, rellena todos los campos obligatorios.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (nonce) headers['X-WP-Nonce'] = nonce;

            const res = await fetch(`${baseUrl}/glory/v1/form`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    formId: 'cresta-contacto',
                    nombre: form.nombre,
                    email: form.email,
                    telefono: form.telefono,
                    mensaje: form.mensaje,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setEnviado(true);
                setForm({ nombre: '', email: '', telefono: '', mensaje: '' });
            } else {
                setError(data.message ?? data.error ?? 'Error al enviar el formulario.');
            }
        } catch {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [form, baseUrl, nonce]);

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
                                    <button
                                        onClick={() => setEnviado(false)}
                                        className="mensajeExitoEnlace"
                                    >
                                        Enviar otro mensaje
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="formulario">
                                    <div>
                                        <label className="campoLabel">Nombre *</label>
                                        <input
                                            type="text"
                                            value={form.nombre}
                                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                            className="campoInput"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="campoLabel">Email *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            className="campoInput"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="campoLabel">Teléfono</label>
                                        <input
                                            type="tel"
                                            value={form.telefono}
                                            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                                            className="campoInput"
                                            placeholder="+34 600 000 000"
                                        />
                                    </div>
                                    <div>
                                        <label className="campoLabel">Mensaje *</label>
                                        <textarea
                                            value={form.mensaje}
                                            onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                                            rows={5}
                                            className="campoTextarea"
                                            placeholder="¿En qué podemos ayudarte?"
                                        />
                                    </div>

                                    {error && (
                                        <div className="alertaError">{error}</div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="botonPrimario"
                                    >
                                        {loading ? 'Enviando...' : 'Enviar mensaje'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Info de contacto */}
                        <div>
                            <div className="panelBlanco">
                                <h2 className="panelTitulo">{empresa}</h2>
                                <div className="reservarPasoContenido">
                                    {emailEmpresa && (
                                        <div className="contactoInfoItem">
                                            <span className="contactoInfoIcono">📧</span>
                                            <div>
                                                <div className="contactoInfoLabel">Email</div>
                                                <a href={`mailto:${emailEmpresa}`} className="contactoInfoValor">
                                                    {emailEmpresa}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {telefonoEmpresa && (
                                        <div className="contactoInfoItem">
                                            <span className="contactoInfoIcono">📞</span>
                                            <div>
                                                <div className="contactoInfoLabel">Teléfono</div>
                                                <a href={`tel:${telefonoEmpresa}`} className="contactoInfoValor">
                                                    {telefonoEmpresa}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {direccionEmpresa && (
                                        <div className="contactoInfoItem">
                                            <span className="contactoInfoIcono">📍</span>
                                            <div>
                                                <div className="contactoInfoLabel">Dirección</div>
                                                <p className="contactoInfoValor">{direccionEmpresa}</p>
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
