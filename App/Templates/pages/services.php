<?php

function services_render()
{
    ?>
    <div class="services-container">
        <?php 
        services_hero();
        services_marketing();
        services_consulting();
        services_revenue();
        ?>
    </div>
    <?php
}

function services_hero() {
    ?>
    <section class="services-hero">
        <div class="hero-content">
            <h1 class="hero-title">
                <span class="script-text">Nuestros</span>
                SERVICIOS
            </h1>
            <p class="hero-subtitle">Combinamos Revenue, Marketing y Consultoría para impulsar tus ingresos. Soluciones flexibles que crecen al ritmo de tu negocio.</p>
        </div>
    </section>
    <?php
}

function services_marketing() {
    ?>
    <section class="marketing-section">
        <div class="section-tag">✦ Estrategia digital</div>
        <h2 class="section-title">Marketing y estrategia</h2>
        <p class="section-subtitle">Impulsa tu visibilidad y venta directa. Desde el lanzamiento hasta la consolidación de tu posicionamiento digital.</p>

        <div class="marketing-grid">
            <?php
            render_marketing_card(
                '🚀',
                'Comet',
                'IMPULSO INICIAL',
                'Para alojamientos que quieren establecer una presencia profesional.',
                ['Auditoría de redes', 'Gestión de 2 redes', 'Publicaciones semanales', 'Reporting mensual'],
                'Solicitar info →'
            );

            render_marketing_card(
                '✨',
                'Nebula',
                'ATRACCIÓN Y NUTRICIÓN',
                'Para negocios que buscan atraer tráfico y convertir seguidores en reservas.',
                ['Todo lo de COMET +', 'Anuncios en redes (Ads)', 'Email marketing', 'Gestión de comunidad'],
                'Consultar propuestas →'
            );

            render_marketing_card(
                '⚡',
                'Quasar',
                'ACELERACIÓN TOTAL',
                'Estrategia integral de comunicación y captación avanzada.',
                ['Todo lo de NEBULA +', 'Google Hotel Ads', 'Plan comunicación anual', 'Análisis ROI mensual'],
                'Reunión estratégica →'
            );
            ?>
        </div>
    </section>
    <?php
}

function render_marketing_card($icon, $title, $subtitle, $desc, $features, $cta) {
    ?>
    <div class="marketing-card">
        <div class="card-icon"><?php echo $icon; ?></div>
        <h3><?php echo $title; ?></h3>
        <span class="card-subtitle"><?php echo $subtitle; ?></span>
        <p class="card-desc"><?php echo $desc; ?></p>
        <ul class="card-features">
            <?php foreach ($features as $feature): ?>
                <li>✓ <?php echo $feature; ?></li>
            <?php endforeach; ?>
        </ul>
        <a href="#" class="btn-card"><?php echo $cta; ?></a>
    </div>
    <?php
}

function services_consulting() {
    ?>
    <section class="consulting-section">
        <div class="consulting-content">
            <div class="consulting-left">
                <div class="section-tag">✦ Auditoría y Tecnología</div>
                <h2 class="section-title">Consultoría & Mapeo</h2>
                <p class="section-text">
                    Antes de correr, ordenamos el camino. Un servicio esencial para alojamientos que buscan diagnóstico, limpieza de datos y una hoja de ruta clara antes de la temporada.
                </p>
                <p class="section-text">
                    Auditamos y conectamos tu ecosistema tecnológico (PMS, Channel Manager, OTAs) para asegurar que la distribución funcione sin fisuras.
                </p>
            </div>
            
            <div class="consulting-right">
                <?php render_orbit_card(); ?>
            </div>
        </div>
    </section>
    <?php
}

function render_orbit_card() {
    ?>
    <div class="orbit-card">
        <div class="orbit-header">
            <span class="orbit-icon">🌿</span>
            <h3>Orbit</h3>
        </div>
        <p class="orbit-desc">Empieza con claridad</p>
        <p class="orbit-subdesc">Auditoría inicial y puesta a punto. Ideal para diagnóstico y hoja de ruta antes de temporada.</p>
        
        <div class="orbit-features">
            <ul>
                <li>✓ Consultoría estratégica</li>
                <li>✓ Auditoría PMS/OTAs</li>
                <li>✓ Reunión de entrega</li>
            </ul>
            <ul>
                <li>✓ Mapeos de canales</li>
                <li>✓ Análisis de tarifas</li>
                <li>✓ Calendario demanda</li>
            </ul>
        </div>
        
        <a href="#" class="btn-orbit">Solicitar diagnóstico +</a>
    </div>
    <?php
}

function services_revenue() {
    ?>
    <section class="revenue-section">
        <div class="section-tag">✦ Gestión Mensual Recurrente</div>
        <h2 class="section-title">Revenue Management</h2>
        <p class="section-subtitle">Programas adaptados a la madurez de tu alojamiento. Desde auditoría técnica hasta gestión 360°.</p>
        
        <div class="services-revenue">
            <div class="services-revenue-grid">
                <?php render_marketing_card(
                    '🚀',
                    'Galaxy',
                    'Gestión externa continua',
                    'Ejecución y seguimiento constante mensual. Sin ampliar tu estructura interna.',
                    ['Todo lo de ORBIT+', 'Control channel mix', 'Revisión de tarifas (3-5 x Semana)', 'Reporting mensual'],
                    'Consultar propuestas →'
                ); ?>
            <?php render_marketing_card(
                '🚀',
                'Universe',
                'Departamento 360°',
                'Partner completo anual. Para grupos o alojamientos que buscan excelencia total.',
                ['Todo lo de GALAXY+', 'Estrategia de fidelización', 'Mapeos ilimitados', 'Formación de equipo'],
                'Reunión estratégica →'
            ); ?>
            </div>
        </div>

        <div class="services-revenue-bottom">
            <div class="services-revenue-bottom-content">
                <h2 class="section-title-italic">¿Dudas sobre qué plan elegir?</h2>
                
                <p class="revenue-bottom-text">Hablemos. Analizaremos tu situación y te recomendamos la órbita adecuada para tu despegue.</p>
                <a class="btn-submit-revenue" href="#">Contactar</a>
            </div>
        </div>

    </section>
    <?php
}
?>