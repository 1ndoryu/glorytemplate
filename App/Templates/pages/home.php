<?php


function home()
{
?>
    <section class="hero">
        <?php
        // Fondo responsive (s3.jpg) con WebP y diferentes anchos por breakpoint
        $bgUrl = Glory\Utility\AssetsUtility::imagenUrl('tema::s3.jpg');
        if ($bgUrl) {
            $bg_m  = Glory\Utility\ImageUtility::jetpack_photon_url($bgUrl, ['w' => 768,  'quality' => 80, 'strip' => 'all', 'format' => 'webp']);
            $bg_d  = Glory\Utility\ImageUtility::jetpack_photon_url($bgUrl, ['w' => 1280, 'quality' => 80, 'strip' => 'all', 'format' => 'webp']);
            $bg_xl = Glory\Utility\ImageUtility::jetpack_photon_url($bgUrl, ['w' => 1920, 'quality' => 80, 'strip' => 'all', 'format' => 'webp']);
            echo '<style>.hero .heroBg{background-image:url(' . esc_url($bg_d) . ');background-size:cover;background-position:center;}@media(max-width:800px){.hero .heroBg{background-image:url(' . esc_url($bg_m) . ');}}@media(min-width:1400px){.hero .heroBg{background-image:url(' . esc_url($bg_xl) . ');}}</style>';
            echo '<div class="heroBg"></div>';
        }
        ?>
        <div class="heroInner">
            <h1 class="heroTitulo">Tu próximo nivel<br>en pádel</h1>
            <p class="heroDesc">Análisis y ofertas de las mejores marcas en Amazon</p>
        </div>
    </section>

    <section class="bloqueh categorias" style="padding-top: 40px;">
        <div class="tituloBloque">
            <h2 class="bloqueTitulo">Productos</h2>
            <a class="btnLink" href="/productos/">Ver todos</a>
        </div>
        <div class="gridCategorias">
            <?php
            $cards = [
                ['href' => '/palas-de-padel/',       'titulo' => 'Palas',       'img' => 'padel.jpg'],
                ['href' => '/zapatillas-padel/',     'titulo' => 'Zapatillas',  'img' => 'zapatos.jpg'],
                ['href' => '/ropa-padel/',           'titulo' => 'Ropa',        'img' => 'ropa.jpg'],
            ];
            foreach ($cards as $c) {
                $url = Glory\Utility\AssetsUtility::imagenUrl('tema::' . $c['img']);
                echo '<a class="catCard" href="' . esc_url($c['href']) . '">';
                if ($url) {
                    $opt = Glory\Utility\ImageUtility::jetpack_photon_url($url, [
                        'resize'  => '600,400',
                        'quality' => 80,
                        'strip'   => 'all',
                        'format'  => 'webp',
                    ]);
                    echo '<img class="catImg" src="' . esc_url($opt) . '" alt="' . esc_attr($c['titulo']) . '" width="600" height="400" loading="lazy" decoding="async">';
                }
                echo '<span class="catTitulo">' . esc_html($c['titulo']) . '</span>';
                echo '</a>';
            }
            ?>
        </div>
    </section>

    <section class="bloqueh marcas">
        <div class="tituloBloque">
            <h2 class="bloqueTitulo">Marcas</h2>
            <a class="btnLink" href="/marcas/">Ver todas</a>
        </div>
        <div class="brandsScroller" data-horizontal-drag>
            [glory_content_render post_type="brand" template_id="plantillaBrands" ppp="20" grid_columns="6" item_class="brandItem" container_class="brandsList"]
        </div>
    </section>

    <section class="bloqueh ofertas">
        <div class="tituloBloque">
            <h2 class="bloqueTitulo">Últimas ofertas</h2>
            <a class="btnLink" href="/ofertas/">Ver todas</a>
        </div>
        [amazon_products only_deals="1" orderby="random" limit="4" hide_filters="1" pagination="0"]

    </section>

    <section class="bloqueh accesoriosCTA">
        <div class="gridCta">
            <div class="ctaMedia">
                <?php
                if (function_exists('App\\Templates\\Helpers\\renderAssetImage')) {
                    \App\Templates\Helpers\renderAssetImage('tema::accesorios.jpg', [
                        'alt'   => 'Accesorios de pádel',
                        // En móvil ocupa todo el ancho; en escritorio es 1 de 2 columnas
                        'sizes' => '(max-width: 800px) 100vw, 50vw',
                    ]);
                }
                ?>
            </div>
            <div class="ctaTexto">
                <h3 class="ctaTitulo">Encuentra el material perfecto para tu estilo.</h3>
                <p class="ctaDesc">Los detalles marcan la diferencia en tu comodidad y rendimiento. Desde el agarre perfecto con un nuevo overgrip hasta la protección del marco de tu pala, los accesorios correctos adaptan el equipo a tu forma de jugar.</p>
                <a class="btnLink" href="/accesorios-padel/">Ver accesorios</a>
            </div>
        </div>
    </section>
<?php
}
