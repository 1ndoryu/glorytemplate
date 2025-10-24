<?php


function home()
{
?>
    <section class="hero">
        <?php
        // Fondo con imagen de assets del tema (s3.jpg)
        if (function_exists('App\\Templates\\Helpers\\renderAssetImage')) {
            $bgUrl = Glory\Utility\AssetsUtility::imagenUrl('tema::s3.jpg');
            if ($bgUrl) {
                echo '<div class="heroBg" style="background-image:url(' . esc_url($bgUrl) . ');"></div>';
            }
        }
        ?>
        <div class="heroInner">
            <h1 class="heroTitulo">Tu próximo nivel<br>en pádel</h1>
            <p class="heroDesc">Análisis y ofertas de las mejores marcas en Amazon</p>
        </div>
    </section>

    <section class="bloqueh categorias">
        <div class="tituloBloque">
            <h2 class="bloqueTitulo">Categorías</h2>
            <a class="btnLink" href="/">Ver todas</a>
        </div>
        <div class="gridCategorias">
            <?php
            $cards = [
                ['href' => '/palas-de-padel/',       'titulo' => 'Palas',       'img' => 's4.jpg'],
                ['href' => '/zapatillas-padel/',     'titulo' => 'Zapatillas',  'img' => 's5.jpg'],
                ['href' => '/ropa-padel/',           'titulo' => 'Ropa',        'img' => 's6.jpg'],
            ];
            foreach ($cards as $c) {
                $url = Glory\Utility\AssetsUtility::imagenUrl('tema::' . $c['img']);
                echo '<a class="catCard" href="' . esc_url($c['href']) . '">';
                if ($url) {
                    echo '<img class="catImg" src="' . esc_url($url) . '" alt="' . esc_attr($c['titulo']) . '">';
                }
                echo '<span class="catTitulo">' . esc_html($c['titulo']) . '</span>';
                echo '<span class="btn">Ver</span>';
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
            <?php
            // Listado simple: usa shortcode para facilitar modo editor
            echo do_shortcode('[glory_content_render post_type="brand" template_id="plantillaBrands" ppp="20" grid_columns="6" item_class="brandItem" container_class="brandsList"]');
            ?>
        </div>
    </section>

    <section class="bloqueh ofertas">
        <div class="tituloBloque">
            <h2 class="bloqueTitulo">Últimas ofertas</h2>
            <a class="btnLink" href="/ofertas/">Ver todas</a>
        </div>
        <div class="contenedorOfertas">
            <?php \App\Templates\Helpers\renderAawpPlaceholder('home'); ?>
        </div>
    </section>

    <section class="bloqueh accesoriosCTA">
        <div class="gridCta">
            <div class="ctaMedia">
                <?php
                if (function_exists('App\\Templates\\Helpers\\renderAssetImage')) {
                    \App\Templates\Helpers\renderAssetImage('tema::s1.jpg', ['alt' => 'Accesorios de pádel']);
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

