<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageMarcaHead()
{
    ?>
    <section class="plp plp--marca plp--head">
        <h1><span>Head</span><span class="sr-only"> — Palas de pádel Head</span></h1>
        <p class="cta">Para comprar palas de pádel Head, piensa en cómo juegas (control, potencia o polivalentes) y en tu nivel. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>.</p>

        <?php renderAawpPlaceholder('head'); ?>

        <h2>Cómo acertar con tu pala Head</h2>

        <h3>Nivel</h3>
        <ul>
            <li><strong>Principiante</strong>: baja vibración y punto dulce amplio.</li>
            <li><strong>Intermedio</strong>: estable en bloqueos y ágil en la red.</li>
            <li><strong>Avanzado</strong>: precisión a ritmo alto y respuesta rápida.</li>
        </ul>

        <h3>Juego</h3>
        <ul>
            <li><strong>Control</strong>: salida constante y maniobrabilidad.</li>
            <li><strong>Potencia</strong>: respuesta seca y rápida; tacto algo más firme.</li>
            <li><strong>Polivalente</strong>: salida progresiva y sensaciones claras.</li>
        </ul>

        <h3>Material</h3>
        <ul>
            <li><strong>Caras</strong>: carbono = precisión; vidrio = confort.</li>
            <li><strong>Núcleo EVA</strong>: blanda/confort; media/equilibrio; firme/dirección.</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/marcas/head/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Palas de pádel Head","item":"https://materialdepadel.com/marcas/head/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/marcas/head/#faq","mainEntity":[{"@type":"Question","name":"¿Head tiene palas cómodas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Sí; prioriza modelos con baja vibración y punto dulce amplio para ganar seguridad."}},{"@type":"Question","name":"Quiero control desde el fondo, ¿qué busco en Head?","acceptedAnswer":{"@type":"Answer","text":"Salida constante, pala maniobrable y que perdone los golpes descentrados."}},{"@type":"Question","name":"¿Y si busco potencia en la red?","acceptedAnswer":{"@type":"Answer","text":"Respuesta rápida, buena estabilidad al impacto y tacto algo más firme para transferir energía."}},{"@type":"Question","name":"¿Qué peso orientativo recomiendas en Head?","acceptedAnswer":{"@type":"Answer","text":"De forma general, 355–365 g en adulto; ajusta según fuerza y comodidad del antebrazo."}},{"@type":"Question","name":"¿Carbono o fibra de vidrio en Head?","acceptedAnswer":{"@type":"Answer","text":"Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado."}},{"@type":"Question","name":"¿Dónde veo precios y reseñas de palas Head?","acceptedAnswer":{"@type":"Answer","text":"En cada tarjeta AAWP pulsa “Consultar precio en Amazon” para ver precio y valoraciones al día."}}]}]}';
    SeoHelper::printJsonLd($json);
}


