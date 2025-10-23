<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaAdidas()
{
    ?>
    <section class="plp plp--marca plp--adidas">
        <h1><span>Adidas</span><span class="sr-only"> — Palas de pádel Adidas</span></h1>
        <p class="cta">Para comprar palas de pádel Adidas, elige entre control, potencia o polivalentes y ajusta según tu nivel. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('adidas'); ?>

        <h2>Elige tus palas Adidas en 1 minuto</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: forma redonda, 355–365 g y tacto cómodo para más control.</li>
            <li><strong>Intermedio</strong>: lágrima para equilibrio entre defensa y ataque.</li>
            <li><strong>Avanzado</strong>: diamante, algo más de rigidez y balance alto para definir.</li>
        </ul>
        <p><em>Insight</em>: más peso y rigidez pueden castigar el codo; prioriza comodidad si vienes de lesión.</p>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: punto dulce centrado y balance medio/bajo.</li>
            <li><strong>Potencia</strong>: balance alto y planos firmes para pegada.</li>
            <li><strong>Polivalente</strong>: lágrima si dudas entre ambas.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Fibra de vidrio</strong>: más confort y buen precio.</li>
            <li><strong>Carbono</strong>: más precisión y estabilidad (algo más exigente).</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/adidas/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Adidas","item":"https://materialdepadel.com/marcas/adidas/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/adidas/#faq","mainEntity":[{"@type":"Question","name":"¿Para quién son las palas Adidas de control?","acceptedAnswer":{"@type":"Answer","text":"Ideales si buscas seguridad desde el fondo y regularidad; suelen ser redondas y de tacto cómodo."}},{"@type":"Question","name":"¿Adidas tiene palas potentes para rematar?","acceptedAnswer":{"@type":"Answer","text":"Sí. Mira modelos diamante con balance alto y planos más firmes para ganar pegada."}},{"@type":"Question","name":"¿Qué peso elegir en palas Adidas?","acceptedAnswer":{"@type":"Answer","text":"Como guía general, 355–365 g para adulto; ajusta según fuerza y antecedentes de codo u hombro."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en Adidas?","acceptedAnswer":{"@type":"Answer","text":"Carbono = precisión y estabilidad; fibra de vidrio = mayor confort y mejor precio."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas actualizadas de palas Adidas?","acceptedAnswer":{"@type":"Answer","text":"En cada tarjeta AAWP pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


