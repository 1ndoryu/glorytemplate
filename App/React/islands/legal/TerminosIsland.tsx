/*
 * TerminosIsland — Kamples
 * Pagina estatica de terminos de servicio.
 * Cubre: uso aceptable, propiedad intelectual, DMCA takedown, limitaciones.
 */

import '../../styles/variables.css';
import '../../styles/legal.css';

export const TerminosIsland = (): JSX.Element => (
    <div className="contenedorLegal" id="paginaTerminos">
        <h1 className="tituloLegal">Terminos de Servicio</h1>
        <p className="fechaLegal">Ultima actualizacion: Marzo 2026</p>

        <section className="seccionLegal">
            <h2>1. Aceptacion de los terminos</h2>
            <p>
                Al acceder o utilizar Kamples, aceptas estar sujeto a estos terminos.
                Si no estas de acuerdo, no utilices la plataforma.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>2. Descripcion del servicio</h2>
            <p>
                Kamples es una plataforma de descubrimiento y comparticion de samples de audio.
                Los usuarios pueden explorar, subir, descargar y organizar samples musicales,
                asi como descubrir relaciones de sampleo entre canciones.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>3. Cuentas de usuario</h2>
            <ul>
                <li>Debes tener al menos 13 anos para crear una cuenta.</li>
                <li>Eres responsable de mantener la seguridad de tu cuenta y contrasena.</li>
                <li>No puedes usar la cuenta de otra persona sin autorizacion.</li>
                <li>Nos reservamos el derecho de suspender cuentas que violen estos terminos.</li>
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
                Kamples respeta la propiedad intelectual. Los recortes de audio estan
                disponibles con fines educativos y de referencia para la comunidad de productores.
            </p>
            <p>
                Si consideras que contenido en Kamples infringe tus derechos de autor,
                puedes enviar una notificacion DMCA a: <strong>dmca@kamples.com</strong>
            </p>
            <p>
                Tu notificacion debe incluir:
            </p>
            <ul>
                <li>Identificacion de la obra protegida.</li>
                <li>URL del contenido infractor en Kamples.</li>
                <li>Tu informacion de contacto.</li>
                <li>Declaracion de buena fe de que el uso no esta autorizado.</li>
                <li>Tu firma electronica o fisica.</li>
            </ul>
            <p>
                Procesaremos solicitudes validas de forma expedita conforme al DMCA (17 U.S.C. §512).
            </p>
        </section>

        <section className="seccionLegal">
            <h2>6. Uso aceptable</h2>
            <p>Queda prohibido:</p>
            <ul>
                <li>Usar la plataforma para distribuir malware o spam.</li>
                <li>Intentar acceder sin autorizacion a sistemas o datos de otros usuarios.</li>
                <li>Realizar scraping automatizado sin permiso previo.</li>
                <li>Evadir medidas de seguridad o limites de descarga.</li>
                <li>Usar bots, scripts o herramientas automatizadas para manipular la plataforma.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>7. Limitacion de responsabilidad</h2>
            <p>
                Kamples se proporciona &quot;tal cual&quot; sin garantias de ningun tipo.
                No nos hacemos responsables de danos indirectos, incidentales o consecuentes
                derivados del uso de la plataforma. Nuestra responsabilidad maxima se limita
                al monto pagado por el usuario en los 12 meses anteriores al evento.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>8. Modificaciones</h2>
            <p>
                Podemos actualizar estos terminos periodicamente. Los cambios sustanciales
                se notificaran a traves de la plataforma. El uso continuado despues de
                las modificaciones constituye aceptacion de los nuevos terminos.
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
