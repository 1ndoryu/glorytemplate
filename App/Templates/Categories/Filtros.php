<?php

use Glory\Components\TermRender;

function renderFiltrosCategory()
{
?>
    <section class="seccionComponente" data-category="filtros">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: <code>TermRender</code></h2>
            <p>Mostrando todas las categorías de entradas.</p>
            <?php
            TermRender::print('category');
            ?>
        </div>
    </section>
<?php
}
