<?php

use Glory\Components\FormBuilder;

function renderPaginaReservarPublica()
{

    $serviciosTerms = get_terms([
        'taxonomy'   => 'servicio',
        'hide_empty' => false,
    ]);

    $opcionesServicios = ['' => 'Selecciona un servicio'];
    if (!is_wp_error($serviciosTerms)) {
        foreach ($serviciosTerms as $term) {
            $opcionesServicios[$term->term_id] = $term->name;
        }
    }

    $barberosTerms = get_terms([
        'taxonomy'   => 'barbero',
        'hide_empty' => false,
    ]);

    $opcionesBarberos = ['' => 'Selecciona un barbero'];
    if (!is_wp_error($barberosTerms)) {
        foreach ($barberosTerms as $term) {
            $opcionesBarberos[$term->term_id] = $term->name;
        }
    }

?>
    <section class="paginaReservaPublica">
        <div class="contenedorFormulario">
            <h1>Realiza tu Reserva</h1>
            <p>Completa el formulario para agendar tu cita en la barbería.</p>

            <?php
            echo FormBuilder::inicio([
                'extraClass' => 'formularioBarberia',
                'atributos'  => [
                    'data-post-type'   => 'reserva',
                    'data-post-status' => 'publish',
                ]
            ]);

            echo '<div class="filaFormulario">';
            echo FormBuilder::campoTexto([
                'nombre'      => 'nombre_cliente',
                'label'       => 'Nombre Completo',
                'placeholder' => 'Ej: Juan Pérez',
                'obligatorio' => true,
            ]);
            echo FormBuilder::campoTexto([
                'nombre'      => 'telefono_cliente',
                'label'       => 'Número de Teléfono',
                'placeholder' => 'Ej: 600 123 456',
                'obligatorio' => true,
            ]);
            echo FormBuilder::campoTexto([
                'nombre'      => 'correo_cliente',
                'label'       => 'Correo Electrónico',
                'placeholder' => 'Ej: juan.perez@correo.com',
                'obligatorio' => true,
            ]);
            echo '</div>';


            echo '<div class="filaFormulario">';
            echo FormBuilder::campoSelect([
                'nombre'          => 'servicio_id',
                'label'           => 'Elige un Servicio',
                'opciones'        => $opcionesServicios,
                'obligatorio'     => true,
                'extraClassInput' => 'selector-servicio'
            ]);
            echo FormBuilder::campoSelect([
                'nombre'          => 'barbero_id',
                'label'           => 'Elige un Barbero',
                'opciones'        => $opcionesBarberos,
                'obligatorio'     => true,
                'extraClassInput' => 'selector-barbero'
            ]);
            echo '</div>';


            echo '<div class="filaFormulario">';
            echo FormBuilder::campoFecha([
                'nombre'          => 'fecha_reserva',
                'label'           => 'Elige una Fecha',
                'obligatorio'     => true,
                'extraClassInput' => 'selector-fecha'
            ]);

            echo FormBuilder::campoSelect([
                'nombre'          => 'hora_reserva',
                'label'           => 'Elige una Hora',
                'opciones'        => ['' => 'Selecciona fecha, servicio y barbero'],
                'obligatorio'     => true,
                'extraClassInput' => 'selector-hora',
            ]);
            echo '</div>';

            echo FormBuilder::campoCheckbox([
                'nombre' => 'exclusividad',
                'label' => 'Marcar si es un servicio con exclusividad (❤️)',
                'valorInput' => '1',
            ]);

            echo FormBuilder::botonEnviar([
                'accion'     => 'crearReserva',
                'texto'      => 'Confirmar Reserva',
                'extraClass' => 'botonPrincipal'
            ]);

            echo FormBuilder::fin();
            ?>
        </div>
    </section>
<?php
}