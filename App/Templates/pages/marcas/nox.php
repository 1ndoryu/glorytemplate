<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaNox()
{
    ?>
    <section class="plp plp--marca plp--nox">
        <h1><span>NOX</span><span class="sr-only"> — Palas de pádel NOX</span></h1>
        <p class="cta">Para comprar palas de pádel NOX, piensa en cómo juegas (control, potencia o polivalentes) y en tu frecuencia de juego. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('nox'); ?>

        <h2>¿Cuál es tu NOX ideal?</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: facilidad de golpeo y punto dulce amplio; baja vibración.</li>
            <li><strong>Intermedio</strong>: estabilidad en red y previsibilidad en defensa; feedback claro.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y rigidez torsional; respuesta viva.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: tolerancia al descentrado y salida constante.</li>
            <li><strong>Potencia</strong>: respuesta rápida y estabilidad; tacto algo más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en voleas.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono firme/preciso; vidrio cómodo.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/nox/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel NOX","item":"https://materialdepadel.com/marcas/nox/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/nox/#faq","mainEntity":[{"@type":"Question","name":"¿NOX tiene palas cómodas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; prioriza modelos con tacto amable y buena tolerancia para ganar confianza rápido."}},{"@type":"Question","name":"Quiero más potencia arriba, ¿qué NOX me conviene?","acceptedAnswer":{"@type":"Answer","text":"Una pala con respuesta rápida, buena estabilidad y sensación algo más firme para transferir energía."}},{"@type":"Question","name":"Si busco control desde el fondo, ¿qué priorizo?","acceptedAnswer":{"@type":"Answer","text":"Salida constante, maniobrabilidad y que perdone cuando no impactas al centro."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en NOX?","acceptedAnswer":{"@type":"Answer","text":"Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado."}},{"@type":"Question","name":"¿Dónde ver precios y reseñas de palas NOX?","acceptedAnswer":{"@type":"Answer","text":"En cada tarjeta AAWP pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


