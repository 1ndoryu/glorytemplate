<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageRopa()
{
    ?>
    <section class="plp plp--ropa">
        <h1><span>Ropa</span><span class="sr-only"> de pádel</span></h1>
        <p class="cta">Para comprar ropa de pádel, prioriza prendas transpirables (secado rápido) y con tejidos elásticos para libertad de movimiento. En invierno, añade ropa térmica o sudadera; en verano, tejidos ligeros con paneles de malla. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a>. Explora: <a href="/palas-de-padel/">palas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>

        <?php renderAawpPlaceholder('ropa'); ?>

        <h2>Cómo elegir tu ropa de pádel</h2>
        <p>Busca comodidad, transpirabilidad y libertad de movimiento. Ajusta el vestuario por temporada y tipo de prenda (hombre/mujer) sin sacrificar ligereza ni elasticidad.</p>

        <h3>Prendas esenciales</h3>
        <ul>
            <li><strong>Camisetas y polos</strong>: ligeros y de rápido secado; mejor con paneles de malla/mesh en zonas de calor.</li>
            <li><strong>Shorts y faldas</strong>: cintura cómoda y tejido elástico; valora bolsillos para pelotas.</li>
            <li><strong>Mallas/leggings</strong>: útiles en entretiempo o bajo shorts; prioriza costuras planas.</li>
            <li><strong>Sudaderas/chaquetas</strong>: para calentar sin perder movilidad; cremallera ligera y patronaje deportivo.</li>
        </ul>

        <h3>Tejidos y construcción</h3>
        <ul>
            <li><strong>Poliéster/elastano</strong>: equilibrio entre ligereza, elasticidad y secado rápido.</li>
            <li><strong>Costuras planas y paneles estratégicos</strong>: menos roces, mejor ajuste.</li>
            <li><strong>Protección UV y tratamientos antiolor</strong>: útiles en verano y sesiones largas.</li>
        </ul>

        <h3>Invierno vs verano</h3>
        <ul>
            <li><strong>Verano</strong>: tejidos finos, mesh, colores claros y ventilación.</li>
            <li><strong>Invierno</strong>: térmicos de base + capa media (sudadera/chaqueta) que abrigue sin limitar el swing.</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/ropa-padel/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Ropa de pádel","item":"https://materialdepadel.com/ropa-padel/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/ropa-padel/#faq","mainEntity":[{"@type":"Question","name":"¿Qué ropa de pádel es mejor para verano?","acceptedAnswer":{"@type":"Answer","text":"Camisetas y shorts transpirables con paneles de malla y secado rápido; colores claros para mayor confort."}},{"@type":"Question","name":"¿Y para invierno?","acceptedAnswer":{"@type":"Answer","text":"Primera capa térmica y sudadera o chaqueta ligera que no limite la movilidad."}},{"@type":"Question","name":"¿En qué me fijo en los tejidos?","acceptedAnswer":{"@type":"Answer","text":"Poliéster/elastano por elasticidad y secado rápido; costuras planas y patronaje deportivo para evitar roces."}},{"@type":"Question","name":"¿Ropa de pádel y de running sirven igual?","acceptedAnswer":{"@type":"Answer","text":"La de pádel prioriza movilidad lateral y ventilación en zonas clave; la de running está pensada para impacto lineal."}},{"@type":"Question","name":"¿Puedo ver precios y reseñas actualizadas?","acceptedAnswer":{"@type":"Answer","text":"Sí, pulsa en “Consultar precio en Amazon” para ver precio y valoraciones en tiempo real."}}]}]}';
    SeoHelper::printJsonLd($json);
}


