<?php

/**
 * Template Name: Single Casos (Caso de Exito)
 * Post Type: casos
 * 
 * Template para mostrar un caso de exito individual.
 * Todo el contenido es dinamico, obtenido de los meta fields del post.
 * 
 * Estructura:
 * - Hero con imagen destacada y datos principales
 * - Contenido con la historia del caso
 * - Sidebar con informacion y CTA
 * - Seccion CTA final
 * 
 * Meta fields utilizados:
 * - caso_tipo: Tipo de alojamiento
 * - caso_ubicacion: Ubicacion del proyecto
 * - caso_valor: Valor/resultado destacado principal
 * - caso_descripcion: Etiqueta del valor destacado
 * - caso_cliente: Nombre del cliente
 * - caso_servicios: Servicios prestados (separados por coma)
 * - caso_duracion: Duracion del proyecto
 * - caso_cita: Cita/testimonio del cliente
 * - caso_cita_autor: Autor de la cita
 * - caso_resultados: Lista de resultados (separados por |)
 */

wp_enqueue_style('glory-single-casos', get_template_directory_uri() . '/App/Assets/css/single-casos.css', [], '1.0.0');

get_header();

while (have_posts()) : the_post();

    // Obtener meta fields del caso
    $casoTipo = get_post_meta(get_the_ID(), 'caso_tipo', true) ?: 'Hotel';
    $casoUbicacion = get_post_meta(get_the_ID(), 'caso_ubicacion', true) ?: 'Espana';
    $casoValor = get_post_meta(get_the_ID(), 'caso_valor', true) ?: '';
    $casoDescripcion = get_post_meta(get_the_ID(), 'caso_descripcion', true) ?: '';
    $casoCliente = get_post_meta(get_the_ID(), 'caso_cliente', true) ?: 'Cliente Confidencial';
    $casoServicios = get_post_meta(get_the_ID(), 'caso_servicios', true) ?: 'Revenue Management';
    $casoDuracion = get_post_meta(get_the_ID(), 'caso_duracion', true) ?: '';
    $casoCita = get_post_meta(get_the_ID(), 'caso_cita', true) ?: '';
    $casoCitaAutor = get_post_meta(get_the_ID(), 'caso_cita_autor', true) ?: '';
    $casoResultadosRaw = get_post_meta(get_the_ID(), 'caso_resultados', true) ?: '';

    // Procesar resultados (separados por |)
    $casoResultados = [];
    if (!empty($casoResultadosRaw)) {
        $casoResultados = array_filter(array_map('trim', explode('|', $casoResultadosRaw)));
    }

    // Imagen destacada
    $thumbUrl = get_the_post_thumbnail_url(get_the_ID(), 'full');

    // Extracto para subtitulo
    $heroSubtitle = get_the_excerpt();
?>

    <div class="single-casos-container">

        <!-- Hero Section -->
        <section class="single-casos-hero" style="background-image: url('<?php echo esc_url($thumbUrl); ?>');">
            <div class="hero-overlay"></div>
            <div class="hero-inner">
                <div class="hero-tags">
                    <span class="hero-tag"><?php echo esc_html($casoTipo); ?></span>
                    <span class="hero-tag"><?php echo esc_html($casoUbicacion); ?></span>
                </div>
                <h1 class="hero-title"><?php the_title(); ?></h1>
                <?php if ($heroSubtitle) : ?>
                    <p class="hero-excerpt"><?php echo wp_kses_post($heroSubtitle); ?></p>
                <?php endif; ?>

                <?php if ($casoValor) : ?>
                    <div class="hero-stat" style="display: none;">
                        <span class="stat-value"><?php echo esc_html($casoValor); ?></span>
                        <?php if ($casoDescripcion) : ?>
                            <span class="stat-label"><?php echo esc_html($casoDescripcion); ?></span>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        </section>

        <!-- Main Content Grid -->
        <div class="casos-content-grid">

            <!-- Main Content Column -->
            <main class="casos-main-content">
                <article class="casos-article">
                    <h2 class="content-title">El Caso</h2>
                    <div class="text-content">
                        <?php the_content(); ?>
                    </div>
                </article>

                <!-- Resultados Box - Solo si hay cita o resultados -->
                <?php if ($casoCita || !empty($casoResultados)) : ?>
                    <div class="results-box">
                        <?php if ($casoCita) : ?>
                            <div class="results-quote-wrapper">
                                <p class="results-quote">
                                    "<?php echo esc_html($casoCita); ?>"
                                </p>
                                <?php if ($casoCitaAutor) : ?>
                                    <span class="results-quote-author">- <?php echo esc_html($casoCitaAutor); ?></span>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>

                        <?php if (!empty($casoResultados)) : ?>
                            <div class="results-section">
                                <h4 class="results-title">Resultados Clave</h4>
                                <ul class="results-list">
                                    <?php foreach ($casoResultados as $resultado) : ?>
                                        <li><?php echo esc_html($resultado); ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </main>

            <!-- Sidebar Column -->
            <aside class="casos-sidebar">
                <!-- CTA Card -->
                <div class="sidebar-card sidebar-cta">
                    <h3 class="cta-heading">Tienes un alojamiento similar?</h3>
                    <p class="cta-desc">Podemos replicar esta estrategia adaptandola a tus necesidades especificas.</p>
                    <a href="<?php echo esc_url(home_url('/contacto')); ?>" class="btn-sidebar">Agendar Auditoria</a>
                </div>

                <!-- Info Card -->
                <div class="sidebar-card sidebar-info">
                    <h4 class="info-card-title">Detalles del Proyecto</h4>
                    <div class="info-grid">
                        <span class="info-label">Cliente</span>
                        <span class="info-value"><?php echo esc_html($casoCliente); ?></span>

                        <span class="info-label">Tipo</span>
                        <span class="info-value"><?php echo esc_html($casoTipo); ?></span>

                        <span class="info-label">Ubicacion</span>
                        <span class="info-value"><?php echo esc_html($casoUbicacion); ?></span>

                        <?php if ($casoDuracion) : ?>
                            <span class="info-label">Duracion</span>
                            <span class="info-value"><?php echo esc_html($casoDuracion); ?></span>
                        <?php endif; ?>

                        <?php if ($casoValor) : ?>
                            <span class="info-label">Resultado</span>
                            <span class="info-value info-value-highlight"><?php echo esc_html($casoValor); ?></span>
                        <?php endif; ?>

                        <span class="info-label">Servicios</span>
                        <span class="info-value info-value-services"><?php echo esc_html($casoServicios); ?></span>
                    </div>
                </div>
            </aside>
        </div>

        <!-- CTA Section Final -->
        <section class="casos-cta-section">
            <div class="cta-content">
                <h2 class="cta-title">Listo para escribir tu caso de exito?</h2>
                <p class="cta-text">Analicemos el potencial oculto de tu alojamiento. Empieza con una auditoria o una consulta estrategica hoy mismo.</p>
                <a href="<?php echo esc_url(home_url('/contacto')); ?>" class="btn-cta">Contactar</a>
            </div>
        </section>

        <!-- Back to Cases Link -->
        <div class="back-to-cases">
            <a href="<?php echo esc_url(home_url('/casos')); ?>" class="back-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m15 18-6-6 6-6" />
                </svg>
                Ver todos los casos
            </a>
        </div>

    </div>

<?php
endwhile;
get_footer();
?>