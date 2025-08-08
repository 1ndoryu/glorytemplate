<?php

use Glory\Components\SchedulerRenderer;
use Glory\Core\OpcionRegistry;

function renderPaginaVisualizacion()
{
    guardarColoresSiPost();
    registrarOpcionesColoresServiciosDinamico();

    $fecha = obtenerFechaSeleccionada();
    $definiciones = OpcionRegistry::getDefiniciones();

?>
    <div class="wrap paginaVisual">
        <h1 class="tituloVisualizacion">Visualización de Citas</h1>
        <div class="botonesVisualizacion">
            <?php renderizarFormularioFecha($fecha); ?>
            <div class="rightBotones">
                <div class="siguienteyanterior" style="display: flex; gap: 10px; margin-left: auto;">
                    <button type="button" id="diaAnteriorBtn" class="button">Día Anterior</button>
                    <button type="button" id="diaSiguienteBtn" class="button">Día Siguiente</button>
                </div>
                <button type="button" id="toggleConfigColores" class="button"><?php echo esc_html('Configurar colores'); ?></button>
            </div>
        </div>
        <?php renderizarConfiguradorColores($definiciones); ?>
        <?php

        $recursos = obtenerRecursos();
        $eventos = obtenerEventosPorFecha($fecha);

        $mapeoColores = construirMapaColores($definiciones);
        asegurarSinAsignar($recursos, $eventos);

        $configScheduler = [
            'recursos' => array_values(array_unique($recursos)),
            'horaInicio' => '09:00',
            'horaFin' => '21:00',
            'intervalo' => 15,
            'mapeoColores' => $mapeoColores,
        ];

        SchedulerRenderer::render($eventos, $configScheduler);
        renderizarScriptNavegacionFecha(); ?>
    </div>
<?php
}
