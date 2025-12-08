<?php

use Glory\Components\ContentRender;

function casos_render()
{
?>
    <div class="casos-container">
        <?php
        casos_hero();
        landing_cases();
        casos_quote();
        casos_cta();
        ?>
    </div>

    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>
<?php
}

function casos_hero()
{
?>
    <section gloryDiv class="casos-hero">
        <div gloryDivSecundario class="hero-content">
            <h1 gloryTexto class="hero-title">
                <span class="script-text">
                    Casos
                    <span class="script-icon"><i data-lucide="sparkles"></i></span>
                </span>
                DE EXITO
            </h1>
            <p gloryTexto class="hero-subtitle">Descubre algunos ejemplos reales del impacto de nuestras estrategias de Revenue Management en diferentes tipologias de hoteles.</p>
        </div>
    </section>
<?php
}

function casos_grid()
{
?>
    <section gloryDiv class="cases-section">
        <div gloryDivSecundario class="cases-container">

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
    </section>
<?php
}

function casos_quote()
{
?>
    <section gloryDiv class="quote-section">
        <div gloryDivSecundario class="quote-content">
            <span class="quote-icon"><i data-lucide="bar-chart-3"></i></span>
            <p gloryTexto class="quote-text">"Estos ejemplos reflejan como una gestion estrategica de precios, distribucion y posicionamiento puede transformar los resultados de cualquier hotel."</p>
            <p gloryTexto class="quote-author">Adaptandonos siempre a su mercado y objetivos especificos.</p>
        </div>
    </section>
<?php
}

function casos_cta()
{
?>
    <section gloryDiv class="casos-cta">
        <h2 gloryTexto class="cta-title">Listo para escribir tu caso de exito?</h2>
        <p gloryTexto class="cta-text">Analicemos el potencial oculto de tu alojamiento. Empieza con una auditoria o una consulta estrategica hoy mismo.</p>
        <a gloryButton href="#" class="btn-cta">Contactar</a>
    </section>
<?php
}

?>