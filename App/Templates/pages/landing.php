<?php

function landing_render()
{
    // Cargar fuentes (temporal para testear)
    echo '<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Serif:ital@0;1&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">';
    
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
    ?>
    <script src="https://unpkg.com/lucide@latest"></script>
    <?php
}

function landing_hero() {
    ?>
    <section class="hero-section">

        <div class="hero-content">
            <h1 class="hero-title">
                Ordenamos el universo de tus <br>
                <span class="highlight-text">INGRESOS</span>
            </h1>
            
            <a href="#" class="btn-auditoria">
                <i data-lucide="sparkles" class="auditoria-icon"></i>
                Reservar auditoría
            </a>
        </div>

        <div class="hero-marquee">
            <span>ORDENAMOS EL UNIVERSO DE TUS INGRESOS</span>
            <span><i data-lucide="star"></i></span>
            <span>ORDENAMOS EL UNIVERSO DE TUS INGRESOS</span>
            <span><i data-lucide="star"></i></span>
            <span>ORDENAMOS EL UNIVERSO DE TUS INGRESOS</span>
            <span><i data-lucide="star"></i></span>
            <span>ORDENAMOS EL UNIVERSO DE TUS INGRESOS</span>
        </div>
    </section>
    <?php
}

function landing_services() {
    ?>
    <section class="services-section">
        <div class="section-header">
            <h2 class="section-title">Logra el máximo <br> potencial</h2>
            <p class="section-subtitle">En Cosmo Revenue diseñamos estrategias integrales para potenciar la rentabilidad de tu alojamiento.</p>
        </div>

        <div class="cards-grid">
            <div class="service-card card-dark">
                <div class="card-content">
                    <h3>Marketing y <br> estrategia</h3>
                </div>
                <div class="card-bg-image" style="background-image: url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80');"></div>
            </div>

            <div class="service-card card-light">
                <div class="card-content">
                    <h3>Revenue <br> Management</h3>
                </div>
                <div class="card-bg-image" style="background-image: url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80');"></div>
            </div>

            <div class="service-card card-dark">
                <div class="card-content">
                    <h3>Consultoría & <br> Mapeos</h3>
                </div>
                <div class="card-bg-image" style="background-image: url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=80');"></div>
            </div>
        </div>
    </section>
    <?php
}

function landing_cases() {
    ?>
    <section class="cases-section">
        <div class="section-header">
            <h2 class="section-title">Casos de éxito</h2>
            <p class="section-subtitle">Descubre el impacto real de nuestras estrategias y cómo transformamos la rentabilidad de hoteles como el tuyo.</p>
        </div>

        <div class="cases-grid">
            <!-- Case 1 -->
            <div class="case-card">
                <div class="case-image" style="background-image: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80');"></div>
                <div class="case-info">
                    <div class="case-meta">
                        <span>Villa de Lujo</span>
                        <span>Costa Valenciana</span>
                    </div>
                    <div class="case-stat">
                        <h4>250.000 €</h4>
                        <p>INCREMENTO VENTAS DIRECTAS</p>
                    </div>
                </div>
            </div>

            <!-- Case 2 -->
            <div class="case-card">
                <div class="case-image" style="background-image: url('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80');"></div>
                <div class="case-info">
                    <div class="case-meta">
                        <span>Hotel Vacacional</span>
                        <span>Costa Blanca</span>
                    </div>
                    <div class="case-stat">
                        <h4>+ 5% (70% ventas directas)</h4>
                        <p>INCREMENTO ANUAL</p>
                    </div>
                </div>
            </div>

            <!-- Case 3 -->
            <div class="case-card">
                <div class="case-image" style="background-image: url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&q=80');"></div>
                <div class="case-info">
                    <div class="case-meta">
                        <span>Hotel Boutique Urbano</span>
                        <span>Post-reforma</span>
                    </div>
                    <div class="case-stat">
                        <h4>+15% ADR</h4>
                        <p>EN LA PRIMERA FASE</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <?php
}

function landing_methodology() {
    ?>
    <section class="methodology-section">
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

        <div class="methodology-marquee">
            <span>TODO GIRA A FAVOR DE TU RENTABILIDAD</span>
            <span><i data-lucide="zap"></i></span>
            <span>TODO GIRA A FAVOR DE TU RENTABILIDAD</span>
            <span><i data-lucide="zap"></i></span>
            <span>TODO GIRA A FAVOR DE TU RENTABILIDAD</span>
            <span><i data-lucide="zap"></i></span>
            <span>TODO GIRA A FAVOR DE TU RENTABILIDAD</span>
        </div>
    </section>
    <?php
}

function landing_about() {
    ?>
    <section class="about-section">
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

        <div class="about-marquee">
            <span>ES EL MEJOR MOMENTO PARA DESPEGAR</span>
            <span><i data-lucide="rocket"></i></span>
            <span>ES EL MEJOR MOMENTO PARA DESPEGAR</span>
            <span><i data-lucide="rocket"></i></span>
            <span>ES EL MEJOR MOMENTO PARA DESPEGAR</span>
            <span><i data-lucide="rocket"></i></span>
            <span>ES EL MEJOR MOMENTO PARA DESPEGAR</span>
        </div>
    </section>
    <?php
}

function landing_contact() {
    ?>
    <section class="contact-section">
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
    </section>
    <?php
}

function landing_footer() {
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
    <script>
        lucide.createIcons();
    </script>
    <?php
}
