<?php

use App\Helpers\ContactForm;
use App\Helpers\Marquee;
use App\Helpers\PageHero;

/**
 * contact_render - Renderiza la página de contacto completa
 * 
 * Estructura:
 * - Hero con titulo decorativo (usando helper PageHero)
 * - Informacion de contacto con iconos
 * - Formulario de contacto usando el helper ContactForm
 * - Marquee de cierre
 */
function contact_render()
{
?>
    <div class="contact-container">
        <?php
        contact_hero();
        contact_info();
        contact_form_section();
        contact_marquee();
        ?>
    </div>
<?php
}

/**
 * contact_hero - Hero de la página de contacto
 * Usa el helper PageHero para mantener consistencia con about y services
 */
function contact_hero()
{
    PageHero::render(
        'Hablemos',
        'CONTACTO',
        'Estamos aquí para ayudarte a maximizar la rentabilidad de tu alojamiento. Cuéntanos tu proyecto y encontraremos la solución perfecta para ti.'
    );
}


/**
 * contact_info - Seccion con informacion de contacto
 * Muestra email, telefono y ubicacion con iconos
 */
function contact_info()
{
?>
    <section gloryDiv class="contact-info-section">
        <div gloryDivSecundario class="contact-info-grid">
            <div gloryDivSecundario class="contact-info-card">
                <div class="info-icon">
                    <i data-lucide="mail"></i>
                </div>
                <h3 gloryTexto class="info-title">Email</h3>
                <p gloryTexto class="info-text">hola@cosmorevenue.com</p>
            </div>

            <div gloryDivSecundario class="contact-info-card">
                <div class="info-icon">
                    <i data-lucide="phone"></i>
                </div>
                <h3 gloryTexto class="info-title">Teléfono</h3>
                <p gloryTexto class="info-text">+34 600 000 000</p>
            </div>

            <div gloryDivSecundario class="contact-info-card">
                <div class="info-icon">
                    <i data-lucide="map-pin"></i>
                </div>
                <h3 gloryTexto class="info-title">Ubicación</h3>
                <p gloryTexto class="info-text">Comunidad Valenciana, España</p>
            </div>
        </div>
    </section>
<?php
}

/**
 * contact_form_section - Seccion con el formulario de contacto
 * Utiliza el helper ContactForm para mantener consistencia
 */
function contact_form_section()
{
    // Renderiza el formulario de contacto con el helper global
    // Parametros: formId, titulo, mostrar campos de habitaciones
    ContactForm::render('contact-page', 'Enviar mensaje', true);
}

/**
 * contact_marquee - Marquee de cierre de la página
 */
function contact_marquee()
{
    Marquee::echo('CONECTA CON NOSOTROS Y DESPEGA TU RENTABILIDAD', 'light', 'contact-marquee');
}
?>