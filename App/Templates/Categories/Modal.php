<?php

use Glory\Components\Button;

function renderModalCategory()
{
?>
    <section class="seccionComponente" data-category="modal">
        <div class="contenidoSeccionComponente">

            <h2>Componente UI: Modales</h2>
            <p>Usa <code>.openModal</code> con <code>data-modal="id"</code>.</p>
            <?php echo Button::render([
                'texto' => 'Abrir Modal',
                'class' => 'openModal borde',
                'attrs' => ['data-modal' => 'miModalEjemplo']
            ]); ?>

        </div>
    </section>

    <section class="seccionComponente" data-category="modal">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: Marcado para Modal (mostrado como código)</h2>
            <p>HTML mínimo para usar el sistema de modales del tema.</p>
            <pre><code class="language-html">&lt;button class="openModal borde" data-modal="miModalEjemplo"&gt;Abrir Modal&lt;/button&gt;

&lt;div id="miModalEjemplo" class="modal" style="display:none;"&gt;
    &lt;h3&gt;Título del Modal&lt;/h3&gt;
    &lt;p&gt;Contenido del modal...&lt;/p&gt;
    &lt;button class="borde" onclick="window.ocultarFondo()"&gt;Cerrar&lt;/button&gt;
&lt;/div&gt;</code></pre>
        </div>
    </section>

    <div id="miModalEjemplo" class="modal" style="display:none;">
        <h3>Ventana Modal de Ejemplo</h3>
        <p>Este es el contenido de la ventana modal. Puedes cerrarla con la tecla ESC o haciendo clic fuera.</p>
        <?php echo Button::render([
            'texto' => 'Cerrar',
            'class' => 'borde',
            'attrs' => ['onclick' => 'window.ocultarFondo()']
        ]); ?>
    </div>
<?php
}
