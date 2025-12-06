<?php

function casos_render() {
    ?>
    <div class="casos-container">
        <?php 
        casos_hero();
        casos_grid();
        casos_quote();
        casos_cta();
        ?>
    </div>
    <?php
}

function casos_hero() {
    ?>
    <section class="casos-hero">
        <div class="hero-content">
            <h1 class="hero-title">
                <span class="script-text">
                    Casos
                    <span class="script-icon">✦</span>
                </span>
                DE ÉXITO
            </h1>
            <p class="hero-subtitle">Descubre algunos ejemplos reales del impacto de nuestras estrategias de Revenue Management en diferentes tipologías de hoteles.</p>
        </div>
    </section>
    <?php
}

function casos_grid() {
    $casos = [
        [
            'title' => 'Villa de Lujo',
            'location' => 'Costa Valenciana',
            'desc' => 'Incremento del 40% en ADR mediante estrategias de posicionamiento premium y gestión de canales exclusiva.',
            'image' => 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop' // Placeholder
        ],
        [
            'title' => 'Hotel Vacacional',
            'location' => 'Costa Blanca',
            'desc' => 'Optimización de ocupación en temporada baja logrando un aumento del 25% en RevPAR interanual.',
            'image' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025&auto=format&fit=crop' // Placeholder
        ],
        [
            'title' => 'Hotel Boutique Urbano',
            'location' => 'Centro Histórico',
            'desc' => 'Reestructuración completa de tarifas y segmentación, resultando en un crecimiento del 35% en venta directa.',
            'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop' // Placeholder
        ],
        [
            'title' => 'Apartamentos Turísticos',
            'location' => 'Zona Costera',
            'desc' => 'Automatización de precios dinámicos y conexión con nuevos canales de nicho para maximizar la rentabilidad.',
            'image' => 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop' // Placeholder
        ],
        [
            'title' => 'Resort Rural',
            'location' => 'Interior',
            'desc' => 'Estrategia de desestacionalización y paquetes de experiencias que duplicaron las reservas de fin de semana.',
            'image' => 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2070&auto=format&fit=crop' // Placeholder
        ],
        [
            'title' => 'Hostal Moderno',
            'location' => 'Ciudad',
            'desc' => 'Implementación de tecnología de revenue y mejora de reputación online, alcanzando el #1 en TripAdvisor.',
            'image' => 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069&auto=format&fit=crop' // Placeholder
        ]
    ];
    ?>
    <section class="casos-section">
        <div class="casos-grid">
            <?php foreach ($casos as $caso): ?>
                <div class="caso-card">
                    <img src="<?php echo esc_url($caso['image']); ?>" alt="<?php echo esc_attr($caso['title']); ?>" class="caso-image">
                    <div class="caso-content">
                        <div class="caso-meta">
                            <span><?php echo esc_html($caso['title']); ?></span>
                            <span><?php echo esc_html($caso['location']); ?></span>
                        </div>
                        <!-- <h3 class="caso-title"><?php echo esc_html($caso['title']); ?></h3> -->
                        <p class="caso-desc"><?php echo esc_html($caso['desc']); ?></p>
                        <!-- <a href="#" class="caso-link">Ver caso completo →</a> -->
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </section>
    <?php
}

function casos_quote() {
    ?>
    <section class="quote-section">
        <div class="quote-content">
            <span class="quote-icon">📊</span>
            <p class="quote-text">"Estos ejemplos reflejan cómo una gestión estratégica de precios, distribución y posicionamiento puede transformar los resultados de cualquier hotel."</p>
            <p class="quote-author">Adaptándonos siempre a su mercado y objetivos específicos.</p>
        </div>
    </section>
    <?php
}

function casos_cta() {
    ?>
    <section class="casos-cta">
        <h2 class="cta-title">¿Listo para escribir tu caso de éxito?</h2>
        <p class="cta-text">Analicemos el potencial oculto de tu alojamiento. Empieza con una auditoría o una consulta estratégica hoy mismo.</p>
        <a href="#" class="btn-cta">Contactar</a>
    </section>
    <?php
}

?>
