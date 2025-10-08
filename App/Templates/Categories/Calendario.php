<?php

use Glory\Components\Button;

function renderCalendarioCategory()
{
?>


    <section class="seccionComponente" data-category="calendario">
        <div class="contenidoSeccionComponente">
            <h3>Conceptos clave</h3>
            <ul class="flexUl">
                <li><strong>Triggers</strong>: cualquier elemento con la clase <code>gloryCalendario</code> abrirá el calendario.</li>
                <li><strong>Atributos por elemento</strong> (opcionales):
                    <ul class="flexUl">
                        <li><code>data-fechalimite</code>: fecha ISO (YYYY-MM-DD) usada al abrir como fecha inicial/límite.</li>
                        <li><code>data-tipofecha</code>: cadena libre para indicar el tipo (por ejemplo <code>limite</code> o <code>proxima</code>).</li>
                        <li><code>data-target</code>: selector CSS opcional donde mostrar la fecha seleccionada (p. ej. <code>#fechaSel</code>).</li>
                        <li><code>data-target-input</code>: selector opcional de un <code>input</code> (hidden/visible) donde guardar el valor seleccionado.</li>
                    </ul>
                </li>
                <li><strong>Handler</strong>: por defecto el calendario no guarda la fecha en ningún lado; debe proporcionar una función <code>onSelect</code> al inicializar o usar los atributos <code>data-*</code> para indicar dónde colocarla.</li>
                <li><strong>Contexto</strong>: <code>onSelect(fechaISO, contexto)</code> recibe un objeto <code>contexto</code> con <code>elementoDisparador</code>, <code>tipoFecha</code>, <code>fechaLimiteValor</code>, etc.</li>
            </ul>
        </div>
    </section>

    <section class="seccionComponente" data-category="calendario">
        <div class="contenidoSeccionComponente">
            <h3>Ejemplo funcional (HTML)</h3>
            <div style="padding: 1rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
                <?php echo Button::render([
                    'texto' => 'Abrir calendario (por defecto)',
                    'class' => 'gloryCalendario borde',
                    'attrs' => ['id' => 'calendarioPorDefecto', 'data-target' => '#fechaSel', 'data-target-input' => '#fechaInput']
                ]); ?>

                <?php echo Button::render([
                    'texto' => 'Abrir calendario (con fecha límite)',
                    'class' => 'gloryCalendario borde',
                    'attrs' => ['id' => 'calendarioConLimite', 'data-fechalimite' => '2025-12-31', 'data-target' => '#fechaSel2', 'data-target-input' => '#fechaInput2']
                ]); ?>

                <div style="display:flex; flex-direction:column; gap:.25rem;">
                    <span id="ejemploFechaSeleccionada">Fecha seleccionada: <strong id="fechaSel">-</strong></span>
                    <input type="hidden" id="fechaInput" name="fecha_input" value="">
                </div>

                <div style="display:flex; flex-direction:column; gap:.25rem;">
                    <span>Fecha (botón 2): <strong id="fechaSel2">-</strong></span>
                    <input type="hidden" id="fechaInput2" name="fecha_input_2" value="">
                </div>
            </div>


        </div>
    </section>

    <section class="seccionComponente" data-category="calendario">
        <div class="contenidoSeccionComponente">
            <h3>Uso (HTML)</h3>
            <pre><code class="language-html">
&lt;button 
class="gloryCalendario" 
data-target="#fechaSel" 
data-target-input="#fechaInput"&gt;
Abrir calendario
&lt;/button>

&lt;button 
class="gloryCalendario" 
data-fechalimite="2025-12-31" 
data-target="#fechaSel2"
data-target-input="#fechaInput2"&gt;
Abrir calendario (limite)
&lt;/button>
            </code></pre>
        </div>
    </section>

<?php
}
