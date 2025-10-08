<?php

use Glory\Components\Button;

function renderBusquedaCategory()
{
?>
    <section class="seccionComponente" data-category="busqueda">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: <code>BusquedaRenderer</code></h2>
            <p>Busca en tiempo real entre posts y libros. Escribe "poder" o "alicia" para ver resultados.</p>
            <input type="text" class="busqueda busqueda-ejemplo-input" data-tipos="post,libro" data-cantidad="3" data-target="#resultados-busqueda-ejemplo" data-renderer="BusquedaRenderer" placeholder="Buscar posts y libros...">
            <div id="resultados-busqueda-ejemplo"></div>
        </div>
    </section>

    <!-- Sección de ejemplo: Input de búsqueda mostrado como código (resaltado) -->
    <section class="seccionComponente" data-category="busqueda">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: Input de búsqueda (mostrado como código)</h2>
            <p>Ejemplo de marcado HTML para integrar el input de búsqueda frontend.</p>
            <pre><code class="language-html">&lt;input type="text"
    class="busqueda"
    data-tipos="post,libro"
    data-cantidad="3"
    data-target="#resultados-busqueda-ejemplo-2"
    data-renderer="BusquedaRenderer"
    placeholder="Buscar posts y libros..."&gt;

&lt;div id="resultados-busqueda-ejemplo-2"&gt;
&lt;/div&gt;</code></pre>
        </div>
    </section>

    <section class="seccionComponente" data-category="busqueda">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: <code>BusquedaRenderer</code> con resultados en Modal </h2>
            <p>Escribe en el campo y los resultados aparecerán en un modal. Escribe "poder" o "alicia" para ver resultados.</p>
            <input type="text"
                class="busqueda busqueda-modal-input"
                data-tipos="post,libro"
                data-cantidad="3"
                data-target="#resultados-busqueda-modal"
                data-renderer="BusquedaRenderer"
                data-overlay="true"
                data-modal="modalBusquedaEjemplo" data-modal-relative="true"
                placeholder="Buscar posts y libros..." />
        </div>
    </section>

    <!-- Modal que contendrá solo los resultados -->
    <div id="modalBusquedaEjemplo" class="modal" style="display:none;">
        <h3>Resultados de la búsqueda</h3>
        <div id="resultados-busqueda-modal"></div>
        <?php echo Button::render([
            'texto' => 'Cerrar',
            'class' => 'borde',
            'attrs' => ['onclick' => 'window.ocultarFondo()']
        ]); ?>
    </div>
<?php
}
