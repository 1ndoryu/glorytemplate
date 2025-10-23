<?php

use function App\Templates\Helpers\renderAawpPlaceholder;
use App\Templates\Helpers\SeoHelper;

function pagePalas()
{
    ?>
    <section class="plp plp--palas">
        <h1><span>Palas</span><span class="sr-only"> de pádel</span></h1>
        <p class="cta">Para comprar palas de pádel, compara primero por nivel (principiante, intermedio, avanzado) y por tipo: control, potencia o polivalentes. Hay alternativas baratas y de gama alta. En Amazon puedes consultar precio y <a href="/ofertas/">ofertas 2025</a> antes de decidir. Si lo prefieres, explora marcas: <a href="/marcas/adidas/">palas de pádel Adidas</a>, <a href="/marcas/bullpadel/">palas Bullpadel</a>, <a href="/marcas/nox/">palas de pádel NOX</a> y <a href="/marcas/head/">palas Head</a>.</p>

        <?php renderAawpPlaceholder('palas'); ?>

        <h2>Cómo elegir tu pala de pádel</h2>
        <p>No necesitas ser experto: piensa en tu nivel, forma y peso. Si te estás equipando, añade <a href="/zapatillas-padel/">zapatillas de pádel</a> y <a href="/pelotas-de-padel/">pelotas de pádel</a> nuevas para notar el cambio desde el primer partido.</p>

        <h3>Por nivel de juego</h3>
        <ul>
            <li><strong>Principiante</strong>: palas redondas, EVA blanda/media, 355–365 g. Más tolerancia y confort.</li>
            <li><strong>Intermedio</strong>: opciones lágrima para equilibrio control/potencia; pesos 365–370 g.</li>
            <li><strong>Avanzado</strong>: busca diamante, planos de carbono y gomas más firmes para definir y rematar. <em>Insight</em>: más peso y rigidez pueden castigar el codo si vienes de una lesión; prioriza comodidad.</li>
        </ul>

        <h3>Por forma (control vs potencia)</h3>
        <ul>
            <li><strong>Control (redonda)</strong>: punto dulce centrado, estabilidad en defensa.</li>
            <li><strong>Potencia (diamante)</strong>: balance alto, exige técnica y buen punto de impacto.</li>
            <li><strong>Polivalente (lágrima)</strong>: la opción más versátil si dudas entre ambas.</li>
        </ul>

        <h2>Presupuesto y materiales</h2>
        <p>Rango orientativo: desde modelos económicos (~40–60 €) hasta gama alta (>180 €) según marca y año. Fibra de vidrio = confort/precio; carbono = respuesta/precisión.</p>

        <h3>Pesos y balance</h3>
        <ul>
            <li><strong>Ligeras (≈355–360 g)</strong>: más manejables en la red y para sesiones largas.</li>
            <li><strong>Medias (≈365–370 g)</strong>: equilibrio general.</li>
            <li><strong>Pesadas (≈370–375 g)</strong>: más inercia para pegar, menos ágiles.</li>
        </ul>
        <p>Cuida tu equipo: protege la pala con <a href="/bolsas-y-paleteros/">bolsas y paleteros</a> y ajusta agarre/confort con <a href="/accesorios-padel/">accesorios de pádel</a>.</p>
    </section>
    <?php
    $json = '{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "@id": "https://materialdepadel.com/palas-de-padel/#breadcrumb",
      "itemListElement": [
        {"@type":"ListItem","position":1,"name":"Inicio","item":"https://materialdepadel.com/"},
        {"@type":"ListItem","position":2,"name":"Palas de pádel","item":"https://materialdepadel.com/palas-de-padel/"}
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://materialdepadel.com/palas-de-padel/#faq",
      "mainEntity": [
        {"@type":"Question","name":"¿Qué pala de pádel me conviene si soy principiante?","acceptedAnswer":{"@type":"Answer","text":"Una pala redonda de 355–365 g y EVA blanda/media para ganar control y confort."}},
        {"@type":"Question","name":"¿Control, potencia o polivalente?","acceptedAnswer":{"@type":"Answer","text":"Si dudas, una polivalente (lágrima) equilibra defensa y remate; la diamante es para jugadores avanzados con pegada."}},
        {"@type":"Question","name":"¿Qué peso es “ligero” en palas de adulto?","acceptedAnswer":{"@type":"Answer","text":"Aproximadamente 355–360 g; por debajo suele ser junior o gamas muy específicas."}},
        {"@type":"Question","name":"¿El carbono es siempre mejor que la fibra de vidrio?","acceptedAnswer":{"@type":"Answer","text":"No siempre. El carbono ofrece mayor rigidez y precisión; la fibra de vidrio es más cómoda y económica."}},
        {"@type":"Question","name":"¿Puedo ver precios y reseñas actualizadas?","acceptedAnswer":{"@type":"Answer","text":"Sí, pulsa en “Consultar precio en Amazon” en cada producto para ver precio y valoraciones en tiempo real."}}
      ]
    }
  ]
}';
    SeoHelper::printJsonLd($json);
}


