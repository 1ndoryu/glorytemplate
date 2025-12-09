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
            <h1 gloryTexto class="hero-title">
                Ordenamos el universo de tus <br>
                <span class="highlight-text">INGRESOS</span>
            </h1>

            <a gloryAjaxNav gloryButton href="/contacto" class="btn-auditoria">
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
                            <p>Impulsa tu visibilidad y venta directa. Desde el lanzamiento hasta la consolidacion de tu posicionamiento digital.</p>
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
                        <div class="card-bg-image" style="background-image: url('<?php echo AssetsUtility::imagenUrl('tema::revenue.jpg'); ?>');"></div>
                    </div>
                    <div class="flip-card-back">
                        <div class="flip-back-content">
                            <p>Programas adaptados a la madurez de tu alojamiento. Desde auditoria tecnica hasta gestion 360.</p>
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
                            <p>Antes de correr, ordenamos el camino. Diagnostico, limpieza de datos y hoja de ruta clara antes de temporada.</p>
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
                        <div class="logo-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 325.47 325.47">
                                <path fill="currentColor" d="m207.36,202.38c-9.46,8.95-18.95,17.55-28.01,26.58-13.44,13.41-26.64,27.07-39.81,40.75-3.57,3.71-6.82,5.45-11.61,1.86-3.04-2.28-5.92-.66-8.38,1.85-7.1,7.27-14.22,14.52-21.42,21.69-4.3,4.28-6.52,4.21-10.96-.05-3.24-3.12-6.51-6.22-9.67-9.41-3.24-3.27-6.39-3.13-9.55.02-3.3,3.29-6.61,6.59-9.86,9.93-3.35,3.44-6.74,3.29-10.03.07-15.33-15.05-30.63-30.14-45.93-45.24-2.91-2.88-2.8-5.93-.01-8.78,15.11-15.51,30.24-31.01,45.42-46.46,3.13-3.19,6.38-3.05,9.57.17,2.93,2.96,5.97,5.8,8.97,8.69,5.28,5.1,7.36,5.12,12.47.06,2.6-2.58,5.14-5.22,7.74-7.81,4.52-4.52,7.08-4.49,11.74.14,3.9,3.87,7.75,7.8,11.69,11.63,6.24,6.06,8.58,5.85,14.3-1.64-2.66-2.71-5.36-5.55-8.16-8.29-20.35-19.93-40.7-39.86-61.11-59.73-3.1-3.02-3.83-6.03-1.25-9.7,2.45-3.49,1.51-6.39-1.47-9.23-7.34-7.02-14.53-14.21-21.74-21.38-4.02-4-4.01-6.61-.12-10.57,2.92-2.97,5.83-5.94,8.74-8.93,4.6-4.73,4.55-7.21-.13-11.69-3.01-2.88-5.94-5.84-8.91-8.76-3.16-3.1-3.5-6.35-.32-9.6,15.14-15.49,30.28-30.96,45.48-46.39,2.78-2.83,5.95-2.95,8.84-.12,15.59,15.26,31.17,30.55,46.68,45.89,3.12,3.08,2.34,6.38-.4,9.3-3.31,3.52-6.75,6.91-10.16,10.33-3.21,3.21-3.14,6.44-.02,9.61,2.8,2.85,5.67,5.64,8.57,8.39,5.27,5.01,5.32,7.58.11,12.86-3.74,3.79-7.51,7.57-11.27,11.35-5.96,6.01-5.73,8.63,2.02,14.42,4.12-4.29,8.3-8.73,12.57-13.09,18.18-18.56,36.42-37.07,54.54-55.69,3.41-3.5,6.61-4.63,10.89-1.51,3.43,2.49,6.26.63,8.78-1.94,6.99-7.14,13.96-14.3,21-21.39,4.27-4.3,6.67-4.3,10.94-.16,3.35,3.24,6.58,6.62,10.01,9.78,3.02,2.79,6.21,2.96,9.25-.12,3.39-3.44,6.75-6.91,10.19-10.3,3.16-3.11,6.29-3.18,9.57.04,15.08,14.84,30.24,29.59,45.31,44.43,4.02,3.96,4.02,6.62.06,10.67-14.69,15-29.41,29.95-44.18,44.87-3.78,3.81-6.37,3.77-10.26.09-3.38-3.21-6.62-6.57-10.04-9.75-3.66-3.41-6.35-3.4-9.97.1-3.11,3.01-5.98,6.27-9.05,9.32-4.11,4.1-6.82,4.13-11.09.02-4.2-4.04-8.23-8.26-12.4-12.33-6-5.86-8.59-5.55-13.51,1.12,7.16,7.49,14.12,15.08,21.42,22.32,15.48,15.37,31.13,30.59,46.75,45.82,3.25,3.17,4.65,6.36,1.59,10.5-2.47,3.34-1.14,6.18,1.55,8.8,7.16,6.97,14.25,14.02,21.35,21.05,4.58,4.53,4.65,6.76.32,11.28-3.11,3.25-6.26,6.46-9.36,9.72-3.21,3.37-3.38,6.59.24,9.91,3.43,3.15,6.67,6.52,9.97,9.81,3.02,3.01,3.09,6.33.2,9.28-15.24,15.62-30.54,31.18-45.92,46.66-2.58,2.6-5.65,2.65-8.43-.07-15.59-15.26-31.22-30.49-46.74-45.82-3-2.96-2.67-6.2.37-9.2,3.32-3.27,6.65-6.55,9.8-9.98,3.73-4.07,3.6-6.93-.26-10.77-2.95-2.94-5.99-5.79-8.96-8.71-3.89-3.81-3.99-6.72-.17-10.71,4.14-4.34,8.42-8.54,12.65-12.79,5.77-5.81,5.3-9.29-1.03-13.07Zm-45.13-71.49c-1.96,1.39-3.88,2.38-5.33,3.84-7.63,7.65-15.17,15.39-22.68,23.16-3.92,4.06-3.86,6.41.29,10.52,7.91,7.83,15.93,15.56,23.86,23.39,3.05,3.01,6.06,3.22,9.1.13,8.16-8.29,16.31-16.59,24.41-24.94,2.92-3.01,3-6.16-.09-9.17-8.21-8-16.4-16.04-24.69-23.96-1.24-1.19-2.99-1.84-4.86-2.96Z" />
                            </svg>
                        </div>
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

            <div gloryDivSecundario class="about-image">
                <img gloryImagen src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" alt="Perfil">
            </div>
            <h2 gloryTexto class="section-title">Sobre mi</h2>
            <p gloryTexto class="about-text">
                Cosmo Revenue es una consultoría boutique de revenue y RevOps para hotelería, liderada por una profesional joven, independiente y cercana. Mi propósito es que los hoteles tomen decisiones de ingresos con claridad y confianza.
            </p>
            <a gloryAjaxNav gloryButton href="/about" class="btn-about">Leer mas</a>
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
                data-success-message="Formulario enviado con exito!"
                data-error-message="Hubo un error al enviar el formulario."
                class="contact-form">
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
?>