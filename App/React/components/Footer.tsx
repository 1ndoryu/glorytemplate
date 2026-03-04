/**
 * Footer compartido — Pie de página del sitio.
 */

import { GloryLink } from '@/core/router/GloryLink';
import { useGloryOptions } from '@/hooks';

export function Footer(): JSX.Element {
    const { get } = useGloryOptions();

    const empresaData = get('empresa', {}) as Record<string, string>;
    const empresa = empresaData.nombre || 'Cresta Campers';
    const email = empresaData.email || '';
    const telefono = empresaData.telefono || '';
    const direccion = empresaData.direccion || '';

    const anio = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Marca */}
                    <div className="md:col-span-1">
                        <h3 className="text-2xl font-bold mb-3">
                            Cresta<span className="font-light">Campers</span>
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Alquiler de furgonetas camper para tu próxima aventura. Viaja a tu ritmo, sin prisas.
                        </p>
                    </div>

                    {/* Navegación */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Navegar</h4>
                        <ul className="space-y-2">
                            <li><GloryLink href="/flota/" className="text-gray-300 hover:text-white transition">Nuestra Flota</GloryLink></li>
                            <li><GloryLink href="/reservar/" className="text-gray-300 hover:text-white transition">Reservar</GloryLink></li>
                            <li><GloryLink href="/sobre-nosotros/" className="text-gray-300 hover:text-white transition">Sobre Nosotros</GloryLink></li>
                            <li><GloryLink href="/contacto/" className="text-gray-300 hover:text-white transition">Contacto</GloryLink></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><GloryLink href="/condiciones/" className="text-gray-300 hover:text-white transition">Condiciones de alquiler</GloryLink></li>
                            <li><GloryLink href="/privacidad/" className="text-gray-300 hover:text-white transition">Política de privacidad</GloryLink></li>
                            <li><GloryLink href="/aviso-legal/" className="text-gray-300 hover:text-white transition">Aviso legal</GloryLink></li>
                            <li><GloryLink href="/cookies/" className="text-gray-300 hover:text-white transition">Política de cookies</GloryLink></li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">Contacto</h4>
                        <ul className="space-y-2 text-gray-300 text-sm">
                            {email && (
                                <li>
                                    <a href={`mailto:${email}`} className="hover:text-white transition">📧 {email}</a>
                                </li>
                            )}
                            {telefono && (
                                <li>
                                    <a href={`tel:${telefono}`} className="hover:text-white transition">📞 {telefono}</a>
                                </li>
                            )}
                            {direccion && (
                                <li className="text-gray-400">📍 {direccion}</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-500">
                    <p>© {anio} {empresa}. Todos los derechos reservados.</p>
                    <p className="flex items-center gap-1">
                        Hecho con 🌿 para viajeros
                    </p>
                </div>
            </div>
        </footer>
    );
}
