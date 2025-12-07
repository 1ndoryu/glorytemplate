<?php

function about_render()
{
?>
    <div class="about-container">
        <?php
        about_hero();
        about_method();
        about_bio();
        about_contact();
        ?>
    </div>
<?php
}

function about_hero()
{
?>
    <section gloryDiv class="about-hero">
        <div gloryDivSecundario class="hero-content">
            <h1 gloryTexto class="hero-title">
                <span class="script-text">Sobre</span>
            </h1>
            <h2 gloryTexto class="hero-subtitle-big">NOSOTROS</h2>
            <p gloryTexto class="hero-desc">
                Cosmo Revenue nace con un proposito claro: que los hoteles tomen decisiones de ingresos con claridad, confianza y control absoluto.
            </p>
        </div>
    </section>
<?php
}

function about_method()
{
?>
    <section gloryDiv class="method-section">
        <span class="method-icon">&#x2B22;</span>
        <h2 gloryTexto class="section-title">El Metodo COSMO</h2>
        <p gloryTexto class="section-subtitle">
            Cada hotel es un sistema vivo. Alineamos datos, procesos y ejecucion en 5 fases orbitales para que todo gire a favor de tu rentabilidad.
        </p>

        <div class="about-timeline">

            <div class="method-step">
                <div class="step-content">
                    <h3 class="step-title">Collect</h3>
                    <div class="step-text-wrapper">
                        <span class="step-name">Recopilación y Saneamiento</span>
                        <p class="step-desc">Unificamos tus fuentes de datos (PMS, RMS, OTAs, web). Limpiamos y normalizamos la información para tener una base sólida y fiable.</p>
                    </div>
                </div>

                <div class="step-marker step-marker-c">
                    C
                </div>
            </div>

            <div class="method-step">
                <div class="step-content">
                    <h3 class="step-title">Orchestrate</h3>
                    <div class="step-text-wrapper">
                        <span class="step-name">Orquestación de Procesos</span>
                        <p class="step-desc">Definimos los KPIs críticos, las cadencias de revisión y asignamos responsables. Creamos un S&OP de ingresos claro.</p>
                    </div>
                </div>

                <div class="step-marker step-marker-o">
                    O
                </div>
            </div>

            <div class="method-step">
                <div class="step-content">
                    <h3 class="step-title">Signal</h3>
                    <div class="step-text-wrapper">
                        <span class="step-name">Lectura del Mercado</span>
                        <p class="step-desc">Monitorizamos señales de demanda: eventos, pick-up por segmento, elasticidad de precios y estacionalidad
                            en tiempo real.</p>
                    </div>
                </div>

                <div class="step-marker step-marker-s">
                    S
                </div>
            </div>

            <div class="method-step">
                <div class="step-content">
                    <h3 class="step-title">Monetize</h3>
                    <div class="step-text-wrapper">
                        <span class="step-name">Ejecución de Ventas</span>
                        <p class="step-desc">Aplicamos las reglas de precios, optimizamos el mix de canales y lanzamos campañas con retorno
                            de inversión (ROI) medible.</p>
                    </div>
                </div>

                <div class="step-marker step-marker-m">
                    M
                </div>
            </div>

            <div class="method-step">
                <div class="step-content">
                    <h3 class="step-title">Optimize</h3>
                    <div class="step-text-wrapper">
                        <span class="step-name">Mejora continua</span>
                        <p class="step-desc">Analizamos el post-mortem de cada acción. Aprendizaje continuo para iterar con rapidez y mejorar
                            la rentabilidad futura.
                        </p>
                    </div>
                </div>

                <div class="step-marker step-marker-s">
                    O
                </div>
            </div>

        </div>

    </section>
<?php
}

function render_method_step($letter, $title, $subtitle, $desc)
{
?>
    <div class="method-step">
        <div class="step-content">
            <h3 class="step-title"><?php echo $title; ?></h3>
            <div class="step-text-wrapper">
                <span class="step-name"><?php echo $subtitle; ?></span>
                <p class="step-desc"><?php echo $desc; ?></p>
            </div>
        </div>
        <div class="step-marker">
            <?php echo $letter; ?>
        </div>
    </div>
<?php
}

function about_bio()
{
?>
    <section gloryDiv class="bio-section">
        <div gloryDivSecundario class="bio-content">
            <div gloryDivSecundario class="bio-image">
                <img gloryImagen src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" alt="Laura - Cosmo Revenue">
            </div>
            <div gloryDivSecundario class="bio-text">
                <h2 gloryTexto class="bio-title">Hola, soy Laura</h2>
                <div gloryTexto class="bio-desc">
                    <p>Lidero Cosmo Revenue como una consultoria boutique, alejandome de las grandes estructuras impersonales. Soy una profesional joven, independiente y cercana.</p>
                    <p>Mi experiencia se centra en la Comunidad Valenciana, trabajando con hoteles, apartamentos, villas y hostels para optimizar su rendimiento en mercados clave como ES, FR, DE y UK.</p>
                    <p>Creo firmemente que el Revenue Management no tiene por que ser complejo ni opaco. Mi mision es traducir los datos en estrategias ejecutables que te den paz mental y resultados bancarios.</p>
                </div>
            </div>
        </div>
    </section>
<?php
}

function about_contact()
{
?>
    <section gloryDiv class="contact-section">
        <h2 gloryTexto class="section-title">Contacto</h2>

        <form gloryForm opciones="formId: 'about-contacto', ajaxSubmit: true, honeypot: true" class="contact-form">
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
                <div gloryInput opciones="name: 'telefono', label: 'Telefono', type: 'tel'" class="form-group">
                    <label>Telefono</label>
                    <input type="tel" name="telefono">
                </div>
                <div gloryInput opciones="name: 'alojamiento', label: 'Alojamiento', type: 'text'" class="form-group">
                    <label>Alojamiento</label>
                    <input type="text" name="alojamiento">
                </div>
            </div>
            <div gloryTextarea opciones="name: 'mensaje', label: 'Mensaje', rows: 4" class="form-group full-width">
                <label>Mensaje</label>
                <textarea name="mensaje" rows="4"></textarea>
            </div>

            <div gloryDivSecundario class="form-footer">
                <label class="checkbox-label">
                    <input type="checkbox" name="privacy" required>
                    He leido y acepto la Politica de Privacidad.
                </label>
                <button glorySubmit opciones="texto: 'Enviar', loadingText: 'Enviando...'" type="submit" class="btn-submit">Enviar</button>
            </div>
        </form>
    </section>
<?php
}
?>