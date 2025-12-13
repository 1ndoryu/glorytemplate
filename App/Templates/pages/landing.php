<?php

use App\Helpers\Icons;
use App\Helpers\Marquee;
use Glory\Utility\AssetsUtility;

function landing_render()
{
?>
    <div class="landing-container">
        <?php
        landing_hero();
        landing_services();
        landing_cases();
        landing_methodology();
        landing_about();
        landing_contact();
        ?>
    </div>

<?php
}

function landing_hero()
{
?>
    <section divGlory class="hero-section">

        <div gloryDivSecundario class="hero-content">
            <h1 gloryTexto class="hero-title" style="font-size: clamp(48px, 7.5vw, 152px); line-height: 0.9;">
                Ordenamos el universo de tus<br>
                <span class="highlight-text">INGRESOS</span>
            </h1>

            <a gloryAjaxNav gloryButton href="/contacto" class="btn-auditoria">
                <?php echo Icons::get('sparkles', 'auditoria-icon'); ?>
                Reservar auditoría
            </a>
        </div>

        <?php Marquee::echo('ESTRATEGIA, ANÁLISIS y RESULTADOS REALES', 'dark', 'hero-marquee'); ?>
    </section>
<?php
}

function landing_services()
{
?>
    <section gloryDiv class="services-section">
        <div gloryDivSecundario class="section-header">
            <h2 gloryTexto class="section-title">Logra el máximo <br> potencial</h2>
            <p gloryTexto class="section-subtitle">En Cosmo Revenue diseñamos estrategias integrales para potenciar la rentabilidad de tu alojamiento.</p>
        </div>

        <div gloryDivSecundario class="cards-grid">

            <!-- Marketing y Estrategia - Flip Card -->
            <div class="flip-card" onclick="this.classList.toggle('flipped')">
                <div class="flip-card-inner">
                    <div gloryTarjeta class="flip-card-front service-card card-dark">
                        <div gloryTexto class="card-content">
                            <h3>Marketing y <br>estrategia</h3>
                        </div>
                        <div class="card-bg-image" style="background-image: url('<?php echo AssetsUtility::imagenUrl('tema::marketing.jpg'); ?>');"></div>
                    </div>
                    <div class="flip-card-back">
                        <div class="flip-back-content">
                            <p>Impulsa tu visibilidad y venta directa. Desde el lanzamiento hasta la consolidación de tu posicionamiento digital.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Revenue Management - Flip Card -->
            <div class="flip-card" onclick="this.classList.toggle('flipped')">
                <div class="flip-card-inner">
                    <div gloryTarjeta class="flip-card-front service-card card-light">
                        <div gloryTexto class="card-content">
                            <h3>Revenue <br>Management</h3>
                        </div>
                        <div class="card-bg-image" style="background-image: url('<?php echo AssetsUtility::imagenUrl('tema::revenueNew.png'); ?>');"></div>
                    </div>
                    <div class="flip-card-back">
                        <div class="flip-back-content">
                            <p>Programas adaptados a la madurez de tu alojamiento. Desde auditoría técnica hasta gestión 360.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Consultoria & Mapeos - Flip Card -->
            <div class="flip-card" onclick="this.classList.toggle('flipped')">
                <div class="flip-card-inner">
                    <div gloryTarjeta class="flip-card-front service-card card-dark">
                        <div gloryTexto class="card-content">
                            <h3>Consultoria & <br>Mapeos</h3>
                        </div>
                        <div class="card-bg-image" style="background-image: url('<?php echo AssetsUtility::imagenUrl('tema::consultoria.jpg'); ?>');"></div>
                    </div>
                    <div class="flip-card-back">
                        <div class="flip-back-content">
                            <p>Antes de correr, ordenamos el camino. Diagnóstico, limpieza de datos y hoja de ruta clara antes de temporada.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </section>
<?php
}

function landing_cases()
{
?>
    <section gloryDiv class="cases-section">
        <div gloryDivSecundario class="cases-container">
            <div gloryTexto class="section-header">
                <h2 gloryTexto class="section-title">Casos de éxito</h2>
                <p gloryTexto class="section-subtitle">Descubre el impacto real de nuestras estrategias y cómo transformamos la rentabilidad de hoteles como el tuyo.</p>
            </div>

            <div gloryPostRender opciones="postType: 'casos', postsPerPage: 3, categoryFilter: false" class="cases-grid">
                <article gloryPostItem class="case-card">
                    <div class="case-meta">
                        <h3 gloryPostField="meta:caso_tipo" class="case-flotante"></h3>
                        <span gloryPostField="meta:caso_ubicacion" class="case-flotante"></span>
                    </div>
                    <div gloryPostField="featuredImage" opciones="asBackground: true" class="case-image">
                        <div class="case-stat">
                            <h4 gloryPostField="meta:caso_valor"></h4>
                            <p gloryPostField="meta:caso_descripcion"></p>
                        </div>
                    </div>
                </article>
            </div>

        </div>

        <?php Marquee::echo('RENTABILIDAD COMPROBADA CON DATOS REALES', 'light', 'cases-marquee'); ?>
    </section>
<?php
}

