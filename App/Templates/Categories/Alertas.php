<?php

use Glory\Components\Button;

function renderAlertasCategory()
{
?>
    <!-- Ejemplo: Código (resaltado) para Alertas -->
    <section class="seccionComponente" data-category="alertas">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: Marcado para Alertas (mostrado como código)</h2>
            <p>Ejemplo mínimo para mostrar alertas/confirmaciones desde el frontend.</p>
            <pre><code class="language-html">&lt;button
    class="borde"
    onclick="alert('Esta es una alerta personalizada.')"
&gt;
    Mostrar Alerta
&lt;/button&gt;

&lt;button
    class="borde"
    onclick="confirm('¿Estás seguro?').then(res =&gt; console.log('Confirmado:', res))"
&gt;
    Mostrar Confirmación
&lt;/button&gt;</code></pre>
        </div>
    </section>

    <section class="seccionComponente" data-category="alertas">
        <div class="contenidoSeccionComponente">

            <h2>Componente UI: Alertas</h2>
            <p>Reemplaza <code>alert()</code> y <code>confirm()</code> nativos.</p>
            <?php echo Button::render([
                'texto' => 'Mostrar Alerta',
                'class' => 'borde',
                'attrs' => ['onclick' => "alert('Esta es una alerta personalizada.')"]
            ]); ?>
            <?php echo Button::render([
                'texto' => 'Mostrar Confirmación',
                'class' => 'borde',
                'attrs' => ['onclick' => "confirm('¿Estás seguro?').then(res => console.log('Confirmado:', res))"]
            ]); ?>

        </div>
    </section>
<?php
}
