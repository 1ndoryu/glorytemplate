<?php

function home()
{
?>
    <div class="gloryTabs homeFront">
        <div class="pestanas"></div>

        <div class="pestanasPaneles">

            <section class="pestanaContenido paginaReservas" data-pestana="Reservas">
                <?php echo renderPaginaReservas(); ?>
            </section>
            
            <section class="pestanaContenido paginaBarberos" data-pestana="Barberos">
                <?php echo renderPaginaBarberos(); ?>
            </section>

            <section class="pestanaContenido paginaServicios" data-pestana="Servicios">
                <?php echo renderPaginaServicios(); ?>
            </section>

            <section class="pestanaContenido paginaVisualizacion" data-pestana="Visualización">
                <?php echo renderPaginaVisualizacion(); ?>
            </section>

            <section class="pestanaContenido paginaHistorial" data-pestana="Historial">
                <?php echo renderPaginaHistorial(); ?>
            </section>

            <section class="pestanaContenido paginaGanancias" data-pestana="Ganancias">
                <?php echo renderPaginaGanancias(); ?>
            </section>
        </div>
    </div>
<?php
}
