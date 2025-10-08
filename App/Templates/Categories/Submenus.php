<?php

use Glory\Components\Button;

function renderSubmenusCategory()
{
?>
    <section class="seccionComponente" data-category="submenus">
        <div class="contenidoSeccionComponente">

            <h2>Componente UI: Submenús Contextuales</h2>
            <p>Usa <code>data-submenu="id"</code> para activar un menú.</p>
            <?php echo Button::render([
                'texto' => 'Abrir Submenú',
                'class' => 'borde',
                'attrs' => ['data-submenu' => 'miSubmenuEjemplo']
            ]); ?>

        </div>

        <div id="miSubmenuEjemplo" class="submenu">
            <?php echo Button::render(['texto' => 'Opción 1']); ?>
            <?php echo Button::render(['texto' => 'Opción 2']); ?>
            <?php echo Button::render(['texto' => 'Opción 3']); ?>
        </div>
    </section>

    <!-- Ejemplo: Código (resaltado) para Submenús -->
    <section class="seccionComponente" data-category="submenus">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: Marcado para Submenús (mostrado como código)</h2>
            <p>Ejemplo mínimo para crear un submenú contextual con <code>data-submenu</code>.</p>
            <pre><code class="language-html">&lt;button class="borde" data-submenu="miSubmenuEjemplo"&gt;Abrir Submenú&lt;/button&gt;

&lt;div id="miSubmenuEjemplo" class="submenu" style="display:none;"&gt;
    &lt;ul&gt;
        &lt;li&gt;&lt;a href="#"&gt;Opción 1&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="#"&gt;Opción 2&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="#"&gt;Opción 3&lt;/a&gt;&lt;/li&gt;
    &lt;/ul&gt;
&lt;/div&gt;</code></pre>
        </div>
    </section>
<?php
}
