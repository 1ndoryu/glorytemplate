<?php

function home()
{
?>
    <div class="gloryTabs homeFront">
        <div class="pestanas"></div>

        <div class="pestanasPaneles">

            <section class="pestanaContenido" data-pestana="Reservas">
                <?php echo renderPaginaReservas(); ?>
            </section>
            
            <section class="pestanaContenido" data-pestana="Barberos">
                <?php echo renderPaginaBarberos(); ?>
            </section>

            <section class="pestanaContenido" data-pestana="Servicios">
                <?php echo renderPaginaServicios(); ?>
            </section>

            <section class="pestanaContenido" data-pestana="Visualización">
                <?php echo renderPaginaVisualizacion(); ?>
            </section>

            <section class="pestanaContenido" data-pestana="Historial">
                <?php echo renderPaginaHistorial(); ?>
            </section>

            <section class="pestanaContenido" data-pestana="Ganancias">
                <?php echo renderPaginaGanancias(); ?>
            </section>
        </div>
    </div>
<?php
}
