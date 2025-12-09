<?php

use App\Helpers\PageHero;

function casos_render()
{
?>
    <div class="casos-container">
        <?php
        casos_hero();
        casos_cases();
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
    PageHero::render(
        'Casos',
        'DE EXITO',
        'Descubre algunos ejemplos reales del impacto de nuestras estrategias de Revenue Management en diferentes tipologías de hoteles.'
    );
}

function casos_cases()
{
?>
    <section gloryDiv class="cases-section">
        <div gloryDivSecundario class="cases-wrapper">

            <div gloryPostRender opciones="postType: 'casos', postsPerPage: 3, categoryFilter: false" class="cases-grid">
                <article gloryPostItem class="case-card">
                    <div class="case-meta">
                        <h3 gloryPostField="meta:caso_tipo" class="case-flotante"></h3>
                        <span gloryPostField="meta:caso_ubicacion" class="case-flotante"></span>
                    </div>
                    <div gloryPostField="featuredImage" opciones="asBackground: true" class="case-image">
                        <div class="case-stat" style="display: none;">
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
            <p gloryTexto class="quote-text">"Estos ejemplos reflejan cómo una gestión estratégica de precios, distribución y posicionamiento puede transformar los resultados de cualquier hotel."</p>
            <p gloryTexto class="quote-author">Adaptándonos siempre a su mercado y objetivos específicos.</p>
        </div>
    </section>
<?php
}

function casos_cta()
{
?>
    <section gloryDiv class="casos-cta">
        <h2 gloryTexto class="cta-title">¿Listo para escribir tu caso de éxito?</h2>
        <p gloryTexto class="cta-text">Analicemos el potencial oculto de tu alojamiento. Empieza con una auditoría o una consulta estratégica hoy mismo.</p>
        <a gloryAjaxNav gloryButton href="/contacto" class="btn-cta">Contactar</a>
    </section>
<?php
}

?>