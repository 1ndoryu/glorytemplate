<?php

use App\Templates\Helpers\SeoHelper;

function pageMarcaStarVie()
{
?>
    [hero_page titulo="Star Vie" sr_only=" — Palas de pádel Star Vie" imagen="tema::s3.jpg"]

    <section class="plp plp--marca plp--starvie bodyPage">

        <div class="textContentPage">
            <p class="cta introContentPage">Para comprar palas de pádel Star Vie, piensa en tu nivel y en si prefieres control, potencia o una opción polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>
        </div>

        [amazon_products section="marca-starvie" search="star vie" orderby="random"]

        <div class="textContentPage">
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

            <p class="interlinks">Explora más: <a href="/palas-de-padel/">palas de pádel</a>, <a href="/ofertas/">ofertas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>
        </div>
    </section>
<?php
}
