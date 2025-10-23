<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaViborA()
{
    ?>
    <section class="plp plp--marca plp--vibora">
        <h1><span>Vibor-A</span><span class="sr-only"> — Palas de pádel Vibor-A</span></h1>
        <p class="cta">Para comprar palas de pádel Vibor-A, piensa en tu nivel y en si buscas control, potencia o algo polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('vibor-a'); ?>

        <h2>Vibor-A: elige bien sin complicarte</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: comodidad, punto dulce grande y baja vibración.</li>
            <li><strong>Intermedio</strong>: estable en bloqueos y rápida en la volea.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta viva.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: perdón al descentrado y salida predecible.</li>
            <li><strong>Potencia</strong>: respuesta rápida y estabilidad; tacto algo más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en voleas.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono preciso; vidrio confortable.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/vibor-a/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Vibor-A","item":"https://materialdepadel.com/marcas/vibor-a/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/vibor-a/#faq","mainEntity":[{"@type":"Question","name":"¿Vibor-A tiene palas cómodas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; prioriza modelos con tacto amable, baja vibración y punto dulce amplio para ganar confianza."}},{"@type":"Question","name":"Quiero potencia arriba, ¿qué debo buscar en Vibor-A?","acceptedAnswer":{"@type":"Answer","text":"Respuesta rápida, buena estabilidad al impacto y tacto algo más firme para transferir energía en remates."}},{"@type":"Question","name":"Si juego a construir desde el fondo, ¿qué me conviene?","acceptedAnswer":{"@type":"Answer","text":"Salida constante, pala maniobrable y que perdone cuando no impactas al centro."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en Vibor-A?","acceptedAnswer":{"@type":"Answer","text":"Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas de palas Vibor-A?","acceptedAnswer":{"@type":"Answer","text":"En cada tarjeta AAWP pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


