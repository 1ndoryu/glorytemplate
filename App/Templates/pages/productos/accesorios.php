<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageAccesorios()
{
    ?>
    <section class="plp plp--accesorios">
        <h1><span>Accesorios</span><span class="sr-only"> de pádel</span></h1>
        <p class="cta">Para comprar accesorios de pádel, empieza por mejorar el agarre (overgrips), proteger la pala (protector de marco) y mantener las pelotas (presurizador). Completa con muñequeras, cintas y calcetines técnicos. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>. Explora: <a href="/palas-de-padel/">palas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/pelotas-de-padel/">pelotas</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>

        <?php renderAawpPlaceholder('accesorios'); ?>

        <h2>Cómo elegir tus accesorios de pádel</h2>
        <p>Prioriza lo que más impacta en el juego: agarre, protección de la pala y mantenimiento de pelotas. Después añade confort y seguridad según tu rutina y clima.</p>

        <h3>Agarre: overgrips y grips</h3>
        <ul>
            <li>Overgrips tacky para más adherencia; absorbentes si sudas mucho.</li>
            <li>El grosor ajusta el tamaño de la empuñadura; cambia el overgrip con frecuencia.</li>
            <li>Packs (3/12) reducen coste por unidad y facilitan reposición.</li>
        </ul>

        <h3>Protección de la pala</h3>
        <ul>
            <li>Protector de marco para evitar golpes y rozaduras; añade algo de peso en la cabeza.</li>
            <li>Si buscas control del balance, colócalo de forma uniforme y revisa el estado tras cada sesión.</li>
        </ul>

        <h3>Conservación y mantenimiento</h3>
        <ul>
            <li>Presurizador de pelotas para alargar la vida útil entre partidos.</li>
            <li>Toalla de mano y paños de limpieza: mejoran el agarre y el cuidado del plano de la pala.</li>
        </ul>

        <h3>Confort y seguridad</h3>
        <ul>
            <li>Muñequeras y cintas: absorben sudor y mejoran la sujeción.</li>
            <li>Calcetines técnicos: acolchado y ventilación para reducir ampollas.</li>
            <li>Gorra/visera: visibilidad en exteriores y protección adicional.</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/accesorios-padel/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Accesorios de pádel","item":"https://materialdepadel.com/accesorios-padel/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/accesorios-padel/#faq","mainEntity":[{"@type":"Question","name":"¿Qué overgrip me conviene, tacky o absorbente?","acceptedAnswer":{"@type":"Answer","text":"Tacky mejora la adherencia; absorbente gestiona mejor el sudor. Si sudas mucho, prioriza el absorbente."}},{"@type":"Question","name":"¿Cada cuánto debo cambiar el overgrip?","acceptedAnswer":{"@type":"Answer","text":"Cuando pierda adherencia o se apelmace; en uso frecuente, muchas personas lo cambian cada 1–3 partidos."}},{"@type":"Question","name":"¿Sirve el protector de marco para algo más que golpes?","acceptedAnswer":{"@type":"Answer","text":"Sí, protege la pintura y puede variar ligeramente el balance (un poco más de peso en la cabeza)."}},{"@type":"Question","name":"¿Merece la pena un presurizador de pelotas?","acceptedAnswer":{"@type":"Answer","text":"Si juegas a menudo, ayuda a conservar la presión y alarga la vida útil entre sesiones."}},{"@type":"Question","name":"¿Qué accesorios básicos recomiendas para empezar?","acceptedAnswer":{"@type":"Answer","text":"Overgrips, protector de marco, muñequeras o cinta y calcetines técnicos; añade presurizador si rotas muchas pelotas."}}]}]}';
    SeoHelper::printJsonLd($json);
}


