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
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/star-vie/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Star Vie","item":"https://materialdepadel.com/marcas/star-vie/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/star-vie/#faq","mainEntity":[{"@type":"Question","name":"¿Star Vie tiene palas cómodas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; busca modelos con tacto amable, baja vibración y punto dulce amplio para ganar seguridad."}},{"@type":"Question","name":"Quiero más control, ¿qué debo priorizar en Star Vie?","acceptedAnswer":{"@type":"Answer","text":"Salida predecible, pala maniobrable y que perdone el golpe descentrado."}},{"@type":"Question","name":"Si busco potencia arriba, ¿qué me conviene?","acceptedAnswer":{"@type":"Answer","text":"Respuesta rápida, buena estabilidad al impacto y tacto algo más firme para transferir energía."}},{"@type":"Question","name":"Juego variado (defiendo y ataco), ¿hay opciones polivalentes?","acceptedAnswer":{"@type":"Answer","text":"Sí, palas con salida progresiva y agilidad en la volea para cambiar de ritmo sin sorpresas."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en Star Vie?","acceptedAnswer":{"@type":"Answer","text":"Carbono = más precisión; fibra de vidrio = confort y brazo más descansado."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas de palas Star Vie?","acceptedAnswer":{"@type":"Answer","text":"En las tarjetas AAWP pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


