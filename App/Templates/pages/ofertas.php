<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pageOfertas()
{
    ?>
    <section class="plp plp--ofertas">
        <h1><span>Ofertas</span><span class="sr-only"> de pádel</span></h1>
        <p class="cta">Revisa ofertas de pádel 2025: palas, zapatillas, ropa, pelotas y accesorios. Los precios cambian; consulta el precio en Amazon antes de decidir. Explora: <a href="/palas-de-padel/">palas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>

        <?php 
        #echo do_shortcode('[amazon box="B0B5ZRBNVL"]'); 
        ?>

        
        <?php renderAawpPlaceholder('ofertas'); ?>

        <h2>Consejos rápidos</h2>
        <ul>
            <li>Comprueba descuento real y valoraciones recientes.</li>
            <li>Verifica talla/peso y entrega.</li>
            <li>Si dudas, guárdalo: algunas ofertas vuelven.</li>
        </ul>
    </section>
    <?php
    $json = '{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://materialdepadel.com/ofertas/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},{"@type":"ListItem","position":2,"name":"Ofertas de pádel","item":"https://materialdepadel.com/ofertas/"}]},{"@type":"FAQPage","@id":"https://materialdepadel.com/ofertas/#faq","mainEntity":[{"@type":"Question","name":"¿Cada cuánto cambian las ofertas?","acceptedAnswer":{"@type":"Answer","text":"Pueden variar varias veces al día según stock y cupones. Revisa el precio actualizado en Amazon."}},{"@type":"Question","name":"¿Cómo sé si la rebaja merece la pena?","acceptedAnswer":{"@type":"Answer","text":"Compara precio actual frente a habitual, consulta reseñas recientes y confirma talla o peso antes de comprar."}},{"@type":"Question","name":"¿Puedo devolver si no me convence?","acceptedAnswer":{"@type":"Answer","text":"Depende del vendedor de Amazon y su política vigente. Revisa condiciones de devolución en la ficha del producto."}}]}]}';
    SeoHelper::printJsonLd($json);
}


