<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaWilson()
{
    ?>
    <section class="plp plp--marca plp--wilson">
        <h1><span>Wilson</span><span class="sr-only"> — Palas de pádel Wilson</span></h1>
        <p class="cta">Para comprar palas de pádel Wilson, piensa en tu nivel y en si priorizas control, potencia o una opción polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('wilson'); ?>

        <h2>Da con tu Wilson a la primera</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: comodidad, punto dulce grande y poca vibración.</li>
            <li><strong>Intermedio</strong>: estabilidad en bloqueos y agilidad en la volea.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta rápida.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: perdón al descentrado y salida predecible.</li>
            <li><strong>Potencia</strong>: respuesta rápida y estabilidad; tacto algo más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en la volea.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono preciso; vidrio confortable.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>
    </section>
    <?php
}


