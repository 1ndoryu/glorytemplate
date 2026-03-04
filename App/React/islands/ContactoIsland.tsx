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
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="pt-24 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Título */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Contacto</h1>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">
                            ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Formulario */}
                        <div>
                            {enviado ? (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                                    <div className="text-4xl mb-3">✉️</div>
                                    <h2 className="text-xl font-bold text-green-800 mb-2">¡Mensaje enviado!</h2>
                                    <p className="text-green-700 text-sm mb-4">
                                        Hemos recibido tu mensaje. Te responderemos lo antes posible.
                                    </p>
                                    <button
                                        onClick={() => setEnviado(false)}
                                        className="text-green-600 hover:text-green-700 font-medium text-sm"
                                    >
                                        Enviar otro mensaje
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                        <input
                                            type="text"
                                            value={form.nombre}
                                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                        <input
                                            type="tel"
                                            value={form.telefono}
                                            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500"
                                            placeholder="+34 600 000 000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                                        <textarea
                                            value={form.mensaje}
                                            onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                                            rows={5}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 resize-none"
                                            placeholder="¿En qué podemos ayudarte?"
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition text-lg"
                                    >
                                        {loading ? 'Enviando...' : 'Enviar mensaje'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Info de contacto */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-md p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">{empresa}</h2>
                                <div className="space-y-4">
                                    {emailEmpresa && (
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📧</span>
                                            <div>
                                                <div className="text-sm text-gray-400">Email</div>
                                                <a href={`mailto:${emailEmpresa}`} className="text-gray-800 hover:text-green-600 transition">
                                                    {emailEmpresa}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {telefonoEmpresa && (
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📞</span>
                                            <div>
                                                <div className="text-sm text-gray-400">Teléfono</div>
                                                <a href={`tel:${telefonoEmpresa}`} className="text-gray-800 hover:text-green-600 transition">
                                                    {telefonoEmpresa}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {direccionEmpresa && (
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">📍</span>
                                            <div>
                                                <div className="text-sm text-gray-400">Dirección</div>
                                                <p className="text-gray-800">{direccionEmpresa}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Horarios */}
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                                <h3 className="font-bold text-green-800 mb-3">Horario de atención</h3>
                                <div className="text-sm text-green-700 space-y-1">
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
