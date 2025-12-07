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
        landing_footer();


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
    <section divGlory class="services-section">
        <div gloryDivSecundario class="section-header">
            <h2 gloryTexto class="section-title">Logra el máximo <br> potencial</h2>
            <p gloryTexto class="section-subtitle">En Cosmo Revenue diseñamos estrategias integrales para potenciar la rentabilidad de tu alojamiento.</p>
        </div>

        <div gloryPostRender opciones="postType: 'casos', postsPerPage: 3, categoryFilter: false" class="cases-grid">
            <article gloryPostItem class="case-card">
                <div class="case-meta">
                    <h3 gloryPostField="meta:caso_tipo"></h3>
                    <span gloryPostField="meta:caso_ubicacion"></span>
                </div>
                <div gloryPostField="featuredImage" opciones="asBackground: true" class="case-image">
                    <div class="case-stat">
                        <h4 gloryPostField="meta:caso_valor"></h4>
                        <p gloryPostField="meta:caso_descripcion"></p>
                    </div>
                </div>
            </article>
        </div>
    </section>
<?php
}

function landing_cases()
{
?>
    <section class="cases-section">
        <div class="cases-container">
            <div class="section-header">
                <h2 class="section-title">Casos de éxito</h2>
                <p class="section-subtitle">Descubre el impacto real de nuestras estrategias y cómo transformamos la rentabilidad de hoteles como el tuyo.</p>
            </div>

        </div>

        <?php Marquee::echo('RENTABILIDAD COMPROBADA CON DATOS REALES', 'light', 'cases-marquee'); ?>
    </section>
<?php
}

function landing_methodology()
{
?>
    <section class="methodology-section">
        <div class="methodology-container">
            <div class="section-header dark-header">
                <h2 class="section-title">Metodología Cosmo</h2>
                <p class="section-subtitle">Cada hotel es un sistema. Con COSMO alineamos datos, procesos y ejecución para que todo gire a favor del resultado.</p>
            </div>

            <div class="methodology-graphic">
                <!-- Representación simplificada del gráfico orbital -->
                <div class="orbit-container">
                    <div class="orbit-ring ring-outer">
                        <div class="orbit-planet planet-s">
                            <p>S</p>
                        </div>
                        <div class="orbit-planet planet-m">
                            <p>M</p>
                        </div>
                    </div>
                    <div class="orbit-ring ring-inner">
                        <div class="orbit-planet planet-o">
                            <p>O</p>
                        </div>
                    </div>
                    <div class="orbit-ring ring-inner-2">
                        <div class="orbit-planet planet-c">
                            <p>C</p>
                        </div>
                    </div>

                    <div class="orbit-center">
                        <div class="logo-icon"><i data-lucide="atom"></i></div>
                    </div>
                    <div class="orbit-planet planet-bottom-o">
                        <p>O</p>
                    </div>
                </div>

            </div>
        </div>

        <?php Marquee::echo('TODO GIRA A FAVOR DE TU RENTABILIDAD', 'dark', 'methodology-marquee'); ?>
    </section>
<?php
}

function landing_about()
{
?>
    <section class="about-section">
        <div class="about-container">
            <div class="about-content">

                <div class="about-image">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" alt="Perfil">
                </div>
                <h2 class="section-title">Sobre mi</h2>
                <p class="about-text">
                    Cosmo Revenue es una consultoría boutique de revenue y RevOps para hotelería, liderada por una profesional joven, independiente y cercana. Mi propósito es que los hoteles tomen decisiones de ingresos con claridad y confianza.
                </p>
                <a href="#" class="btn-about">Leer más</a>
            </div>
        </div>

        <?php Marquee::echo('ES EL MEJOR MOMENTO PARA DESPEGAR', 'light', 'about-marquee'); ?>
    </section>
<?php
}

function landing_contact()
{
?>
    <section class="contact-section">
        <div class="contact-container">
            <div class="section-header">
                <h2 class="section-title">Contacto</h2>
            </div>

            <form class="contact-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" name="nombre">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono">
                    </div>
                    <div class="form-group">
                        <label>Alojamiento</label>
                        <input type="text" name="alojamiento">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nº habitaciones</label>
                        <input type="text" name="habitaciones">
                    </div>
                    <div class="form-group">
                        <label>PMS/Channel</label>
                        <input type="text" name="pms">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>Mensaje</label>
                    <textarea name="mensaje" rows="1"></textarea>
                </div>

                <div class="form-footer">
                    <label class="checkbox-label">
                        <input type="checkbox" name="privacy">
                        He leído y acepto la Política de Privacidad.
                    </label>
                    <button type="submit" class="btn-submit">Enviar</button>
                </div>
            </form>
        </div>
    </section>
<?php
}

function landing_footer()
{
?>
    <footer class="landing-footer">
        <div class="footer-content">
            <div class="footer-brand">
                <div class="logo">COSMO REVENUE</div>
                <ul class="footer-nav">
                    <li><a href="#">Inicio</a></li>
                    <li><a href="#">Servicios</a></li>
                    <li><a href="#">Nosotros</a></li>
                    <li><a href="#">Casos</a></li>
                    <li><a href="#">Contacto</a></li>
                </ul>
            </div>

            <div class="footer-info">
                <div class="info-col">
                    <h4>Contacto</h4>
                    <p>hello@test.com</p>
                    <p>+20 00 000 00</p>
                </div>
                <div class="info-col">
                    <h4>Contacto</h4>
                    <p>Lunes a Domingo</p>
                    <p>08:00 AM - 10:00 PM</p>
                </div>
            </div>
        </div>

        <div class="footer-bottom">
            <p>© 2025 Cosmo All rights reserved.</p>
            <div class="social-icons">
                <a href="#"><i data-lucide="x"></i></a>
                <a href="#"><i data-lucide="facebook"></i></a>
                <a href="#"><i data-lucide="instagram"></i></a>
                <a href="#"><i data-lucide="linkedin"></i></a>
            </div>
        </div>
    </footer>
<?php
}
