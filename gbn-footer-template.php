<?php
/**
 * Template por defecto del Footer GBN.
 * 
 * Este archivo define la estructura HTML del footer cuando GBN está activo
 * y no hay un template personalizado guardado en wp_options.
 * 
 * Puedes editar este archivo directamente o usar el editor visual en:
 * Apariencia > Footer GBN
 * 
 * Placeholders disponibles (se reemplazan automáticamente):
 * - {year}: Año actual
 * - {siteName}: Nombre del sitio
 * - {siteUrl}: URL del sitio
 * 
 * Atributos GBN disponibles:
 * - gloryFooter: Contenedor principal del footer
 * - gloryLogo: Componente del logo (opcional)
 * - gloryMenu: Componente del menú (opcional)
 * 
 * @package Glory\Gbn
 */

// Obtener datos dinámicos
$siteTitle = get_bloginfo('name');
$year = date('Y');
$homeUrl = esc_url(home_url('/'));
?>
<footer gloryFooter class="gbn-footer" role="contentinfo">
    <div class="gbn-footer-container">
        <div class="gbn-footer-content">
            <div class="gbn-footer-section">
                <h4>Acerca de</h4>
                <p>Descripción breve del sitio o empresa. Puedes editar este texto desde Apariencia > Footer GBN.</p>
            </div>
            <div class="gbn-footer-section">
                <h4>Enlaces</h4>
                <ul>
                    <li><a href="<?php echo $homeUrl; ?>">Inicio</a></li>
                    <li><a href="#">Servicios</a></li>
                    <li><a href="#">Nosotros</a></li>
                    <li><a href="#">Contacto</a></li>
                </ul>
            </div>
            <div class="gbn-footer-section">
                <h4>Contacto</h4>
                <p>info@ejemplo.com</p>
                <p>+1 234 567 890</p>
            </div>
        </div>
        <div class="gbn-footer-bottom">
            <p>&copy; <?php echo $year; ?> <?php echo esc_html($siteTitle); ?>. Todos los derechos reservados.</p>
        </div>
    </div>
</footer>
