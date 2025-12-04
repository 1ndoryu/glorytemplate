<?php

function contructor()
{
   $opciones = "plantilla: 'plantillaPosts'";
?>
    <!-- Fuentes: Orbitron para títulos tech/racing, Inter para lectura -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Orbitron:wght@500;700;900&display=swap" rel="stylesheet">
    
    <!-- Iconos Lucide -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        :root {
            --color-bg: #0a0a0a;
            --color-bg-card: #151515;
            --color-text: #e5e5e5;
            --color-text-muted: #9ca3af;
            --color-red: #ef4444; /* Rojo vibrante */
            --color-red-dark: #b91c1c;
            --font-main: 'Inter', sans-serif;
            --font-racing: 'Orbitron', sans-serif;
            font-size: 12px; /* Base para REM */
        }

        /* Reset Básico */
        /* * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        } */ /* Comentado para no afectar el resto del sitio si se carga globalmente, aunque en este scope está bien */

        .supra-container {
            font-family: var(--font-main);
            background-color: var(--color-bg);
            color: var(--color-text);
            overflow-x: hidden;
            line-height: 1.5;
        }

        /* Tipografía */
        .supra-container h1, .supra-container h2, .supra-container h3, .fontRacing {
            font-family: var(--font-racing);
            text-transform: uppercase;
        }

        .supra-container a { text-decoration: none; color: inherit; }
        .supra-container button { border: none; background: none; cursor: pointer; font-family: inherit; }

        /* Utilidades de Layout */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .textCenter { text-align: center; }
        .textGradient {
            background: linear-gradient(to right, var(--color-red), var(--color-red-dark));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .textGlow {
            text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }

        /* Animaciones */
        .fadeInSection {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        
        .fadeInSection.isVisible {
            opacity: 1;
            transform: none;
        }

        /* --- HERO SECTION --- */
        .heroSection {
            position: relative;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .hero-bg-supra {
            background-image: url('https://images.unsplash.com/photo-1603811478698-0b1d6256f79a?q=80&w=1470');
            background-size: cover;
            background-position: center center;
            background-attachment: fixed;
            height: 100vh;
            width: 100%;
        }

        .heroBackground {
            position: absolute;
            inset: 0;
            z-index: 0;
        }

        .heroBackground img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.6;
        }

        .heroOverlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, var(--color-bg), rgba(0,0,0,0.4), rgba(0,0,0,0.6));
        }

        .heroContent {
            position: relative;
            z-index: 10;
            text-align: center;
            max-width: 900px;
            margin-top: 40px;
        }

        .badgeEst {
            display: inline-block;
            padding: 4px 16px;
            border-radius: 50px;
            border: 1px solid rgba(239, 68, 68, 0.5);
            background: rgba(239, 68, 68, 0.1);
            color: #f87171;
            font-family: monospace;
            font-size: 0.875rem;
            letter-spacing: 0.1em;
            backdrop-filter: blur(4px);
            width: fit-content;
            margin: auto;
            margin-bottom: 1rem;
        }

        .heroTitle {
            font-size: 4rem;
            font-weight: 900;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            letter-spacing: -2px;
            color: white;
        }

        .heroSubtitle {
            font-size: 1.25rem;
            color: #d1d5db;
            margin-bottom: 2.5rem;
            font-weight: 300;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
        }

        /* Botones Estilo Racing */
        .btnGroup {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: nowrap;
            align-content: center;
            align-items: center;
            flex-direction: row;
        }
        
        .btnRacing {
            position: relative;
            padding: 1rem 2rem;
            font-weight: bold;
            font-size: 1rem;
            transform: skewX(-10deg);
            transition: all 0.3s ease;
            overflow: hidden;
        }

        .btnRacing span {
            display: inline-block;
            transform: skewX(10deg); /* Contrarrestar la inclinación para el texto */
        }

        .btnPrimary {
            background-color: white;
            color: black;
        }
        
        .btnPrimary:hover {
            background-color: #e5e5e5;
        }

        .btnSecondary {
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            backdrop-filter: blur(4px);
        }

        .btnSecondary:hover {
            background-color: rgba(255,255,255,0.1);
        }

        .scrollIndicator {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255,255,255,0.5);
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, 10px); }
        }

        /* --- SPECS SECTION --- */
        .specsSection {
            padding: 6rem 0;
            position: relative;
            background-color: #0f0f0f;
        }

        .specsBackgroundEffect {
            position: absolute;
            top: 0;
            right: 0;
            width: 33%;
            height: 100%;
            background: linear-gradient(to left, rgba(127, 29, 29, 0.1), transparent);
            pointer-events: none;
        }

        .sectionHeader {
            text-align: center;
            margin-bottom: 4rem;
        }

        .sectionTitle {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: white;
        }

        .titleUnderline {
            height: 4px;
            width: 100px;
            background-color: var(--color-red);
            margin: 0 auto;
        }

        .tabContainer {
            display: flex;
            justify-content: center;
            margin-bottom: 3rem;
        }

        .tabWrapper {
            background-color: #111827;
            padding: 4px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            display: inline-flex;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .tabButton {
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 700;
            transition: all 0.3s ease;
            color: var(--color-text-muted);
        }

        .tabButton.active {
            background-color: var(--color-red);
            color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .tabButton:hover:not(.active) {
            color: white;
        }

        /* Grid de contenido */
        .specsGrid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 3rem;
            align-items: center;
        }

        @media (min-width: 768px) {
            .specsGrid {
                grid-template-columns: 1fr 1fr;
            }
            .heroTitle { font-size: 5rem; }
        }

        .carImageWrapper {
            position: relative;
        }

        .carImageGlow {
            position: absolute;
            inset: 0;
            background-color: var(--color-red);
            border-radius: 1rem;
            filter: blur(40px);
            opacity: 0.2;
            transition: opacity 0.5s;
        }

        .carImageWrapper:hover .carImageGlow {
            opacity: 0.3;
        }

        .mainCarImage {
            width: 100%;
            height: 400px;
            object-fit: cover;
            border-radius: 1rem;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transition: transform 0.7s ease;
        }

        .carImageWrapper:hover .mainCarImage {
            transform: scale(1.02);
        }

        .floatingBadge {
            position: absolute;
            bottom: -20px;
            right: -20px;
            background-color: black;
            border: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }

        .specsDataGrid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 2rem;
        }

        .specCard {
            background-color: var(--color-bg-card);
            padding: 1rem;
            border-radius: 0.5rem;
            border-left: 4px solid var(--color-red);
        }

        .specLabel {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            color: var(--color-text-muted);
        }

        .specValue {
            font-size: 1.5rem;
            font-weight: 700;
            color: white;
        }

        /* --- LEGACY SECTION --- */
        .legacySection {
            padding: 6rem 0;
            background-color: black;
            overflow: hidden;
        }

        .bentoGrid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        @media (min-width: 768px) {
            .bentoGrid {
                grid-template-columns: repeat(12, 1fr);
                height: 600px;
            }
            .bentoLarge { grid-column: span 8; height: 100%; }
            .bentoSmallTop { grid-column: span 4; height: 48%; }
            .bentoSmallBottom { grid-column: span 4; height: 48%; align-self: end; }
        }

        .bentoItem {
            position: relative;
            border-radius: 1rem;
            overflow: hidden;
            background-color: #111;
            border: 1px solid rgba(255,255,255,0.05);
        }

        .bentoItem img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.7s ease;
        }

        .bentoItem:hover img {
            transform: scale(1.1);
        }

        .bentoOverlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, black, transparent);
            opacity: 0.9;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 2rem;
        }

        .bentoText {
            padding: 2rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
        }

        /* --- FOOTER --- */
        .footer {
            padding: 5rem 0;
            background-color: #050505;
            border-top: 1px solid rgba(255,255,255,0.1);
            text-align: center;
        }

        .footerForm {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-width: 450px;
            margin: 0 auto;
        }

        @media (min-width: 640px) {
            .footerForm { flex-direction: row; }
        }

        .inputEmail {
            flex: 1;
            background-color: #1a1a1a;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            color: white;
            outline: none;
            transition: border-color 0.3s;
        }

        .inputEmail:focus {
            border-color: var(--color-red);
        }

        .btnSubmit {
            background-color: var(--color-red);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 700;
            transition: background-color 0.3s;
        }

        .btnSubmit:hover {
            background-color: var(--color-red-dark);
        }

        .socialLinks {
            margin-top: 4rem;
            display: flex;
            justify-content: center;
            gap: 1.5rem;
            color: var(--color-text-muted);
        }
        
        .socialLinks a:hover { color: white; }

        /* Estilo para iconos dentro de labels */
        .iconRed { color: var(--color-red); width: 20px; height: 20px; }
    </style>

    <div class="supra-container">
        <!-- Hero Section -->
        <div gloryDiv id="inicio" class="heroSection hero-bg-supra">
            <div class="heroOverlay"></div>

            <div gloryDivSecundario class="heroContent">
                <div gloryDivSecundario class="badgeEst fadeInSection">
                    EST. 1978
                </div>
                <h1 class="heroTitle textGlow fadeInSection" style="transition-delay: 100ms;">
                    LA LEYENDA <br/><span class="textGradient">RENACE</span>
                </h1>
                <p class="heroSubtitle fadeInSection" style="transition-delay: 200ms;">
                    Más que un coche, es una declaración de intenciones. Desde el icónico MK4 hasta la ingeniería de precisión del MK5.
                </p>
                <div gloryDivSecundario class="btnGroup fadeInSection" style="transition-delay: 300ms;">
                    <button onclick="explorarModelo()" class="btnRacing btnPrimary">
                        <span>EXPLORAR AHORA</span>
                    </button>
                    <button class="btnRacing btnSecondary">
                        <span>VER GALERÍA</span>
                    </button>
                </div>
            </div>
            
            <div class="scrollIndicator">
                <i data-lucide="chevron-down" style="width: 32px; height: 32px;"></i>
            </div>
        </div>

        <!-- Comparador Interactivo -->
        <div gloryDiv id="especificaciones" class="specsSection">
            <div class="specsBackgroundEffect"></div>
            
            <div gloryDivSecundario class="container relative z-10">
                <div gloryDivSecundario class="sectionHeader fadeInSection">
                    <h2 class="sectionTitle">DUELO DE TITANES</h2>
                    <div class="titleUnderline"></div>
                    <p style="margin-top: 1rem; color: var(--color-text-muted);">Selecciona tu generación favorita para ver los detalles técnicos.</p>
                </div>

                <!-- Controles de Pestañas -->
                <div gloryDivSecundario class="tabContainer fadeInSection">
                    <div class="tabWrapper">
                        <button id="botonMk4" onclick="cambiarGeneracion('mk4')" class="tabButton active">
                            MK4 (1993-2002)
                        </button>
                        <button id="botonMk5" onclick="cambiarGeneracion('mk5')" class="tabButton">
                            MK5 (2019-Presente)
                        </button>
                    </div>
                </div>

                <!-- Contenido Dinámico -->
                <div gloryDivSecundario class="specsGrid">
                    <!-- Imagen del Coche -->
                    <div class="carImageWrapper fadeInSection">
                        <div class="carImageGlow"></div>
                        <img 
                            id="imagenCoche"
                            src="https://d1gl66oyi6i593.cloudfront.net/wp-content/uploads/2020/03/toyota-supra-1995-1-1200x799.jpg" 
                            alt="Toyota Supra" 
                            class="mainCarImage"
                        >
                        
                        <div class="floatingBadge">
                            <p style="color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Motor Code</p>
                            <p id="codigoMotor" class="fontRacing" style="font-size: 1.875rem; font-weight: 700; color: white;">2JZ-GTE</p>
                        </div>
                    </div>

                    <!-- Datos Técnicos -->
                    <div class="fadeInSection" id="panelDatos">
                        <div>
                            <h3 id="tituloGeneracion" class="fontRacing" style="font-size: 1.875rem; font-weight: 700; color: white; margin-bottom: 0.5rem;">The Street King</h3>
                            <p id="descripcionGeneracion" style="color: var(--color-text-muted); line-height: 1.6;">
                                Famoso por su durabilidad infinita y su aparición en la cultura pop. El bloque de hierro fundido capaz de soportar 1000HP con componentes internos de fábrica.
                            </p>
                        </div>

                        <div class="specsDataGrid">
                            <div class="specCard">
                                <div class="specLabel">
                                    <i data-lucide="gauge" class="iconRed"></i>
                                    <span>Potencia (Stock)</span>
                                </div>
                                <span id="datoPotencia" class="specValue">320 HP</span>
                            </div>
                            <div class="specCard">
                                <div class="specLabel">
                                    <i data-lucide="timer" class="iconRed"></i>
                                    <span>0-100 km/h</span>
                                </div>
                                <span id="datoAceleracion" class="specValue">4.6 s</span>
                            </div>
                            <div class="specCard">
                                <div class="specLabel">
                                    <i data-lucide="settings" class="iconRed"></i>
                                    <span>Transmisión</span>
                                </div>
                                <span id="datoTransmision" class="specValue">6-Speed Manual</span>
                            </div>
                            <div class="specCard">
                                <div class="specLabel">
                                    <i data-lucide="scale" class="iconRed"></i>
                                    <span>Peso</span>
                                </div>
                                <span id="datoPeso" class="specValue">1,510 kg</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sección de Diseño -->
        <div gloryDiv id="legado" class="legacySection">
            <div gloryDivSecundario class="container bentoGrid">
                
                <!-- Item Grande -->
                <div gloryDivSecundario class="bentoItem bentoLarge fadeInSection">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/20_Toyota_GR_Supra_3.0_%281%29.jpg/1200px-20_Toyota_GR_Supra_3.0_%281%29.jpg" alt="Supra Rear">
                    <div class="bentoOverlay">
                        <h3 class="fontRacing" style="font-size: 1.875rem; color: white; margin-bottom: 0.5rem;">DISEÑO ATEMPORAL</h3>
                        <p style="color: #d1d5db; max-width: 28rem;">Líneas agresivas que cortan el viento. Un alerón que definió una era.</p>
                    </div>
                </div>

                <!-- Item Pequeño Superior -->
                <div gloryDivSecundario class="bentoItem bentoSmallTop fadeInSection" style="transition-delay: 100ms;">
                    <div class="bentoText">
                        <i data-lucide="wind" style="width: 40px; height: 40px; color: var(--color-red); margin-bottom: 1rem;"></i>
                        <h4 style="font-size: 1.25rem; font-weight: 700; color: white; margin-bottom: 0.5rem;">Aerodinámica Activa</h4>
                        <p style="color: var(--color-text-muted); font-size: 0.875rem;">Cada curva tiene un propósito. Flujo de aire optimizado para mantener el coche pegado al asfalto.</p>
                    </div>
                </div>

                <!-- Item Pequeño Inferior -->
                <div gloryDivSecundario class="bentoItem bentoSmallBottom fadeInSection" style="transition-delay: 200ms;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/bf/MKIV_Cockpit.JPG" alt="Interior">
                    <div class="bentoOverlay">
                        <h4 style="font-size: 1.25rem; font-weight: 700; color: white;">Cockpit de Piloto</h4>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div gloryDiv id="contacto" class="footer">
            <div gloryDivSecundario class="container">
                <h2 class="fontRacing" style="font-size: 2.5rem; color: white; margin-bottom: 1.5rem;">¿LISTO PARA CONDUCIR?</h2>
                <p style="color: var(--color-text-muted); margin-bottom: 2.5rem; max-width: 32rem; margin-left: auto; margin-right: auto;">
                    No dejes que te lo cuenten. Experimenta la ingeniería japonesa en su máxima expresión.
                </p>
                
                <form class="footerForm" onsubmit="event.preventDefault(); alert('¡Gracias por unirte! Te enviaremos novedades pronto.');">
                    <input type="email" placeholder="Tu correo electrónico" class="inputEmail">
                    <button type="submit" class="btnSubmit">
                        SUSCRIBIRSE
                    </button>
                </form>

                <div gloryDivSecundario class="socialLinks">
                    <a href="#"><i data-lucide="instagram"></i></a>
                    <a href="#"><i data-lucide="twitter"></i></a>
                    <a href="#"><i data-lucide="youtube"></i></a>
                </div>
                
                <p style="margin-top: 2rem; font-size: 0.75rem; color: #525252;">
                    &copy; 2024 Proyecto Fan Supra. Hecho con pasión. Las imágenes son propiedad de sus respectivos dueños.
                </p>
            </div>
        </div>
    </div>

    <!-- Lógica JavaScript -->
    <script>
        // Inicializar Iconos
        lucide.createIcons();

        // Datos del Coche
        const datosSupra = {
            mk4: {
                motor: "2JZ-GTE",
                titulo: "The Street King",
                desc: "Famoso por su durabilidad infinita y su aparición en la cultura pop. El bloque de hierro fundido capaz de soportar 1000HP con componentes internos.",
                hp: "320 HP",
                aceleracion: "4.6 s",
                transmision: "6-Speed Manual",
                peso: "1,510 kg",
                img: "https://d1gl66oyi6i593.cloudfront.net/wp-content/uploads/2020/03/toyota-supra-1995-1-1200x799.jpg"
            },
            mk5: {
                motor: "B58 Inline-6",
                titulo: "Precision Engineering",
                desc: "El renacimiento. Desarrollado en conjunto con BMW, ofrece un chasis perfectamente equilibrado 50:50 y tecnología moderna de turbocompresor twin-scroll.",
                hp: "382 HP",
                aceleracion: "3.9 s",
                transmision: "8-Speed Auto / 6MT",
                peso: "1,540 kg",
                img: "https://upload.wikimedia.org/wikipedia/commons/7/73/2023_Toyota_Supra_%282%29.jpg"
            }
        };

        // Función para cambiar de generación (Adaptada para usar Clases CSS en lugar de Tailwind)
        function cambiarGeneracion(modelo) {
            const data = datosSupra[modelo];
            
            // Referencias DOM
            const btnMk4 = document.getElementById('botonMk4');
            const btnMk5 = document.getElementById('botonMk5');
            const imagen = document.getElementById('imagenCoche');
            
            // Actualizar Estado Activo de Botones
            if (modelo === 'mk4') {
                btnMk4.classList.add('active');
                btnMk5.classList.remove('active');
            } else {
                btnMk5.classList.add('active');
                btnMk4.classList.remove('active');
            }

            // Animación de salida
            imagen.style.opacity = '0';
            document.getElementById('panelDatos').style.opacity = '0.5';

            setTimeout(() => {
                // Actualizar Textos
                document.getElementById('codigoMotor').innerText = data.motor;
                document.getElementById('tituloGeneracion').innerText = data.titulo;
                document.getElementById('descripcionGeneracion').innerText = data.desc;
                document.getElementById('datoPotencia').innerText = data.hp;
                document.getElementById('datoAceleracion').innerText = data.aceleracion;
                document.getElementById('datoTransmision').innerText = data.transmision;
                document.getElementById('datoPeso').innerText = data.peso;
                imagen.src = data.img;

                // Animación de entrada
                imagen.style.opacity = '1';
                document.getElementById('panelDatos').style.opacity = '1';
            }, 300);
        }

        function explorarModelo() {
            document.getElementById('especificaciones').scrollIntoView({ behavior: 'smooth' });
        }

        // Intersection Observer para animaciones
        const observerOptions = {
            threshold: 0.1
        };

        const observador = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('isVisible');
                    observador.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fadeInSection').forEach(el => {
            observador.observe(el);
        });
    </script>

<?php
}
