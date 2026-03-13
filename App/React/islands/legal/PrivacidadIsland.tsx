/*
 * PrivacidadIsland — Kamples
 * Pagina estatica de politica de privacidad.
 * Cubre: datos recopilados, cookies, derechos del usuario, DMCA.
 */

import '../../styles/variables.css';
import '../../styles/legal.css';

export const PrivacidadIsland = (): JSX.Element => (
    <div className="contenedorLegal" id="paginaPrivacidad">
        <h1 className="tituloLegal">Politica de Privacidad</h1>
        <p className="fechaLegal">Ultima actualizacion: Marzo 2026</p>

        <section className="seccionLegal">
            <h2>1. Informacion que recopilamos</h2>
            <p>
                Al usar Kamples, recopilamos la siguiente informacion:
            </p>
            <ul>
                <li><strong>Datos de cuenta:</strong> nombre de usuario, email y contrasena cifrada al registrarte.</li>
                <li><strong>Datos de perfil:</strong> nombre visible, avatar, biografia y enlaces sociales que decidas compartir.</li>
                <li><strong>Datos de uso:</strong> samples reproducidos, descargados, likes, colecciones, y actividad en la comunidad.</li>
                <li><strong>Datos tecnicos:</strong> direccion IP, tipo de navegador, sistema operativo y paginas visitadas para analisis y seguridad.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>2. Como usamos tu informacion</h2>
            <ul>
                <li>Proporcionar y mejorar el servicio de descubrimiento de samples.</li>
                <li>Personalizar las recomendaciones segun tus gustos musicales.</li>
                <li>Gestionar tu cuenta y autenticacion.</li>
                <li>Enviar notificaciones relacionadas con tu actividad (configurables).</li>
                <li>Proteger la plataforma contra abuso y actividad fraudulenta.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>3. Cookies y tecnologias similares</h2>
            <p>
                Usamos cookies esenciales para mantener tu sesion activa y recordar tus preferencias.
                No utilizamos cookies de seguimiento de terceros ni publicidad dirigida.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>4. Compartir informacion</h2>
            <p>
                No vendemos ni compartimos tu informacion personal con terceros, excepto:
            </p>
            <ul>
                <li>Cuando sea necesario para cumplir con obligaciones legales.</li>
                <li>Para procesar pagos a traves de proveedores seguros (Stripe).</li>
                <li>Informacion de perfil publica que tu elijas mostrar.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>5. Tus derechos</h2>
            <p>
                Puedes en cualquier momento:
            </p>
            <ul>
                <li>Acceder y descargar tus datos personales desde tu perfil.</li>
                <li>Corregir o actualizar tu informacion.</li>
                <li>Eliminar tu cuenta y todos tus datos asociados.</li>
                <li>Contactarnos para cualquier consulta sobre privacidad.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>6. Seguridad</h2>
            <p>
                Protegemos tu informacion mediante cifrado en transito (HTTPS/TLS),
                contrasenas hasheadas, y acceso restringido a datos personales.
                Ninguna transmision por internet es 100% segura, pero implementamos
                medidas razonables para proteger tu informacion.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>7. Contacto</h2>
            <p>
                Para consultas sobre privacidad, contactanos en: <strong>privacy@kamples.com</strong>
            </p>
        </section>
    </div>
);