function landing_methodology()
{
?>
    <section gloryDiv class="methodology-section">
        <div gloryDivSecundario class="methodology-container">
            <div gloryDivSecundario class="section-header dark-header">
                <h2 gloryTexto class="section-title">Metodología Cosmo</h2>
                <p gloryTexto class="section-subtitle">Cada hotel es un sistema. Con COSMO alineamos datos, procesos y ejecución para que todo gire a favor del resultado.</p>
            </div>

            <div gloryDivSecundario class="methodology-graphic">
                <!-- Representacion simplificada del grafico orbital -->
                <div class="orbit-container">
                    <div class="orbit-ring ring-outer">
                        <div class="orbit-planet planet-s">
                            <p>S</p>
                            <div class="planet-tooltip">
                                <strong>Signal</strong>
                                <span>Lectura del Mercado - Monitorizamos señales de demanda, eventos y elasticidad de precios en tiempo real.</span>
                            </div>
                        </div>
                        <div class="orbit-planet planet-m">
                            <p>M</p>
                            <div class="planet-tooltip">
                                <strong>Monetize</strong>
                                <span>Ejecución de Ventas - Aplicamos reglas de precios, optimizamos canales y lanzamos campañas con ROI medible.</span>
                            </div>
                        </div>
                        <!-- Ultima O ahora dentro del anillo exterior para orbitar con S y M -->
                        <div class="orbit-planet planet-bottom-o">
                            <p>O</p>
                            <div class="planet-tooltip">
                                <strong>Optimize</strong>
                                <span>Mejora continua - Analizamos el post-mortem de cada acción para iterar con rapidez.</span>
                            </div>
                        </div>
                    </div>
                    <div class="orbit-ring ring-inner">
                        <div class="orbit-planet planet-o">
                            <p>O</p>
                            <div class="planet-tooltip">
                                <strong>Orchestrate</strong>
                                <span>Orquestación de Procesos - Definimos KPIs críticos, cadencias de revisión y asignamos responsables.</span>
                            </div>
                        </div>
                    </div>
                    <div class="orbit-ring ring-inner-2">
                        <div class="orbit-planet planet-c">
                            <p>C</p>
                            <div class="planet-tooltip">
                                <strong>Collect</strong>
                                <span>Recopilación y Saneamiento - Unificamos tus fuentes de datos y normalizamos la información.</span>
                            </div>
                        </div>
                    </div>

                    <div class="orbit-center">
                        <img src="<?php echo get_template_directory_uri(); ?>/App/Assets/images/logocuadradoblanco.png" class="" style="height: auto; width: auto; max-height: 80px;">
                    </div>
                </div>

            </div>
        </div>

        <?php Marquee::echo('TODO GIRA A FAVOR DE TU RENTABILIDAD', 'dark', 'methodology-marquee'); ?>
    </section>

    <script>
        // Script para pausar las orbitas y mostrar tooltips correctamente
        document.addEventListener('DOMContentLoaded', function() {
            const planets = document.querySelectorAll('.orbit-planet');
            const rings = document.querySelectorAll('.orbit-ring');

            planets.forEach(function(planet) {
                planet.addEventListener('mouseenter', function() {
                    // Pausar todos los anillos
                    rings.forEach(function(ring) {
                        ring.style.animationPlayState = 'paused';
                    });
                    // Pausar todos los planetas
                    planets.forEach(function(p) {
                        p.style.animationPlayState = 'paused';
                    });

                    // Elevar el z-index del anillo padre para que el tooltip aparezca por encima
                    var parentRing = planet.closest('.orbit-ring');
                    if (parentRing) {
                        parentRing.style.zIndex = '100';
                    }
                });

                planet.addEventListener('mouseleave', function() {
                    // Reanudar todos los anillos
                    rings.forEach(function(ring) {
                        ring.style.animationPlayState = 'running';
                    });
                    // Reanudar todos los planetas
                    planets.forEach(function(p) {
                        p.style.animationPlayState = 'running';
                    });

                    // Restaurar z-index originales de los anillos (invertidos)
                    var ringOuter = document.querySelector('.ring-outer');
                    var ringInner = document.querySelector('.ring-inner');
                    var ringInner2 = document.querySelector('.ring-inner-2');
                    if (ringOuter) ringOuter.style.zIndex = '1';
                    if (ringInner) ringInner.style.zIndex = '2';
                    if (ringInner2) ringInner2.style.zIndex = '3';
                });
            });
        });
    </script>
<?php
}

