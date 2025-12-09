<?php

use App\Helpers\PageHero;

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
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>

<?php
}

function services_hero()
{
    PageHero::render(
        'Nuestros',
        'SERVICIOS',
        'Combinamos Revenue, Marketing y Consultoría para impulsar tus ingresos. Soluciones flexibles que crecen al ritmo de tu negocio.'
    );
}

function services_marketing()
{
?>
    <section gloryDiv class="marketing-section">
        <div class="section-tag">
            <i data-lucide="sparkles">
            </i>
            <p class="section-tag-text">
                Estrategia digital
            </p>
        </div>

        <h2 gloryTexto class="section-title">Marketing y estrategia</h2>
        <p gloryTexto class="section-subtitle">Impulsa tu visibilidad y venta directa. Desde el lanzamiento hasta la consolidación de tu posicionamiento digital.</p>

        <div class="marketing-grid">
            <?php
            render_marketing_card(
                '<i data-lucide="rocket"></i>',
                'Comet',
                'IMPULSO INICIAL',
                'Para alojamientos que quieren establecer una presencia profesional.',
                ['Auditoría de redes', 'Gestión de 2 redes', 'Publicaciones semanales', 'Reporting mensual'],
                'Solicitar info <i data-lucide="arrow-right"></i>',
                'left',
                '/servicio-comet'
            );

            render_marketing_card(
                '<i data-lucide="sparkles"></i>',
                'Nebula',
                'ATRACCIÓN Y NUTRICIÓN',
                'Para negocios que buscan atraer tráfico y convertir seguidores en reservas.',
                ['Todo lo de COMET +', 'Anuncios en redes (Ads)', 'Email marketing', 'Gestión de comunidad'],
                'Consultar propuestas <i data-lucide="arrow-right"></i>',
                'center',
                '/servicio-nebula'
            );

            render_marketing_card(
                '<i data-lucide="zap"></i>',
                'Quasar',
                'ACELERACIÓN TOTAL',
                'Estrategia integral de comunicación y captación avanzada.',
                ['Todo lo de NEBULA +', 'Google Hotel Ads', 'Plan comunicación anual', 'Análisis ROI mensual'],
                'Reunión estratégica <i data-lucide="arrow-right"></i>',
                'right',
                '/servicio-quasar'
            );
            ?>
        </div>
    </section>
<?php
}

function render_marketing_card($icon, $title, $subtitle, $desc, $features, $cta, $dir = 'normal', $link = '#')
{
?>
    <div class="<?php if ($dir == 'normal') echo 'marketing-card';
                else echo 'marketing-card-' . $dir; ?>">
        <div class="card-header">
            <div class="card-icon-wrapper">
                <?php echo $icon; ?>
            </div>

            <h3><?php echo $title; ?></h3>
            <span class="card-subtitle"><?php echo $subtitle; ?></span>
        </div>

        <div class="card-body">
            <p class="card-desc"><?php echo $desc; ?></p>
            <ul class="card-features">
                <?php foreach ($features as $feature): ?>
                    <li>
                        <span class="feature-check">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="11" stroke="#8c8c8c" stroke-width="1" />
                                <path d="M8 12L11 15L16 9" stroke="#8c8c8c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </span>
                        <span class="feature-text"><?php echo $feature; ?></span>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>

        <div class="card-footer">
            <a gloryAjaxNav href="<?php echo esc_url($link); ?>" class="btn-card"><?php echo $cta; ?></a>
        </div>
    </div>
<?php
}

