<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaBullpadel()
{
    ?>
    <section class="plp plp--marca plp--bullpadel">
        <h1><span>Bullpadel</span><span class="sr-only"> — Palas de pádel Bullpadel</span></h1>
        <p class="cta">Para comprar palas de pádel Bullpadel, elige entre control, potencia o polivalentes y ajusta según tu nivel. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('bullpadel'); ?>

        <h2>¿Cómo elegir tu pala Bullpadel?</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: tolerancia y punto dulce amplio; baja vibración.</li>
            <li><strong>Intermedio</strong>: estabilidad en bloqueos y agilidad en voleas; feedback claro.</li>
            <li><strong>Avanzado</strong>: precisión y rigidez torsional; respuesta rápida para cerrar.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: perdón al descentrado y salida constante.</li>
            <li><strong>Potencia</strong>: respuesta rápida y estabilidad al impacto; tacto más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en volea.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono = firme/preciso; vidrio = cómodo.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>
    </section>
    <?php
}


