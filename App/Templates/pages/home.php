<?php


use Glory\Components\ThemeToggle;
use Glory\Components\BadgeList;

function home()
{
?>

    <div class="badgeList" style="display: flex; justify-content: center; margin-top: 150px; margin-bottom: 20px">
        <?php

        //Haremos un badge por componente
        echo BadgeList::render([
            'badges' => ['Formulario', 'Modal', 'Pestanas', 'Alertas', 'Previews', 'Contenido', 'Filtros', 'Busqueda', 'Submenus'],
            'mode' => 'tab'
        ]);
        ?>
    </div>

    <div id="glory-component-examples" style="margin-top: 0px">


        <?php echo ThemeToggle::render(); ?>

        <?php renderAlertasCategory(); ?>
        <?php renderBusquedaCategory(); ?>
        <?php renderModalCategory(); ?>
        <?php renderPestanasCategory(); ?>
        <?php renderSubmenusCategory(); ?>

        <?php if (is_user_logged_in()) : ?>
            <?php renderFormularioCategory(); ?>
            <?php renderPreviewsCategory(); ?>
        <?php endif; ?>
        
        <?php renderContenidoCategory(); ?>
        <?php renderFiltrosCategory(); ?>
    </div>

<?php
}

// Script inline eliminado: ahora la funcionalidad se delega a `Glory/assets/js/UI/glory-theme-toggle.js`
