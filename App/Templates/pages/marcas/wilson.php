<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaWilson()
{
    ?>
    <section class="plp plp--marca plp--wilson">
        <h1><span>Wilson</span><span class="sr-only"> — Palas de pádel Wilson</span></h1>
        <p class="cta">Para comprar palas de pádel Wilson, piensa en tu nivel y en si priorizas control, potencia o una opción polivalente. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('wilson'); ?>

        <h2>Da con tu Wilson a la primera</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: comodidad, punto dulce grande y poca vibración.</li>
            <li><strong>Intermedio</strong>: estabilidad en bloqueos y agilidad en la volea.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta rápida.</li>
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
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/wilson/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Wilson","item":"https://materialdepadel.com/marcas/wilson/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/wilson/#faq","mainEntity":[{"@type":"Question","name":"¿Wilson tiene palas recomendadas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; modelos con tacto amable, baja vibración y punto dulce amplio para ganar seguridad desde el inicio."}},{"@type":"Question","name":"Si busco control desde el fondo, ¿qué priorizo en Wilson?","acceptedAnswer":{"@type":"Answer","text":"Salida constante, pala maniobrable y que perdone cuando no impactas al centro."}},{"@type":"Question","name":"Quiero potencia en la red, ¿qué me conviene?","acceptedAnswer":{"@type":"Answer","text":"Respuesta rápida, buena estabilidad y un tacto algo más firme para transferir mejor la energía."}},{"@type":"Question","name":"Juego variado (defiendo y ataco), ¿hay opciones polivalentes?","acceptedAnswer":{"@type":"Answer","text":"Sí, palas con salida progresiva y agilidad en la volea para cambiar de ritmo con confianza."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en Wilson?","acceptedAnswer":{"@type":"Answer","text":"Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas de palas Wilson?","acceptedAnswer":{"@type":"Answer","text":"En las tarjetas AAWP, pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