function services_consulting()
{
?>
    <section gloryDiv class="consulting-section">
        <div gloryDivSecundario class="consulting-content">
            <div gloryDivSecundario class="consulting-left">
                <div class="section-tag">
                    <i data-lucide="sparkles"></i>
                    <p class="section-tag-text">Auditoría y Tecnología</p>
                </div>
                <h2 gloryTexto class="section-title">Consultoría & Mapeo</h2>
                <p gloryTexto class="section-text">
                    Antes de correr, ordenamos el camino. Un servicio esencial para alojamientos que buscan diagnóstico, limpieza de datos y una hoja de ruta clara antes de la temporada.
                </p>
                <p gloryTexto class="section-text">
                    Auditamos y conectamos tu ecosistema tecnológico (PMS, Channel Manager, OTAs) para asegurar que la distribución funcione sin fisuras.
                </p>
            </div>

            <div gloryDivSecundario class="consulting-right">
                <?php render_orbit_card(); ?>
            </div>
        </div>
    </section>
<?php
}

function render_orbit_card()
{
?>
    <div class="orbit-card">
        <div class="orbit-header">
            <span class="rocket-icon-conl">
                <i data-lucide="rocket" class="rocket-icon-conl"></i>
            </span>
            <h3>Orbit</h3>
        </div>
        <p class="orbit-desc">Empieza con claridad</p>
        <p class="orbit-subdesc">Auditoría inicial y puesta a punto. Ideal para diagnóstico y hoja de ruta antes de temporada.</p>

        <div class="orbit-features">
            <ul class="orbit-features-list">
                <li><i data-lucide="check-circle-2"></i> Consultoría estratégica</li>
                <li><i data-lucide="check-circle-2"></i> Auditoría PMS/OTAs</li>
                <li><i data-lucide="check-circle-2"></i> Reunión de entrega</li>
            </ul>
            <ul class="orbit-features-list">
                <li><i data-lucide="check-circle-2"></i> Mapeos de canales</li>
                <li><i data-lucide="check-circle-2"></i> Análisis de tarifas</li>
                <li><i data-lucide="check-circle-2"></i> Calendario demanda</li>
            </ul>
        </div>

        <a gloryAjaxNav href="/servicio-orbit" class="btn-orbit">Solicitar diagnóstico +</a>
    </div>
<?php
}

function services_revenue()
{
?>
    <section gloryDiv class="revenue-section">
        <div class="section-tag">
            <i data-lucide="sparkles"></i>
            <p class="section-tag-text">Gestión Mensual Recurrente</p>
        </div>
        <h2 gloryTexto class="section-title">Revenue Management</h2>
        <p gloryTexto class="section-subtitle">Programas adaptados a la madurez de tu alojamiento. Desde auditoría técnica hasta gestión 360.</p>

        <div class="services-revenue">
            <div class="services-revenue-grid">
                <?php render_marketing_card(
                    '<i data-lucide="sparkles"></i>',
                    'Galaxy',
                    'Gestión externa continua',
                    'Ejecución y seguimiento constante mensual. Sin ampliar tu estructura interna.',
                    ['Todo lo de ORBIT+', 'Control channel mix', 'Revisión de tarifas (3-5 x Semana)', 'Reporting mensual'],
                    'Consultar propuestas <i data-lucide="arrow-right"></i>',
                    'left',
                    '/servicio-galaxy'
                ); ?>
                <?php render_marketing_card(
                    '<i data-lucide="zap"></i>',
                    'Universe',
                    'Departamento 360',
                    'Partner completo anual. Para grupos o alojamientos que buscan excelencia total.',
                    ['Todo lo de GALAXY+', 'Estrategia de fidelización', 'Mapeos ilimitados', 'Formación de equipo'],
                    'Reunión estratégica <i data-lucide="arrow-right"></i>',
                    'right-bottom',
                    '/servicio-universe'
                ); ?>
            </div>
        </div>

        <div gloryDivSecundario class="services-revenue-bottom">
            <div gloryDivSecundario class="services-revenue-bottom-content">
                <h2 gloryTexto class="section-title-italic">¿Dudas sobre qué plan elegir?</h2>

                <p gloryTexto class="revenue-bottom-text">Hablemos. Analizaremos tu situación y te recomendamos la órbita adecuada para tu despegue.</p>
                <a gloryAjaxNav gloryButton class="btn-submit-revenue" href="/contacto">Contactar</a>
            </div>
        </div>

    </section>
<?php
}
?>