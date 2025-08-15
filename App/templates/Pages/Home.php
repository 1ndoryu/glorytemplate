<?php

use Glory\Components\AutenticacionRenderer;
use Glory\Components\PerfilRenderer;

function home()
{
?>
    <?php if (!is_user_logged_in()) : ?>
        <div class="homeFront" style="max-width:520px;margin:30px auto;padding:0 16px;">
            <h2 style="text-align:center;margin-bottom:10px;">Iniciar sesión</h2>
            <?php echo AutenticacionRenderer::renderLogin([
                'redirectTo' => home_url('/'),
                'mostrarRecordarme' => true,
                'claseWrapper' => 'homeFront'
            ]); ?>
        </div>
    <?php else : ?>
        <div class="gloryTabs homeFront">
            <div class="homeFrontTabs">
                <div class="pestanas"></div>
            </div>
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
        <div id="submenuUsuario" class="usuarioSubmenu">
            <a href="<?php echo esc_url( wp_logout_url( home_url('/') ) ); ?>" class="submenuItem">Cerrar sesión</a>
        </div>
    <?php endif; ?>
<?php
}
