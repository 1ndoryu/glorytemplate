<?php

use App\Templates\Helpers\SeoHelper;

function pageZapatillas()
{
?>
    [hero_page titulo="Zapatillas" sr_only=" de pádel" imagen="tema::s3.jpg"]

    <section class="plp plp--zapatillas bodyPage">

        <div class="textContentPage">
            <p class="cta introContentPage">Para comprar zapatillas de pádel, decide primero por suela (clay, híbrida u omni) y por amortiguación/estabilidad según tu nivel. Hay opciones baratas y de gama alta. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>. Explora: <a href="/palas-de-padel/">palas</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>
        </div>

        [amazon_products search="zapatilla" orderby="random" exclude="pala,paletero,bolsa,camiseta,pantalon,grip,pelota"]

        <div class="textContentPage">
            <h2>Cómo elegir tus zapatillas de pádel</h2>
            <p>No necesitas filtros complejos: céntrate en suela, amortiguación/estabilidad, ajuste y durabilidad.</p>

            <h3>Suela: ¿clay, híbrida u omni?</h3>
            <ul>
                <li><strong>Clay</strong>: dibujo en espiga; buen agarre y evacuación de arena.</li>
                <li><strong>Híbrida/mixta</strong>: combina espiga con zonas lisas o microtaqueado; versátil si alternas superficies.</li>
                <li><strong>Omni/microtaco</strong>: tacos pequeños; útil en superficies muy lisas, con menos agarre en pistas arenosas.</li>
            </ul>

            <h3>Amortiguación y estabilidad</h3>
            <ul>
                <li>Más amortiguación → confort y protección articular.</li>
                <li>Si tienes molestias, prioriza estabilidad y un drop moderado.</li>
                <li>Más estabilidad lateral → seguridad en apoyos y cambios de dirección.</li>
            </ul>

            <h3>Ajuste, peso y materiales</h3>
            <ul>
                <li><strong>Ajuste</strong>: horma ni muy estrecha ni suelta; media talla más si usas calcetín grueso.</li>
                <li><strong>Peso</strong>: modelos ligeros = agilidad; más peso = sensación de solidez.</li>
                <li>Refuerzos y compuestos anti-abrasión prolongan la vida útil.</li>
            </ul>
            <p>Tip: si la suela está plana o la espiga sin relieve, es momento de renovar aunque el upper se vea bien.</p>
        </div>
    </section>
<?php
}
