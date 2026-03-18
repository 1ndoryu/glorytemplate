/*
 * PrivacidadIsland — Kamples
 * Página estática de política de privacidad.
 * Cubre: datos recopilados, cookies, derechos del usuario, DMCA.
 * [183A-64] Tildes corregidas en textos visibles al usuario.
 */

import '../../styles/variables.css';
import '../../styles/legal.css';

export const PrivacidadIsland = (): JSX.Element => (
    <div className="contenedorLegal" id="paginaPrivacidad">
        <h1 className="tituloLegal">Política de Privacidad</h1>
        <p className="fechaLegal">Última actualización: Marzo 2026</p>

        <section className="seccionLegal">
            <h2>1. Información que recopilamos</h2>
            <p>
                Al usar Kamples, recopilamos la siguiente información:
            </p>
            <ul>
                <li><strong>Datos de cuenta:</strong> nombre de usuario, email y contraseña cifrada al registrarte.</li>
                <li><strong>Datos de perfil:</strong> nombre visible, avatar, biografía y enlaces sociales que decidas compartir.</li>
                <li><strong>Datos de uso:</strong> samples reproducidos, descargados, likes, colecciones, y actividad en la comunidad.</li>
                <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo y páginas visitadas para análisis y seguridad.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>2. Cómo usamos tu información</h2>
            <ul>
                <li>Proporcionar y mejorar el servicio de descubrimiento de samples.</li>
                <li>Personalizar las recomendaciones según tus gustos musicales.</li>
                <li>Gestionar tu cuenta y autenticación.</li>
                <li>Enviar notificaciones relacionadas con tu actividad (configurables).</li>
                <li>Proteger la plataforma contra abuso y actividad fraudulenta.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>3. Cookies y tecnologías similares</h2>
            <p>
                Usamos cookies esenciales para mantener tu sesión activa y recordar tus preferencias.
                No utilizamos cookies de seguimiento de terceros ni publicidad dirigida.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>4. Compartir información</h2>
            <p>
                No vendemos ni compartimos tu información personal con terceros, excepto:
            </p>
            <ul>
                <li>Cuando sea necesario para cumplir con obligaciones legales.</li>
                <li>Para procesar pagos a través de proveedores seguros (Stripe).</li>
                <li>Información de perfil pública que tú elijas mostrar.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>5. Tus derechos</h2>
            <p>
                Puedes en cualquier momento:
            </p>
            <ul>
                <li>Acceder y descargar tus datos personales desde tu perfil.</li>
                <li>Corregir o actualizar tu información.</li>
                <li>Eliminar tu cuenta y todos tus datos asociados.</li>
                <li>Contactarnos para cualquier consulta sobre privacidad.</li>
            </ul>
        </section>

        <section className="seccionLegal">
            <h2>6. Seguridad</h2>
            <p>
                Protegemos tu información mediante cifrado en tránsito (HTTPS/TLS),
                contraseñas hasheadas, y acceso restringido a datos personales.
                Ninguna transmisión por internet es 100% segura, pero implementamos
                medidas razonables para proteger tu información.
            </p>
        </section>

        <section className="seccionLegal">
            <h2>7. Contacto</h2>
            <p>
                Para consultas sobre privacidad, contáctanos en: <strong>privacy@kamples.com</strong>
            </p>
        </section>
    </div>
);
