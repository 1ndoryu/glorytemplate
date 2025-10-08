<?php

function renderPestanasCategory()
{
?>
    <section class="seccionComponente" data-category="pestanas">
        <div class="contenidoSeccionComponente">

            <h2>Componente UI: Pestañas</h2>
            <p>Se generan a partir de divs con la clase <code>.pestanaContenido</code>.</p>
            <div class="pestanasWrapper gloryTabs">
                <div class="pestanas"></div>
                <div class="pestanaContenido" data-pestana="Perfil">Contenido de la pestaña de Perfil.</div>
                <div class="pestanaContenido" data-pestana="Opciones">Contenido de la pestaña de Opciones.</div>
                <div class="pestanaContenido" data-pestana="Ayuda">Contenido de la pestaña de Ayuda.</div>
            </div>

        </div>
    </section>

    <!-- Ejemplo: Código (resaltado) para Pestañas -->
    <section class="seccionComponente" data-category="pestanas">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: Marcado para Pestañas (mostrado como código)</h2>
            <p>HTML mínimo para generar pestañas con el sistema de pestañas del tema.</p>
            <pre><code class="language-html">&lt;div class="pestanasWrapper gloryTabs"&gt;
    &lt;div class="pestanas"&gt;&lt;/div&gt;
    &lt;div class="pestanaContenido" data-pestana="Perfil"&gt;Contenido de la pestaña Perfil&lt;/div&gt;
    &lt;div class="pestanaContenido" data-pestana="Opciones"&gt;Contenido de la pestaña Opciones&lt;/div&gt;
    &lt;div class="pestanaContenido" data-pestana="Ayuda"&gt;Contenido de la pestaña Ayuda&lt;/div&gt;
&lt;/div&gt;</code></pre>
        </div>
    </section>
<?php
}
