<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageZapatillas()
{
    ?>
    <section class="plp plp--zapatillas">
        <h1><span>Zapatillas</span><span class="sr-only"> de pádel</span></h1>
    <p class="cta">Para comprar zapatillas de pádel, decide primero por suela (clay, híbrida u omni) y por amortiguación/estabilidad según tu nivel. Hay opciones baratas y de gama alta. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>. Explora: <a href="/palas-de-padel/">palas</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>

        <?php renderAawpPlaceholder('zapatillas'); ?>

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
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/zapatillas-padel/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Zapatillas de pádel","item":"https://materialdepadel.com/zapatillas-padel/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/zapatillas-padel/#faq","mainEntity":[{"@type":"Question","name":"¿Qué suela es mejor para pádel, clay o híbrida?","acceptedAnswer":{"@type":"Answer","text":"La clay ofrece gran agarre y durabilidad; la híbrida equilibra agarre y deslizamiento si alternas superficies. La omni/microtaco funciona bien en superficies muy lisas, con menos agarre en pistas arenosas."}},{"@type":"Question","name":"¿Cada cuánto debo cambiar las zapatillas de pádel?","acceptedAnswer":{"@type":"Answer","text":"Según uso y desgaste: muchas personas las cambian cada 6–12 meses o cuando la espiga pierde relieve."}},{"@type":"Question","name":"¿Diferencias con zapatillas de tenis o running?","acceptedAnswer":{"@type":"Answer","text":"Las de pádel priorizan la estabilidad lateral y suela específica para pistas con arena o sintético."}},{"@type":"Question","name":"¿Cómo elijo talla y ajuste?","acceptedAnswer":{"@type":"Answer","text":"Deja ~1 cm en puntera, pruébalas con tus calcetines habituales y valora media talla más si notas presión lateral."}},{"@type":"Question","name":"¿Puedo ver precios y reseñas actualizadas?","acceptedAnswer":{"@type":"Answer","text":"Sí, pulsa en “Consultar precio en Amazon” en cada producto para ver precio y valoraciones en tiempo real."}}]}]}';
    SeoHelper::printJsonLd($json);
}


