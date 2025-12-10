<?php

use App\Templates\Helpers\SeoHelper;

function pageOfertas()
{
?>
    [hero_page titulo="Ofertas" sr_only=" de pádel" imagen="tema::s3.jpg"]

    <section class="plp plp--ofertas bodyPage">

        <div class="textContentPage">
            <p class="cta introContentPage">Revisa ofertas de pádel 2025: palas, zapatillas, ropa, pelotas y accesorios. Los precios cambian; consulta el precio en Amazon antes de decidir. Explora: <a href="/palas-de-padel/">palas</a>, <a href="/zapatillas-padel/">zapatillas</a>, <a href="/ropa-padel/">ropa</a>, <a href="/pelotas-de-padel/">pelotas</a>, <a href="/accesorios-padel/">accesorios</a> y <a href="/bolsas-y-paleteros/">bolsas y paleteros</a>.</p>
        </div>

        [amazon_deals]

        <div class="textContentPage">
            <h2>Consejos rápidos</h2>
            <ul>
                <li>Comprueba descuento real y valoraciones recientes.</li>
                <li>Verifica talla/peso y entrega.</li>
                <li>Si dudas, guárdalo: algunas ofertas vuelven.</li>
            </ul>
        </div>
    </section>
<?php
}
