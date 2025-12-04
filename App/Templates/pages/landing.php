<?php


function landing_render()
{
   
    echo '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">';
    
    $fontHeading = "'Playfair Display', serif";
    $fontBody = "'Outfit', sans-serif";
    $colorBgDark = "#1a1a1a";
    $colorTextLight = "#ffffff";
    $colorTextMuted = "#a0a0a0";
    $colorAccent = "#d4e157";
    
    ?>

    <!-- Contenedor Principal de la Landing -->
    <div class="landing-container" style="font-family: <?php echo $fontBody; ?>; background-color: #f5f5f5; color: #333; margin: 0; padding: 0;">

        <!-- SECCIÓN 1: HERO (Inicio) -->
        <section class="hero-section" style="position: relative; height: 100vh; min-height: 700px; background: linear-gradient(180deg, rgba(212,225,87,0.3) 0%, rgba(212,225,87,0.8) 100%), url('https://www.transparenttextures.com/patterns/noise.png'); background-blend-mode: overlay; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;">
            
            <nav class="landing-nav" style="position: absolute; top: 0; left: 0; width: 100%; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
                <div class="logo" style="font-weight: 700; font-size: 1.2rem; letter-spacing: 1px; text-transform: uppercase; color: #fff; mix-blend-mode: difference;">COSMO REVENUE</div>
                <ul class="nav-links" style="list-style: none; display: flex; gap: 30px; margin: 0; padding: 0;">
                    <li><a href="#" style="text-decoration: none; color: #fff; font-size: 0.9rem; font-weight: 500; mix-blend-mode: difference;">Inicio</a></li>
                    <li><a href="#" style="text-decoration: none; color: #fff; font-size: 0.9rem; font-weight: 500; mix-blend-mode: difference;">Servicios</a></li>
                    <li><a href="#" style="text-decoration: none; color: #fff; font-size: 0.9rem; font-weight: 500; mix-blend-mode: difference;">Casos</a></li>
                    <li><a href="#" style="text-decoration: none; color: #fff; font-size: 0.9rem; font-weight: 500; mix-blend-mode: difference;">Nosotros</a></li>
                    <li><a href="#" class="btn-nav" style="text-decoration: none; font-size: 0.9rem; font-weight: 500; background: #000; color: #fff !important; padding: 8px 20px; border-radius: 20px; mix-blend-mode: normal !important;">Contacto</a></li>
                </ul>
            </nav>

            <div class="hero-content" style="z-index: 2; max-width: 800px;">
                <h1 class="hero-title" style="font-family: <?php echo $fontHeading; ?>; font-size: 4rem; line-height: 1.1; font-weight: 400; color: #fff; margin-bottom: 40px; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    Ordenamos el universo de tus <br>
                    <span class="highlight-text" style="font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">INGRESOS</span>
                </h1>
                
                <a href="#" class="btn-auditoria" style="display: inline-flex; align-items: center; gap: 10px; padding: 12px 30px; border: 1px solid #fff; border-radius: 30px; color: #fff; text-decoration: none; font-size: 0.9rem; backdrop-filter: blur(5px);">
                    Reservar auditoría
                    <span class="arrow">→</span>
                </a>
            </div>

            <!-- Marquee / Barra inferior del hero -->
            <div class="hero-marquee" style="position: absolute; bottom: 0; width: 100%; background: rgba(255,255,255,0.2); padding: 10px 0; overflow: hidden; white-space: nowrap; font-size: 1.5rem; color: #fff; text-transform: uppercase; letter-spacing: 2px; backdrop-filter: blur(5px);">
                <span>ORDENAMOS EL UNIVERSO DE TUS INGRESOS ✦ ORDENAMOS EL UNIVERSO DE TUS INGRESOS ✦ ORDENAMOS EL UNIVERSO DE TUS INGRESOS</span>
            </div>
        </section>

        <!-- SECCIÓN 2: SERVICIOS -->
        <section class="services-section" style="padding: 80px 20px; background-color: #f9f9f9; text-align: center;">
            <div class="section-header" style="margin-bottom: 60px; max-width: 600px; margin-left: auto; margin-right: auto;">
                <h2 class="section-title" style="font-family: <?php echo $fontHeading; ?>; font-size: 5rem; margin-bottom: 20px; color: #1a1a1a;">Logra el máximo <br> potencial</h2>
                <p class="section-subtitle" style="color: #666; line-height: 1.6;">En Cosmo Revenue diseñamos estrategias integrales para potenciar la rentabilidad de tu alojamiento.</p>
            </div>

            <div class="cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
                <div class="service-card card-dark" style="position: relative; height: 400px; border-radius: 20px; overflow: hidden; display: flex; align-items: flex-end; padding: 30px; text-align: left;">
                    <div class="card-content" style="position: relative; z-index: 2; width: 100%;">
                        <h3 style="font-family: <?php echo $fontHeading; ?>; font-size: 1.8rem; margin: 0; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Marketing y <br> estrategia</h3>
                    </div>
                    <div class="card-bg-image" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; z-index: 1; background-image: url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80');"></div>
                </div>

                <div class="service-card card-light" style="position: relative; height: 400px; border-radius: 20px; overflow: hidden; display: flex; align-items: flex-end; padding: 30px; text-align: left;">
                    <div class="card-content" style="position: relative; z-index: 2; width: 100%;">
                        <h3 style="font-family: <?php echo $fontHeading; ?>; font-size: 1.8rem; margin: 0; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Revenue <br> Management</h3>
                    </div>
                    <div class="card-bg-image" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; z-index: 1; background-image: url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80');"></div>
                </div>

                <div class="service-card card-dark" style="position: relative; height: 400px; border-radius: 20px; overflow: hidden; display: flex; align-items: flex-end; padding: 30px; text-align: left;">
                    <div class="card-content" style="position: relative; z-index: 2; width: 100%;">
                        <h3 style="font-family: <?php echo $fontHeading; ?>; font-size: 1.8rem; margin: 0; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Consultoría & <br> Mapeos</h3>
                    </div>
                    <div class="card-bg-image" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; z-index: 1; background-image: url('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=80');"></div>
                </div>
            </div>
        </section>

        <!-- SECCIÓN 3: CASOS DE ÉXITO -->
        <section class="cases-section" style="padding: 80px 20px; background-color: #f9f9f9; text-align: center;">
            <div class="section-header" style="margin-bottom: 60px; max-width: 600px; margin-left: auto; margin-right: auto;">
                <h2 class="section-title" style="font-family: <?php echo $fontHeading; ?>; font-size: 3rem; margin-bottom: 20px; color: #1a1a1a;">Casos de éxito</h2>
                <p class="section-subtitle" style="color: #666; line-height: 1.6;">Descubre el impacto real de nuestras estrategias y cómo transformamos la rentabilidad de hoteles como el tuyo.</p>
            </div>

            <div class="cases-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto;">
                <div class="case-card" style="background: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.05); text-align: left;">
                    <div class="case-image" style="height: 250px; background-size: cover; background-position: center; background-image: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80');"></div>
                    <div class="case-info" style="padding: 20px;">
                        <div class="case-meta" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #888; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">
                            <span>Villa de Lujo</span>
                            <span>Costa Valenciana</span>
                        </div>
                        <div class="case-stat">
                            <h4 style="font-family: <?php echo $fontHeading; ?>; font-size: 1.5rem; margin: 0 0 5px 0; color: #1a1a1a;">250.000 €</h4>
                            <p style="margin: 0; font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">INCREMENTO VENTAS DIRECTAS</p>
                        </div>
                    </div>
                </div>

                <div class="case-card" style="background: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.05); text-align: left;">
                    <div class="case-image" style="height: 250px; background-size: cover; background-position: center; background-image: url('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80');"></div>
                    <div class="case-info" style="padding: 20px;">
                        <div class="case-meta" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #888; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">
                            <span>Hotel Vacacional</span>
                            <span>Costa Blanca</span>
                        </div>
                        <div class="case-stat">
                            <h4 style="font-family: <?php echo $fontHeading; ?>; font-size: 1.5rem; margin: 0 0 5px 0; color: #1a1a1a;">+ 5% (70% ventas directas)</h4>
                            <p style="margin: 0; font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">INCREMENTO ANUAL</p>
                        </div>
                    </div>
                </div>

                <div class="case-card" style="background: #fff; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.05); text-align: left;">
                    <div class="case-image" style="height: 250px; background-size: cover; background-position: center; background-image: url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&q=80');"></div>
                    <div class="case-info" style="padding: 20px;">
                        <div class="case-meta" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #888; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">
                            <span>Hotel Boutique Urbano</span>
                            <span>Post-reforma</span>
                        </div>
                        <div class="case-stat">
                            <h4 style="font-family: <?php echo $fontHeading; ?>; font-size: 1.5rem; margin: 0 0 5px 0; color: #1a1a1a;">+15% ADR</h4>
                            <p style="margin: 0; font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">EN LA PRIMERA FASE</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    </div>

<?php
}
