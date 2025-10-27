<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaHead()
{
    ?>
    [hero_page titulo="Head" sr_only=" — Palas de pádel Head" imagen="tema::s3.jpg"]

    <section class="plp plp--marca plp--head bodyPage">

        <div class="textContentPage">
            <p class="cta introContentPage">Para comprar palas de pádel Head, piensa en cómo juegas (control, potencia o polivalentes) y en tu nivel. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>
        </div>

        [productos_aawp_pagina]

        <div class="textContentPage">
            <h2>Cómo acertar con tu pala Head</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: baja vibración y punto dulce amplio.</li>
            <li><strong>Intermedio</strong>: estable en bloqueos y ágil en la red.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta rápida.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: salida constante y maniobrabilidad.</li>
            <li><strong>Potencia</strong>: respuesta seca y rápida; tacto algo más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y sensaciones claras.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono = precisión; vidrio = confort.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>

        <p class="interlinks">Explora más: <a href="/palas-de-padel/">palas de pádel</a>, <a href="/ofertas/">ofertas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>
        </div>
    </section>
    <?php
}


