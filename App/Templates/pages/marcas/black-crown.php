<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaBlackCrown()
{
    ?>
    <section class="plp plp--marca plp--blackcrown">
        <h1><span>Black Crown</span><span class="sr-only"> — Palas de pádel Black Crown</span></h1>
        <p class="cta">Para comprar palas de pádel Black Crown, piensa primero en tu nivel y en si te encaja control, potencia o una opción polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('black-crown'); ?>

        <h2>Encuentra tu Black Crown sin liarte</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: poco castigo y punto dulce amplio.</li>
            <li><strong>Intermedio</strong>: estabilidad al blocar y rapidez en la volea.</li>
            <li><strong>Avanzado</strong>: precisión y respuesta viva para cerrar puntos.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: salida predecible y maniobrabilidad.</li>
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
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/black-crown/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Black Crown","item":"https://materialdepadel.com/marcas/black-crown/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/black-crown/#faq","mainEntity":[{"@type":"Question","name":"¿Black Crown tiene palas cómodas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; prioriza modelos con poca vibración y punto dulce amplio para ganar seguridad desde el primer día."}},{"@type":"Question","name":"Si busco control, ¿qué debo mirar en Black Crown?","acceptedAnswer":{"@type":"Answer","text":"Salida predecible, pala maniobrable y que perdone cuando no impactas perfecto."}},{"@type":"Question","name":"Quiero potencia arriba, ¿qué me conviene?","acceptedAnswer":{"@type":"Answer","text":"Respuesta rápida, buena estabilidad al golpear y tacto algo más firme para transferir energía."}},{"@type":"Question","name":"Juego variado, ¿hay opciones polivalentes?","acceptedAnswer":{"@type":"Answer","text":"Sí, palas con salida progresiva y agilidad en la red para pasar de defensa a ataque sin sorpresas."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en Black Crown?","acceptedAnswer":{"@type":"Answer","text":"Carbono = más precisión; fibra de vidrio = confort y brazo más descansado."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas de palas Black Crown?","acceptedAnswer":{"@type":"Answer","text":"En las tarjetas AAWP pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


