<?php

namespace App\Helpers;

/**
 * PageHero - Helper para generar heroes de paginas internas
 * 
 * Genera un hero con el estilo de las paginas internas (services, casos, about):
 * - Fondo oscuro (#141414)
 * - Titulo con texto script (cursiva) + texto en mayusculas
 * - Subtitulo descriptivo
 * - Icono de sparkles
 * 
 * Uso:
 * PageHero::render('Casos', 'DE EXITO', 'Descripcion aqui...');
 */
class PageHero
{
    /**
     * Renderiza el hero de pagina interna
     * 
     * @param string $scriptText Texto en cursiva (ej: "Casos", "Sobre", "Nuestros")
     * @param string $mainText Texto principal en mayusculas (ej: "DE EXITO", "NOSOTROS", "SERVICIOS")
     * @param string $subtitle Subtitulo descriptivo
     * @return void
     */
    public static function render(string $scriptText, string $mainText, string $subtitle): void
    {
?>
        <section gloryDiv class="page-hero" style="min-height: 500px;">
            <div gloryDivSecundario class="hero-content">
                <h1 gloryTexto class="hero-title">
                    <span class="script-text">
                        <?php echo esc_html($scriptText); ?>

                        <?php echo Icons::get('sparkles', 'script-icon'); ?>
                    </span>
                    <?php echo esc_html($mainText); ?>
                </h1>
                <p gloryTexto class="hero-subtitle"><?php echo esc_html($subtitle); ?></p>
            </div>
        </section>
<?php
    }
}
