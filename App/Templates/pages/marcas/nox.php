<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaNox()
{
    ?>
    [hero_page titulo="NOX" sr_only=" — Palas de pádel NOX" imagen="tema::s3.jpg"]

    <section class="plp plp--marca plp--nox bodyPage">

        <div class="textContentPage">
            <p class="cta introContentPage">Para comprar palas de pádel NOX, piensa en cómo juegas (control, potencia o polivalentes) y en tu frecuencia de juego. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>
        </div>

        [productos_aawp_pagina]

        <div class="textContentPage">
            <h2>¿Cuál es tu NOX ideal?</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: facilidad de golpeo y punto dulce amplio; baja vibración.</li>
            <li><strong>Intermedio</strong>: estabilidad en red y previsibilidad en defensa; feedback claro.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y rigidez torsional; respuesta viva.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: tolerancia al descentrado y salida constante.</li>
            <li><strong>Potencia</strong>: respuesta rápida y estabilidad; tacto algo más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en voleas.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono firme/preciso; vidrio cómodo.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>

        <p class="interlinks">Explora más: <a href="/palas-de-padel/">palas de pádel</a>, <a href="/ofertas/">ofertas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>
        </div>
    </section>
    <?php
}


