<?php

function pageProductos()
{

    //Falta: pelotas, accesorios, bolsas y paleteros
?>
    [hero_page titulo="Productos" sr_only=" de pádel" imagen="tema::s3.jpg"]

    <section class="bloqueh categorias" style="padding-top: 40px; margin-bottom: 40px;">

        <div class="gridCategorias">
            <?php
            $cards = [
                ['href' => '/palas-de-padel/',       'titulo' => 'Palas',       'img' => 'paletasNew.jpg'],
                ['href' => '/zapatillas-padel/',     'titulo' => 'Zapatillas',  'img' => 'zapatos.jpg'],
                ['href' => '/ropa-padel/',           'titulo' => 'Ropa',        'img' => 'ropa.jpg'],
                ['href' => '/pelotas-de-padel/',     'titulo' => 'Pelotas',     'img' => 's10.jpg'],
                ['href' => '/accesorios-padel/',     'titulo' => 'Accesorios',  'img' => 'accesoriosNew.jpg'],
                ['href' => '/bolsas-y-paleteros/',   'titulo' => 'Bolsas y Paleteros', 'img' => 's12.jpg'],
            ];
            foreach ($cards as $c) {
                $url = Glory\Utility\AssetsUtility::imagenUrl('tema::' . $c['img']);
                echo '<a class="catCard" href="' . esc_url($c['href']) . '">';
                if ($url) {
                    echo '<img class="catImg" src="' . esc_url($url) . '" alt="' . esc_attr($c['titulo']) . '">';
                }
                echo '<span class="catTitulo">' . esc_html($c['titulo']) . '</span>';
                echo '</a>';
            }
            ?>
        </div>
    </section>

<?php
}
