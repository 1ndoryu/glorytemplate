<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaStarVie()
{
    ?>
    <section class="plp plp--marca plp--starvie">
        <h1><span>Star Vie</span><span class="sr-only"> — Palas de pádel Star Vie</span></h1>
        <p class="cta">Para comprar palas de pádel Star Vie, piensa en tu nivel y en si prefieres control, potencia o una opción polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('star-vie'); ?>

        <h2>Elige bien tu Star Vie (rápido y claro)</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: comodidad, punto dulce amplio y poca vibración.</li>
            <li><strong>Intermedio</strong>: estable en bloqueos y ágil en la volea.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta viva.</li>
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


