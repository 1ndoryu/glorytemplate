<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaBabolat()
{
    ?>
    [hero_page titulo="Babolat" sr_only=" — Palas de pádel Babolat" imagen="tema::s3.jpg"]

    <section class="plp plp--marca plp--babolat bodyPage">

        <div class="textContentPage">
            <p class="cta introContentPage">Para comprar palas de pádel Babolat, piensa en tu nivel y en si priorizas control, potencia o un punto polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>
        </div>

        [productos_aawp_pagina]

        <div class="textContentPage">
            <h2>Babolat: encuentra tu pala sin complicarte</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: fácil de mover, punto dulce generoso y sensación cómoda.</li>
            <li><strong>Intermedio</strong>: estable en red, que no castigue en llegadas forzadas.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta rápida para cerrar.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: perdón al descentrado, salida previsible y maniobrabilidad.</li>
            <li><strong>Potencia</strong>: respuesta seca y directa, estabilidad al golpear.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en voleas.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono firme/preciso; vidrio confortable.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>

        <p class="interlinks">Explora más: <a href="/palas-de-padel/">palas de pádel</a>, <a href="/ofertas/">ofertas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>
        </div>
    </section>
    <?php
}


