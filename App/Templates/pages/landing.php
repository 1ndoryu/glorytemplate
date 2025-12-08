<?php

use App\Helpers\Icons;
use App\Helpers\Marquee;

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
            <h1 gloryTexto class="hero-title">
                Ordenamos el universo de tus <br>
                <span class="highlight-text">femboy u.u</span>
            </h1>

            <a gloryButton href="#" class="btn-auditoria">
                <?php echo Icons::get('sparkles', 'auditoria-icon'); ?>
                Reservar auditoría
            </a>
        </div>

        <?php Marquee::echo('ORDENAMOS EL UNIVERSO DE TUS INGRESOS', 'dark', 'hero-marquee'); ?>
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

            <div gloryTarjeta class="service-card card-dark">
                <div gloryTexto class="card-content">
                    <h3>Marketing y <br> estrategia</h3>
                </div>
                <div class="card-bg-image" style="background-image: url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80');"></div>
            </div>

            <div gloryTarjeta class="service-card card-light">
                <div gloryTexto class="card-content">
                    <h3>Revenue <br> Management</h3>
                </div>
                <div class="card-bg-image" style="background-image: url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80');"></div>
            </div>

            <div gloryTarjeta class="service-card card-dark">
                <div gloryTexto class="card-content">
                    <h3>Consultoría & <br> Mapeos</h3>
                </div>
                <div class="card-bg-image" style="background-image: url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=80');"></div>
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
                                <span>Lectura del Mercado - Monitorizamos senales de demanda, eventos y elasticidad de precios en tiempo real.</span>
                            </div>
                        </div>
                        <div class="orbit-planet planet-m">
                            <p>M</p>
                            <div class="planet-tooltip">
                                <strong>Monetize</strong>
                                <span>Ejecucion de Ventas - Aplicamos reglas de precios, optimizamos canales y lanzamos campanas con ROI medible.</span>
                            </div>
                        </div>
                        <!-- Ultima O ahora dentro del anillo exterior para orbitar con S y M -->
                        <div class="orbit-planet planet-bottom-o">
                            <p>O</p>
                            <div class="planet-tooltip">
                                <strong>Optimize</strong>
                                <span>Mejora continua - Analizamos el post-mortem de cada accion para iterar con rapidez.</span>
                            </div>
                        </div>
                    </div>
                    <div class="orbit-ring ring-inner">
                        <div class="orbit-planet planet-o">
                            <p>O</p>
                            <div class="planet-tooltip">
                                <strong>Orchestrate</strong>
                                <span>Orquestacion de Procesos - Definimos KPIs criticos, cadencias de revision y asignamos responsables.</span>
                            </div>
                        </div>
                    </div>
                    <div class="orbit-ring ring-inner-2">
                        <div class="orbit-planet planet-c">
                            <p>C</p>
                            <div class="planet-tooltip">
                                <strong>Collect</strong>
                                <span>Recopilacion y Saneamiento - Unificamos tus fuentes de datos y normalizamos la informacion.</span>
                            </div>
                        </div>
                    </div>

                    <div class="orbit-center">
                        <div class="logo-icon"><i data-lucide="atom"></i></div>
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
        <div gloryDivSecundario class="about-container">
            <div gloryDivSecundario class="about-content">

                <div gloryDivSecundario class="about-image">
                    <img gloryImagen src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" alt="Perfil">
                </div>
                <h2 gloryTexto class="section-title">Sobre mi</h2>
                <p gloryTexto class="about-text">
                    Cosmo Revenue es una consultoría boutique de revenue y RevOps para hotelería, liderada por una profesional joven, independiente y cercana. Mi propósito es que los hoteles tomen decisiones de ingresos con claridad y confianza.
                </p>
                <a gloryButton href="#" class="btn-about">Leer más</a>
            </div>
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

            <form gloryForm opciones="formId: 'contacto', ajaxSubmit: true, honeypot: true" class="contact-form">
                <div gloryDivSecundario class="form-row">
                    <div gloryInput opciones="name: 'nombre', label: 'Nombre', type: 'text', required: true" class="form-group">
                        <label>Nombre</label>
                        <input type="text" name="nombre">
                    </div>
                    <div gloryInput opciones="name: 'email', label: 'Email', type: 'email', required: true" class="form-group">
                        <label>Email</label>
                        <input type="email" name="email">
                    </div>
                </div>
                <div gloryDivSecundario class="form-row">
                    <div gloryInput opciones="name: 'telefono', label: 'Teléfono', type: 'tel'" class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono">
                    </div>
                    <div gloryInput opciones="name: 'alojamiento', label: 'Alojamiento', type: 'text'" class="form-group">
                        <label>Alojamiento</label>
                        <input type="text" name="alojamiento">
                    </div>
                </div>
                <div gloryDivSecundario class="form-row">
                    <div gloryInput opciones="name: 'habitaciones', label: 'Nº habitaciones', type: 'text'" class="form-group">
                        <label>Nº habitaciones</label>
                        <input type="text" name="habitaciones">
                    </div>
                    <div gloryInput opciones="name: 'pms', label: 'PMS/Channel', type: 'text'" class="form-group">
                        <label>PMS/Channel</label>
                        <input type="text" name="pms">
                    </div>
                </div>
                <div gloryTextarea opciones="name: 'mensaje', label: 'Mensaje', rows: 4" class="form-group full-width">
                    <label>Mensaje</label>
                    <textarea name="mensaje" rows="1"></textarea>
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
