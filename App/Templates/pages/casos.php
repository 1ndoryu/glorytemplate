<?php

use Glory\Components\ContentRender;

function casos_render()
{
?>
    <div class="casos-container">
        <?php
        casos_hero();
        casos_grid();
        casos_quote();
        casos_cta();
        ?>
    </div>

    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>
<?php
}

function casos_hero()
{
?>
    <section gloryDiv class="casos-hero">
        <div gloryDivSecundario class="hero-content">
            <h1 gloryTexto class="hero-title">
                <span class="script-text">
                    Casos
                    <span class="script-icon"><i data-lucide="sparkles"></i></span>
                </span>
                DE EXITO
            </h1>
            <p gloryTexto class="hero-subtitle">Descubre algunos ejemplos reales del impacto de nuestras estrategias de Revenue Management en diferentes tipologias de hoteles.</p>
        </div>
    </section>
<?php
}

function template_caso_item($post, $itemClass)
{
    if (!$post instanceof \WP_Post) return;

    $location = get_post_meta($post->ID, 'location', true);
    $image_url = get_the_post_thumbnail_url($post->ID, 'large');

    if (!$image_url) {
        $image_url = 'https://via.placeholder.com/800x600?text=' . urlencode(get_the_title($post));
    }
?>
    <div class="<?php echo esc_attr($itemClass); ?> caso-minimal-card">
        <a href="<?php echo esc_url(get_permalink($post)); ?>" class="caso-card-link" style="text-decoration:none; color:inherit; display:block;">

            <div class="caso-minimal-header">
                <h3 class="caso-minimal-title"><?php echo esc_html(get_the_title($post)); ?></h3>
                <?php if ($location) : ?>
                    <span class="caso-minimal-location"><?php echo esc_html($location); ?></span>
                <?php endif; ?>
            </div>

            <div class="caso-minimal-image-wrap">
                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>" class="caso-minimal-image">
            </div>

        </a>
    </div>
<?php
}

function casos_grid()
{
?>
    <section gloryDiv class="casos-section">
        <?php
        ContentRender::print('portfolio', [
            'publicacionesPorPagina' => -1,
            'orden'                  => 'fecha',
            'argumentosConsulta'     => [
                'order' => 'DESC'
            ],
            'display_mode'        => 'grid',
            'grid_columns_mode'   => 'fixed',
            'grid_columns'        => 3,
            'grid_columns_medium' => 2,
            'grid_columns_small'  => 1,
            'gap'                 => '40px',
            'claseItem'           => 'caso-card',
            'plantillaCallback'      => 'template_caso_item',
            'forzarSinCache'      => true,
        ]);
        ?>
    </section>
<?php
}

function casos_quote()
{
?>
    <section gloryDiv class="quote-section">
        <div gloryDivSecundario class="quote-content">
            <span class="quote-icon"><i data-lucide="bar-chart-3"></i></span>
            <p gloryTexto class="quote-text">"Estos ejemplos reflejan como una gestion estrategica de precios, distribucion y posicionamiento puede transformar los resultados de cualquier hotel."</p>
            <p gloryTexto class="quote-author">Adaptandonos siempre a su mercado y objetivos especificos.</p>
        </div>
    </section>
<?php
}

function casos_cta()
{
?>
    <section gloryDiv class="casos-cta">
        <h2 gloryTexto class="cta-title">Listo para escribir tu caso de exito?</h2>
        <p gloryTexto class="cta-text">Analicemos el potencial oculto de tu alojamiento. Empieza con una auditoria o una consulta estrategica hoy mismo.</p>
        <a gloryButton href="#" class="btn-cta">Contactar</a>
    </section>
<?php
}

?>