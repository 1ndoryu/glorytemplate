<?php

/**
 * Template base para páginas de servicios individuales
 * 
 * Cada servicio usa esta estructura:
 * - Hero con nombre del plan
 * - Descripción detallada
 * - Lista de características
 * - Formulario de contacto con servicio preseleccionado
 */

use App\Helpers\ContactForm;
use App\Helpers\PageHero;

/**
 * Datos de todos los planes de servicio
 */
function getServicePlans(): array
{
    return [
        // Marketing y Estrategia
        'comet' => [
            'category' => 'marketing',
            'categoryLabel' => 'Marketing y Estrategia',
            'name' => 'Comet',
            'tagline' => 'Impulso Inicial',
            'heroTitle' => 'Plan',
            'heroSubtitle' => 'COMET',
            'description' => 'Para alojamientos que quieren establecer una presencia profesional en redes sociales. El punto de partida perfecto para construir tu marca digital.',
            'longDescription' => 'Comet es nuestro programa de entrada para hoteles y alojamientos que dan sus primeros pasos en el marketing digital. Nos encargamos de establecer las bases de tu presencia online con una estrategia sostenible y profesional.',
            'features' => [
                'Auditoría completa de redes sociales',
                'Gestión profesional de 2 redes sociales',
                'Calendario de publicaciones semanales',
                'Creación de contenido visual',
                'Reporting mensual de métricas',
                'Soporte por email'
            ],
            'idealFor' => 'Alojamientos pequeños que inician su presencia digital',
            'icon' => 'rocket'
        ],
        'nebula' => [
            'category' => 'marketing',
            'categoryLabel' => 'Marketing y Estrategia',
            'name' => 'Nebula',
            'tagline' => 'Atracción y Nutrición',
            'heroTitle' => 'Plan',
            'heroSubtitle' => 'NEBULA',
            'description' => 'Para negocios que buscan atraer tráfico cualificado y convertir seguidores en reservas directas.',
            'longDescription' => 'Nebula expande tu alcance con publicidad pagada y estrategias de email marketing. Convertimos tu audiencia en huéspedes reales con campañas optimizadas y nurturing automatizado.',
            'features' => [
                'Todo lo incluido en Comet',
                'Campañas de anuncios en redes (Meta Ads)',
                'Estrategia de email marketing',
                'Automatizaciones de bienvenida y seguimiento',
                'Gestión activa de comunidad',
                'Respuesta a comentarios y mensajes',
                'Análisis de competencia mensual'
            ],
            'idealFor' => 'Hoteles medianos buscando aumentar reservas directas',
            'icon' => 'sparkles'
        ],
        'quasar' => [
            'category' => 'marketing',
            'categoryLabel' => 'Marketing y Estrategia',
            'name' => 'Quasar',
            'tagline' => 'Aceleración Total',
            'heroTitle' => 'Plan',
            'heroSubtitle' => 'QUASAR',
            'description' => 'Estrategia integral de comunicación y captación avanzada para maximizar tu visibilidad y conversiones.',
            'longDescription' => 'Quasar es nuestro programa premium de marketing. Combina todas las herramientas disponibles para crear una máquina de captación que trabaja 24/7 atrayendo huéspedes de alta calidad.',
            'features' => [
                'Todo lo incluido en Nebula',
                'Campañas de Google Hotel Ads',
                'Plan de comunicación anual',
                'Estrategia de contenidos premium',
                'Análisis de ROI mensual detallado',
                'Reuniones estratégicas quincenales',
                'Acceso prioritario a nuevas funcionalidades'
            ],
            'idealFor' => 'Hoteles y grupos que buscan liderazgo de mercado',
            'icon' => 'zap'
        ],

        // Consultoria y Mapeo
        'orbit' => [
            'category' => 'consultoria',
            'categoryLabel' => 'Consultoría y Mapeo',
            'name' => 'Orbit',
            'tagline' => 'Empieza con Claridad',
            'heroTitle' => 'Plan',
            'heroSubtitle' => 'ORBIT',
            'description' => 'Auditoría inicial y puesta a punto. Ideal para diagnóstico y hoja de ruta clara antes de temporada.',
            'longDescription' => 'Orbit es el primer paso para cualquier alojamiento que quiere profesionalizar su gestión de ingresos. Analizamos tu ecosistema tecnológico, limpiamos datos y te entregamos un plan de acción claro.',
            'features' => [
                'Consultoría estratégica personalizada',
                'Auditoría completa de PMS y OTAs',
                'Reunión de entrega con presentación',
                'Mapeos de canales de distribución',
                'Análisis de estructura de tarifas',
                'Calendario de demanda local',
                'Documento de recomendaciones'
            ],
            'idealFor' => 'Cualquier alojamiento antes de temporada alta',
            'icon' => 'compass'
        ],

        // Revenue Management
        'galaxy' => [
            'category' => 'revenue',
            'categoryLabel' => 'Revenue Management',
            'name' => 'Galaxy',
            'tagline' => 'Gestión Externa Continua',
            'heroTitle' => 'Plan',
            'heroSubtitle' => 'GALAXY',
            'description' => 'Ejecución y seguimiento constante mensual. Sin ampliar tu estructura interna.',
            'longDescription' => 'Galaxy es tu departamento de Revenue externalizado. Nos encargamos de la gestión diaria de tarifas, canales y estrategia para que te centres en la operación de tu hotel.',
            'features' => [
                'Todo lo incluido en Orbit',
                'Control activo de channel mix',
                'Revisión de tarifas 3-5 veces por semana',
                'Ajustes dinámicos según demanda',
                'Reporting mensual detallado',
                'Reuniones mensuales de seguimiento',
                'Soporte continuo por email y teléfono'
            ],
            'idealFor' => 'Hoteles sin Revenue Manager interno',
            'icon' => 'orbit'
        ],
        'universe' => [
            'category' => 'revenue',
            'categoryLabel' => 'Revenue Management',
            'name' => 'Universe',
            'tagline' => 'Departamento 360',
            'heroTitle' => 'Plan',
            'heroSubtitle' => 'UNIVERSE',
            'description' => 'Partner completo anual. Para grupos o alojamientos que buscan excelencia total en Revenue.',
            'longDescription' => 'Universe es nuestra solución más completa. Te acompañamos como partner estratégico a largo plazo, integrando Revenue, distribución y formación de tu equipo.',
            'features' => [
                'Todo lo incluido en Galaxy',
                'Estrategia de fidelización de huéspedes',
                'Mapeos ilimitados de canales',
                'Formación continua de tu equipo',
                'Reuniones estratégicas semanales',
                'Dashboard personalizado de KPIs',
                'Acceso a benchmarking del sector'
            ],
            'idealFor' => 'Grupos hoteleros y hoteles premium',
            'icon' => 'globe'
        ]
    ];
}

