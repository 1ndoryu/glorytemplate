<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaBlackCrown()
{
    ?>
    <section class="plp plp--marca plp--blackcrown">
        <h1><span>Black Crown</span><span class="sr-only"> — Palas de pádel Black Crown</span></h1>
        <p class="cta">Para comprar palas de pádel Black Crown, piensa primero en tu nivel y en si te encaja control, potencia o una opción polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('black-crown'); ?>

        <h2>Encuentra tu Black Crown sin liarte</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: poco castigo y punto dulce amplio.</li>
            <li><strong>Intermedio</strong>: estabilidad al blocar y rapidez en la volea.</li>
            <li><strong>Avanzado</strong>: precisión y respuesta viva para cerrar puntos.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: salida predecible y maniobrabilidad.</li>
            <li><strong>Potencia</strong>: respuesta rápida y estabilidad; tacto algo más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en la red.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono preciso; vidrio confortable.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>
    </section>
    <?php
}


