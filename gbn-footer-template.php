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
            <div gloryTexto class="logo">COSMO REVENUE</div>
            <ul class="footer-nav">
                <li><a gloryButton href="#">Inicio</a></li>
                <li><a gloryButton href="#">Servicios</a></li>
                <li><a gloryButton href="#">Nosotros</a></li>
                <li><a gloryButton href="#">Casos</a></li>
                <li><a gloryButton href="#">Contacto</a></li>
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
</footer>

<!-- Lucide Icons: Se carga al final para que todos los elementos data-lucide existan en el DOM -->
<script src="https://unpkg.com/lucide@latest"></script>
<script>
    // Se usa DOMContentLoaded como fallback, pero también verificamos si lucide ya esta disponible
    // ya que el script anterior puede haber cargado de forma asincrona
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });

    // Fallback: si el DOM ya cargo pero lucide aun no estaba listo
    // (puede pasar con cache del navegador)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(function() {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 100);
    }
</script>