<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaBullpadel()
{
    ?>
    <section class="plp plp--marca plp--bullpadel">
        <h1><span>Bullpadel</span><span class="sr-only"> — Palas de pádel Bullpadel</span></h1>
        <p class="cta">Para comprar palas de pádel Bullpadel, elige entre control, potencia o polivalentes y ajusta según tu nivel. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('bullpadel'); ?>

        <h2>¿Cómo elegir tu pala Bullpadel?</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: tolerancia y punto dulce amplio; baja vibración.</li>
            <li><strong>Intermedio</strong>: estabilidad en bloqueos y agilidad en voleas; feedback claro.</li>
            <li><strong>Avanzado</strong>: precisión y rigidez torsional; respuesta rápida para cerrar.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: perdón al descentrado y salida constante.</li>
            <li><strong>Potencia</strong>: respuesta rápida y estabilidad al impacto; tacto más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y agilidad en volea.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono = firme/preciso; vidrio = cómodo.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/bullpadel/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Bullpadel","item":"https://materialdepadel.com/marcas/bullpadel/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/bullpadel/#faq","mainEntity":[{"@type":"Question","name":"¿Bullpadel tiene palas cómodas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; busca modelos con tacto blando/medio y buena tolerancia para fallar menos al inicio."}},{"@type":"Question","name":"Quiero potencia en la red, ¿qué debo priorizar?","acceptedAnswer":{"@type":"Answer","text":"Una pala con respuesta rápida, buena estabilidad al impacto y sensación más firme."}},{"@type":"Question","name":"Si tengo codo sensible, ¿qué me conviene?","acceptedAnswer":{"@type":"Answer","text":"Palas cómodas (menos vibración) y peso contenido; añade overgrip para mejorar agarre sin tensar el antebrazo."}},{"@type":"Question","name":"¿Qué peso es orientativo en Bullpadel para adulto?","acceptedAnswer":{"@type":"Answer","text":"De forma general, 355–365 g; ajusta según fuerza, frecuencia de juego y sensaciones."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas de palas Bullpadel?","acceptedAnswer":{"@type":"Answer","text":"En las tarjetas AAWP, pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


