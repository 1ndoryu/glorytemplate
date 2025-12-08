<?php

namespace App\Helpers;

/**
 * PageHero - Helper para generar heros de paginas internas
 * 
 * Genera un hero con el estilo de la pagina de servicios:
 * - Fondo oscuro (#141414)
 * - Titulo con texto script + mayusculas
 * - Subtitulo descriptivo
 * - Icono de sparkles
 */
class PageHero
{
    /**
     * Renderiza el hero de pagina interna
     * 
     * @param string $scriptText Texto en cursiva (ej: "Casos", "Sobre", "Nuestros")
     * @param string $mainText Texto principal en mayusculas (ej: "DE EXITO", "NOSOTROS", "SERVICIOS")
     * @param string $subtitle Subtitulo descriptivo
     * @param string $heroClass Clase CSS del hero (ej: "casos-hero", "about-hero", "services-hero")
     * @return void
     */
    public static function render(string $scriptText, string $mainText, string $subtitle, string $heroClass = 'page-hero'): void
    {
?>
        <section gloryDiv class="<?php echo esc_attr($heroClass); ?>">
            <div gloryDivSecundario class="hero-content">
                <h1 gloryTexto class="hero-title">
                    <span class="script-text">
                        <?php echo esc_html($scriptText); ?>
                        <span class="script-icon"><i data-lucide="sparkles"></i></span>
                    </span>
                    <?php echo esc_html($mainText); ?>
                </h1>
                <p gloryTexto class="hero-subtitle"><?php echo esc_html($subtitle); ?></p>
            </div>
        </section>
<?php
    }

    /**
     * Wrapper para echo directo
     */
    public static function echo(string $scriptText, string $mainText, string $subtitle, string $heroClass = 'page-hero'): void
    {
        self::render($scriptText, $mainText, $subtitle, $heroClass);
    }
}
