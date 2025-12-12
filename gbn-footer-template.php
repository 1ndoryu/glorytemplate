<?php

/**
 * Template por defecto del Footer GBN.
 * 
 * Este archivo define la estructura HTML del footer cuando GBN esta activo
 * y no hay un template personalizado guardado en wp_options.
 * 
 * Puedes editar este archivo directamente o usar el editor visual en:
 * Apariencia > Footer GBN
 * 
 * Placeholders disponibles (se reemplazan automaticamente):
 * - {year}: Ano actual
 * - {siteName}: Nombre del sitio
 * - {siteUrl}: URL del sitio
 * 
 * Atributos GBN disponibles:
 * - gloryFooter: Contenedor principal del footer
 * - gloryLogo: Componente del logo (opcional)
 * - gloryMenu: Componente del menu (opcional)
 * 
 * @package Glory\Gbn
 */

// Obtener datos dinamicos
$siteTitle = get_bloginfo('name');
$year = date('Y');
$homeUrl = esc_url(home_url('/'));
?>
<footer gloryFooter class="landing-footer">
    <div gloryDivSecundario class="footer-content">
        <div gloryDivSecundario class="footer-brand">
            <div gloryTexto class="logo">
                <a href="<?php echo $homeUrl; ?>" rel="home" class="footer-logo-link">
                    <img src="<?php echo get_template_directory_uri(); ?>/App/Assets/images/LogoNegroLetras.png" alt="<?php echo esc_attr($siteTitle); ?>" class="footer-logo-img" style="height: auto; width: auto; max-height: 40px;">
                </a>
            </div>
            <ul class="footer-nav">
                <li><a gloryAjaxNav gloryButton href="/">Inicio</a></li>
                <li><a gloryAjaxNav gloryButton href="/servicios">Servicios</a></li>
                <li><a gloryAjaxNav gloryButton href="/about">Nosotros</a></li>
                <li><a gloryAjaxNav gloryButton href="/casos">Casos</a></li>
                <li><a gloryAjaxNav gloryButton href="/contacto">Contacto</a></li>
            </ul>
        </div>

        <div gloryDivSecundario class="footer-info">
            <div gloryDivSecundario class="info-col">
                <h4 gloryTexto>Contacto</h4>
                <p gloryTexto>hello@test.com</p>
                <p gloryTexto>+20 00 000 00</p>
            </div>
            <div gloryDivSecundario class="info-col">
                <h4 gloryTexto>Contacto</h4>
                <p gloryTexto>Lunes a Domingo</p>
                <p gloryTexto>08:00 AM - 10:00 PM</p>
            </div>
        </div>
    </div>

    <div gloryDivSecundario class="footer-bottom">
        <p gloryTexto>© 2025 Cosmo All rights reserved.</p>
        <div class="social-icons">
            <a gloryButton href="#"><i data-lucide="x"></i></a>
            <a gloryButton href="#"><i data-lucide="facebook"></i></a>
            <a gloryButton href="#"><i data-lucide="instagram"></i></a>
            <a gloryButton href="#"><i data-lucide="linkedin"></i></a>
        </div>
    </div>
</footer>