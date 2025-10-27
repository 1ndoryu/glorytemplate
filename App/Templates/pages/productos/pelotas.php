<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pagePelotas()
{
    ?>
    [hero_page titulo="Pelotas" sr_only=" de pádel" imagen="tema::s3.jpg"]

    <section class="plp plp--pelotas bodyPage">

        <div class="textContentPage">
            <p class="cta introContentPage">Para comprar pelotas de pádel, elige el bote (altura de rebote) y la velocidad según tu pista y clima. En pistas lentas o frío, busca pelotas más rápidas; en pistas muy rápidas o calor, pelotas más controladas. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>. Explora: <a href="/palas-de-padel/">palas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>
        </div>

        [productos_aawp_pagina]

        <div class="textContentPage">
            <h2>Cómo elegir tus pelotas de pádel</h2>
        <p>Piensa en velocidad de la pista, temperatura y durabilidad del fieltro. Ajusta el bote para que el juego sea predecible y cómodo durante todo el partido.</p>

        <h3>Bote y velocidad</h3>
        <ul>
            <li><strong>Pelotas rápidas (bote alto)</strong>: ayudan en pistas lentas o con temperaturas bajas.</li>
            <li><strong>Pelotas controladas (bote medio)</strong>: mejoran el control en pistas rápidas o con calor.</li>
            <li><strong>Homologadas para competición</strong>: garantizan consistencia de bote y relación fieltro-núcleo.</li>
        </ul>

        <h3>Clima y pista</h3>
        <ul>
            <li><strong>Invierno/frío</strong>: compensa con pelotas más vivas para mantener el ritmo.</li>
            <li><strong>Verano/calor</strong>: prefiere pelotas más controladas para evitar botes excesivos.</li>
            <li><strong>Pista con mucha arena o húmeda</strong>: prioriza un bote estable y fieltro que no se sature.</li>
        </ul>

        <h3>Durabilidad y conservación</h3>
        <ul>
            <li>Fieltro denso y núcleo consistente = más vida útil, pero algo menos de velocidad al inicio.</li>
            <li>Para mantener la presión, guarda los botes cerrados y evita el calor directo.</li>
            <li>Si se “mueren” pronto, valora packs de 24 o presurizador como accesorio.</li>
        </ul>

        <h3>Cantidad y uso</h3>
        <ul>
            <li><strong>Pack de 3</strong>: estándar para partidos y entrenos cortos.</li>
            <li><strong>Caja/pack de 24</strong>: mejor precio por bola para clubes o entrenos frecuentes.</li>
            <li><strong>Competición vs entrenamiento</strong>: alterna pelotas nuevas para partidos y reserva las usadas para calentamiento.</li>
        </ul>
        </div>
    </section>
    <?php
}


