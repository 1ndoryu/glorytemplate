/**
 * Footer compartido — Pie de página del sitio.
 * Estilos en footer.css — sin clases Tailwind ni estilos inline.
 */

import { GloryLink } from '@/core/router/GloryLink';
import { useGloryOptions } from '@/hooks';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer(): JSX.Element {
    const { get } = useGloryOptions();

    const empresaData = get('empresa', {}) as Record<string, string>;
    const empresa = empresaData.nombre || 'Cresta Campers';
    const email = empresaData.email || '';
    const telefono = empresaData.telefono || '';
    const direccion = empresaData.direccion || '';

    const anio = new Date().getFullYear();

    return (
        <footer className="piePagina">
            <div className="contenedor pieGrid">
                {/* Marca */}
                <div className="pieMarca">
                    <h3 className="pieMarcaNombre">
                        Cresta<span className="pieMarcaLight">Campers</span>
                    </h3>
                    <p className="pieMarcaDescripcion">
                        Alquiler de furgonetas camper para tu próxima aventura. Viaja a tu ritmo, sin prisas.
                    </p>
                </div>

                {/* Navegación */}
                <div className="pieSeccion">
                    <h4 className="pieSeccionTitulo">Navegar</h4>
                    <ul className="pieSeccionLista">
                        <li><GloryLink href="/flota/" className="pieEnlace">Nuestra Flota</GloryLink></li>
                        <li><GloryLink href="/reservar/" className="pieEnlace">Reservar</GloryLink></li>
                        <li><GloryLink href="/sobre-nosotros/" className="pieEnlace">Sobre Nosotros</GloryLink></li>
                        <li><GloryLink href="/contacto/" className="pieEnlace">Contacto</GloryLink></li>
                    </ul>
                </div>

                {/* Legal */}
                <div className="pieSeccion">
                    <h4 className="pieSeccionTitulo">Legal</h4>
                    <ul className="pieSeccionLista">
                        <li><GloryLink href="/condiciones/" className="pieEnlace">Condiciones de alquiler</GloryLink></li>
                        <li><GloryLink href="/privacidad/" className="pieEnlace">Política de privacidad</GloryLink></li>
                        <li><GloryLink href="/aviso-legal/" className="pieEnlace">Aviso legal</GloryLink></li>
                        <li><GloryLink href="/cookies/" className="pieEnlace">Política de cookies</GloryLink></li>
                    </ul>
                </div>

                {/* Contacto */}
                <div className="pieSeccion">
                    <h4 className="pieSeccionTitulo">Contacto</h4>
                    <ul className="pieSeccionLista pieContacto">
                        {email && (
                            <li className="pieContactoItem">
                                <Mail size={16} className="pieContactoIcono" />
                                <a href={`mailto:${email}`} className="pieEnlace">{email}</a>
                            </li>
                        )}
                        {telefono && (
                            <li className="pieContactoItem">
                                <Phone size={16} className="pieContactoIcono" />
                                <a href={`tel:${telefono}`} className="pieEnlace">{telefono}</a>
                            </li>
                        )}
                        {direccion && (
                            <li className="pieContactoItem pieContactoDireccion">
                                <MapPin size={16} className="pieContactoIcono" />
                                {direccion}
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Bottom */}
            <div className="pieBarra">
                <div className="contenedor pieBarraContenido">
                    <p>&copy; {anio} {empresa}. Todos los derechos reservados.</p>
                    <p>Hecho para viajeros</p>
                </div>
            </div>
        </footer>
    );
}