/**
 * Renderiza una página de servicio individual
 */
function renderServicePage(string $planKey): void
{
    $plans = getServicePlans();

    if (!isset($plans[$planKey])) {
        echo '<div class="error">Plan no encontrado</div>';
        return;
    }

    $plan = $plans[$planKey];
?>
    <div class="service-detail-container">
        <?php
        // Hero
        PageHero::render(
            $plan['heroTitle'],
            $plan['heroSubtitle'],
            $plan['description']
        );
        ?>

        <section gloryDiv class="service-detail-content">
            <!-- Bloque superior: Informacion del servicio -->
            <div gloryDivSecundario class="service-info-container">
                <div gloryDivSecundario class="service-info">
                    <div class="service-category-tag">
                        <span><?php echo $plan['categoryLabel']; ?></span>
                    </div>

                    <h2 gloryTexto class="service-detail-title"><?php echo $plan['name']; ?></h2>
                    <p gloryTexto class="service-detail-tagline"><?php echo $plan['tagline']; ?></p>

                    <div gloryTexto class="service-detail-description">
                        <p><?php echo $plan['longDescription']; ?></p>
                    </div>

                    <div class="service-features-section">
                        <h3 gloryTexto class="features-title">Qué incluye</h3>
                        <ul class="service-features-list">
                            <?php foreach ($plan['features'] as $feature): ?>
                                <li>
                                    <span class="feature-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                                            <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </span>
                                    <span><?php echo $feature; ?></span>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>

                    <div class="service-ideal-for">
                        <h4 gloryTexto>Ideal para:</h4>
                        <p gloryTexto><?php echo $plan['idealFor']; ?></p>
                    </div>
                </div>
            </div>

            <!-- Bloque inferior: Formulario de contacto -->
            <div gloryDivSecundario class="service-contact-wrapper">
                <?php
                // Formulario con servicio preseleccionado
                ContactForm::renderWithService(
                    'servicio-' . $planKey,
                    'Solicitar información sobre ' . $plan['name'],
                    $plan['name'] . ' - ' . $plan['categoryLabel']
                );
                ?>
            </div>
        </section>
    </div>
<?php
}

// Funciones de render para cada plan
function service_comet_render(): void
{
    renderServicePage('comet');
}
function service_nebula_render(): void
{
    renderServicePage('nebula');
}
function service_quasar_render(): void
{
    renderServicePage('quasar');
}
function service_orbit_render(): void
{
    renderServicePage('orbit');
}
function service_galaxy_render(): void
{
    renderServicePage('galaxy');
}
function service_universe_render(): void
{
    renderServicePage('universe');
}
