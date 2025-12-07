<?php

/**
 * Template Name: Single Portfolio (Caso de Éxito)
 * Post Type: portfolio
 */
wp_enqueue_style('glory-single-portfolio', get_template_directory_uri() . '/App/Assets/css/single-portfolio.css', [], '1.0.0');

get_header();

while (have_posts()) : the_post(); 

    $client   = get_post_meta(get_the_ID(), 'client', true) ?: 'Confidencial';
    $location = get_post_meta(get_the_ID(), 'location', true) ?: 'España';
    $type     = get_post_meta(get_the_ID(), 'project_type', true) ?: 'Hotel';
    $services = get_post_meta(get_the_ID(), 'services', true) ?: 'Revenue Management';
    
    $results_quote = get_post_meta(get_the_ID(), 'results_quote', true);
    $results_items_raw = get_post_meta(get_the_ID(), 'results_items', true);
    $results_items = !empty($results_items_raw) ? explode("\n", $results_items_raw) : [];

    $thumb_url = get_the_post_thumbnail_url(get_the_ID(), 'full');
    
    $hero_subtitle = get_the_excerpt();
?>

<div class="single-portfolio-hero" style="background-image: url('<?php echo esc_url($thumb_url); ?>');">
    <div class="hero-inner">
        <h1 class="hero-title"><?php the_title(); ?></h1>
        <?php if ($hero_subtitle) : ?>
            <div class="hero-excerpt"><?php echo wp_kses_post($hero_subtitle); ?></div>
        <?php endif; ?>
    </div>
</div>

<div class="single-portfolio-container">
    
    <div class="portfolio-main-content">
        <div>
            <h2 class="content-title">Caso</h2>
            <div class="text-content">
                <?php the_content(); ?>
            </div>
            
            <?php 
            // La segunda imagen se supone que esta aqui
            ?>
        </div>

        <?php if ($results_quote || !empty($results_items)) : ?>
        <div class="results-box">
            <?php if ($results_quote) : ?>
                <div class="results-quote">
                    "<?php echo esc_html($results_quote); ?>"
                </div>
            <?php endif; ?>

            <?php if (!empty($results_items)) : ?>
                <ul class="results-list">
                    <?php foreach ($results_items as $item) : 
                        $item = trim($item); 
                        if (empty($item)) continue;
                    ?>
                        <li><?php echo esc_html($item); ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </div>

    
    <aside class="portfolio-sidebar">
        <div class="sidebar-card">
            <h3 class="cta-heading">¿Tienes un alojamiento similar?</h3>
            <p class="cta-desc">Podemos replicar esta estrategia adaptándola a tus necesidades específicas.</p>
            <a href="<?php echo home_url('/contacto'); ?>" class="btn-sidebar">Agendar Auditoría</a>
        </div>

        <div class="sidebar-card">
            <div class="info-grid">
                <span class="info-label">Cliente</span>
                <span class="info-value"><?php echo esc_html($client); ?></span>

                <span class="info-label">Ubicación</span>
                <span class="info-value"><?php echo esc_html($location); ?></span>

                <span class="info-label">Tipo</span>
                <span class="info-value"><?php echo esc_html($type); ?></span>

                <span class="info-label">Servicios</span>
                <span class="info-value"><?php echo esc_html($services); ?></span>
            </div>
        </div>

    </aside>
</div>

<!-- CTA Section -->
<section class="portfolio-cta-section">
    <div class="portfolio-cta-content">
        <h2 class="portfolio-cta-title">¿Listo para escribir tu caso de éxito?</h2>
        <p class="portfolio-cta-text">Analicemos el potencial oculto de tu alojamiento. Empieza con una auditoría o una consulta estratégica hoy mismo.</p>
        <a href="<?php echo home_url('/contacto'); ?>" class="portfolio-btn-cta">Contactar</a>
    </div>
</section>

<?php 
endwhile; 
get_footer();
?>
