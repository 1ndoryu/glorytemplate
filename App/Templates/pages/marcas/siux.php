<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaSiux()
{
    ?>
    <section class="plp plp--marca plp--siux">
        <h1><span>Siux</span><span class="sr-only"> — Palas de pádel Siux</span></h1>
        <p class="cta">Para comprar palas de pádel Siux, piensa en tu nivel y en si buscas control, potencia o una opción polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a> al día.</p>

        <?php renderAawpPlaceholder('siux'); ?>

        <h2>Tu pala Siux, sin darle mil vueltas</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: facilidad, punto dulce grande y baja vibración.</li>
            <li><strong>Intermedio</strong>: estable en bloqueos y rápida en la volea.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta viva.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: perdón al descentrado y salida predecible.</li>
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
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/siux/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Siux","item":"https://materialdepadel.com/marcas/siux/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/siux/#faq","mainEntity":[{"@type":"Question","name":"¿Siux tiene palas cómodas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; prioriza modelos con poco castigo al brazo, punto dulce grande y tacto amable para ganar confianza."}},{"@type":"Question","name":"Quiero potencia arriba, ¿qué buscar en Siux?","acceptedAnswer":{"@type":"Answer","text":"Respuesta rápida, buena estabilidad al impacto y sensación algo más firme para transferir energía en remates."}},{"@type":"Question","name":"Juego variado, ¿qué Siux me conviene?","acceptedAnswer":{"@type":"Answer","text":"Una pala equilibrada con salida progresiva y agilidad en la red para pasar de defensa a ataque sin sorpresas."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en Siux?","acceptedAnswer":{"@type":"Answer","text":"Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas de palas Siux?","acceptedAnswer":{"@type":"Answer","text":"En las tarjetas AAWP, pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


