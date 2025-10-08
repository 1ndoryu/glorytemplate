<?php

use Glory\Components\ContentRender;

function renderContenidoCategory()
{
?>
    <section class="seccionComponente" data-category="contenido">
        <div class="contenidoSeccionComponente">
            <h2 style="text-align:center;">Ejemplo: <code>ContentRender</code> con Libros</h2>
            <p>Ejemplo de un listado para el Custom Post Type "Libro", usando una plantilla personalizada y estilo minimalista.</p>
            <?php
            ContentRender::print('libro', [
                'publicacionesPorPagina' => 3,
                'paginacion'             => false,
                'plantillaCallback'      => 'plantillaLibro', // La función que renderiza cada libro.
                'claseContenedor'        => 'lista-libros-contenedor', // Clase para el contenedor de la lista.
                'claseItem'              => 'libro-item', // Clase para cada elemento de la lista.
            ]);
            ?>
        </div>
    </section>

    <!-- Ejemplo: Código (resaltado) para ContentRender -->
    <section class="seccionComponente" data-category="contenido">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: Marcado para ContentRender (mostrado como código)</h2>
            <p>Ejemplo de uso mínimo en PHP para listar publicaciones de un CPT usando <code>ContentRender</code>.</p>
            <pre><code class="language-php">&lt;?php
use Glory\\Components\\ContentRender;

ContentRender::print('libro', [
    'publicacionesPorPagina' => 3,
    'paginacion'             => false,
    'plantillaCallback'      => 'plantillaLibro',
]);
?&gt;</code></pre>
        </div>
    </section>
<?php
}