function landing_about()
{
?>
    <section gloryDiv class="about-section">

        <div gloryDivSecundario class="about-content">

            <div class="orbit-center-about" style="background-color: #141414; border-radius: 500px; padding: 30px;">
                <img src="<?php echo get_template_directory_uri(); ?>/App/Assets/images/logocuadradoblanco.png" class="" style="height: auto; width: auto; max-height: 80px;">
            </div>
            <h2 gloryTexto class="section-title">Sobre nosotros</h2>
            <p gloryTexto class="about-text">
                En Cosmo Revenue somos una consultoría boutique especializada en revenue management y RevOps para la industria hotelera. Nos dedicamos a brindar soluciones personalizadas, fundamentadas en datos reales y en un enfoque cercano y de confianza con nuestros clientes.
            </p>
            <a gloryAjaxNav gloryButton href="/about" class="btn-about">Leer más</a>
        </div>

        <?php Marquee::echo('ES EL MEJOR MOMENTO PARA DESPEGAR', 'light', 'about-marquee'); ?>
    </section>
<?php
}

function landing_contact()
{
?>
    <section gloryDiv class="contact-section">
        <div gloryDivSecundario class="contact-container">
            <div gloryDivSecundario class="section-header">
                <h2 gloryTexto class="section-title">Contacto</h2>
            </div>

            <form gloryForm
                data-ajax-submit="true"
                data-form-id="contacto"
                data-success-message="Formulario enviado con éxito!"
                data-error-message="Hubo un error al enviar el formulario."
                class="contact-form">
                <div gloryDivSecundario class="form-row">
                    <div gloryInput opciones="name: 'nombre', label: 'Nombre', type: 'text', required: true" class="form-group">
                        <label for="contact-nombre">Nombre</label>
                        <input type="text" name="nombre" id="contact-nombre">
                    </div>
                    <div gloryInput opciones="name: 'email', label: 'Email', type: 'email', required: true" class="form-group">
                        <label for="contact-email">Email</label>
                        <input type="email" name="email" id="contact-email">
                    </div>
                </div>
                <div gloryDivSecundario class="form-row">
                    <div gloryInput opciones="name: 'telefono', label: 'Telefono', type: 'tel'" class="form-group">
                        <label for="contact-telefono">Telefono</label>
                        <input type="tel" name="telefono" id="contact-telefono">
                    </div>
                    <div gloryInput opciones="name: 'alojamiento', label: 'Alojamiento', type: 'text'" class="form-group">
                        <label for="contact-alojamiento">Alojamiento</label>
                        <input type="text" name="alojamiento" id="contact-alojamiento">
                    </div>
                </div>
                <div gloryDivSecundario class="form-row">
                    <div gloryInput opciones="name: 'habitaciones', label: 'N habitaciones', type: 'text'" class="form-group">
                        <label for="contact-habitaciones">N habitaciones</label>
                        <input type="text" name="habitaciones" id="contact-habitaciones">
                    </div>
                    <div gloryInput opciones="name: 'pms', label: 'PMS/Channel', type: 'text'" class="form-group">
                        <label for="contact-pms">PMS/Channel</label>
                        <input type="text" name="pms" id="contact-pms">
                    </div>
                </div>
                <div gloryTextarea opciones="name: 'mensaje', label: 'Mensaje', rows: 4" class="form-group full-width">
                    <label for="contact-mensaje">Mensaje</label>
                    <textarea name="mensaje" id="contact-mensaje" rows="1"></textarea>
                </div>

                <div gloryDivSecundario class="form-footer">
                    <label class="checkbox-label">
                        <input type="checkbox" name="privacy" required>
                        He leído y acepto la Política de Privacidad.
                    </label>
                    <button glorySubmit opciones="texto: 'Enviar', loadingText: 'Enviando...'" type="submit" class="btn-submit">Enviar</button>
                </div>
            </form>
        </div>
    </section>
<?php
}
?>