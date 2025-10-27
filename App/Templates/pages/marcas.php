<?php

function pageMarcas()
{
    ?>
    [hero_page titulo="Marcas" sr_only=" de pádel" imagen="tema::s3.jpg"]

    <section class="plp plp--marcas bodyPage noDrag">
        <div class="">
            <?php
            // Listado simple: usa shortcode para facilitar modo editor
            echo do_shortcode('[glory_content_render post_type="brand" template_id="plantillaBrands" ppp="20" grid_columns="6" item_class="brandItem" container_class="brandsList"]');
            ?>
        </div>
    </section>
    <?php
}


