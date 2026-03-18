/*
 * TerminosIsland — Kamples
 * Página estática de términos de servicio.
 * Cubre: uso aceptable, propiedad intelectual, DMCA takedown, limitaciones.
 * [183A-64] Tildes corregidas en textos visibles al usuario.
 */

import '../../styles/variables.css';
import '../../styles/legal.css';

export const TerminosIsland = (): JSX.Element => (
    <div className="contenedorLegal" id="paginaTerminos">
        <h1 className="tituloLegal">Términos de Servicio</h1>
        <p className="fechaLegal">Última actualización: Marzo 2026</p>

        <section className="seccionLegal">
            <h2>1. Aceptación de los términos</h2>
            <p>
                Al acceder o utilizar Kamples, aceptas estar sujeto a estos términos.
                Si no estás de acuerdo, no utilices la plataforma.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>2. Descripción del servicio</h2>
            <p>
                Kamples es una plataforma de descubrimiento y compartición de samples de audio.
                Los usuarios pueden explorar, subir, descargar y organizar samples musicales,
                así como descubrir relaciones de sampleo entre canciones.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>3. Cuentas de usuario</h2>
            <ul>
                <li>Debes tener al menos 13 años para crear una cuenta.</li>
                <li>Eres responsable de mantener la seguridad de tu cuenta y contraseña.</li>
                <li>No puedes usar la cuenta de otra persona sin autorización.</li>
                <li>Nos reservamos el derecho de suspender cuentas que violen estos términos.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>4. Contenido del usuario</h2>
            <p>
                Al subir contenido a Kamples:
            </p>
            <ul>
                <li>Declaras que tienes los derechos necesarios sobre el contenido.</li>
                <li>Otorgas a Kamples una licencia no exclusiva para alojar, mostrar y distribuir
                    el contenido dentro de la plataforma.</li>
                <li>Conservas todos tus derechos de propiedad sobre tu contenido original.</li>
                <li>No subirás contenido ilegal, ofensivo o que infrinja derechos de terceros.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>5. Propiedad intelectual y DMCA</h2>
            <p>
                Kamples respeta la propiedad intelectual. Los recortes de audio están
                disponibles con fines educativos y de referencia para la comunidad de productores.
            </p>
            <p>
                Si consideras que contenido en Kamples infringe tus derechos de autor,
                puedes enviar una notificación DMCA a: <strong>dmca@kamples.com</strong>
            </p>
            <p>
                Tu notificación debe incluir:
            </p>
            <ul>
                <li>Identificación de la obra protegida.</li>
                <li>URL del contenido infractor en Kamples.</li>
                <li>Tu información de contacto.</li>
                <li>Declaración de buena fe de que el uso no está autorizado.</li>
                <li>Tu firma electrónica o física.</li>
            </ul>
            <p>
                Procesaremos solicitudes válidas de forma expedita conforme al DMCA (17 U.S.C. §512).
            </p>
        </section>

        <section className="seccionLegal">
            <h2>6. Uso aceptable</h2>
            <p>Queda prohibido:</p>
            <ul>
                <li>Usar la plataforma para distribuir malware o spam.</li>
                <li>Intentar acceder sin autorización a sistemas o datos de otros usuarios.</li>
                <li>Realizar scraping automatizado sin permiso previo.</li>
                <li>Evadir medidas de seguridad o límites de descarga.</li>
                <li>Usar bots, scripts o herramientas automatizadas para manipular la plataforma.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>7. Limitación de responsabilidad</h2>
            <p>
                Kamples se proporciona &quot;tal cual&quot; sin garantías de ningún tipo.
                No nos hacemos responsables de daños indirectos, incidentales o consecuentes
                derivados del uso de la plataforma. Nuestra responsabilidad máxima se limita
                al monto pagado por el usuario en los 12 meses anteriores al evento.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>8. Modificaciones</h2>
            <p>
                Podemos actualizar estos términos periódicamente. Los cambios sustanciales
                se notificarán a través de la plataforma. El uso continuado después de
                las modificaciones constituye aceptación de los nuevos términos.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>9. Contacto</h2>
            <p>
                Para consultas legales: <strong>legal@kamples.com</strong>
            </p>
        </section>
    </div>
);
