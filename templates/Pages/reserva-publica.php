<?php

use Glory\Components\FormBuilder;

function renderPaginaReservarPublica()
{
    // --- OBTENER DATOS PARA LOS DESPLEGABLES ---

    // Obtener todos los términos de la taxonomía 'servicio'
    $serviciosTerms = get_terms([
        'taxonomy'   => 'servicio',
        'hide_empty' => false,
    ]);

    // Formatear para el FormBuilder
    $opcionesServicios = ['' => 'Selecciona un servicio'];
    if (!is_wp_error($serviciosTerms)) {
        foreach ($serviciosTerms as $term) {
            $opcionesServicios[$term->term_id] = $term->name;
        }
    }

    // Obtener todos los términos de la taxonomía 'barbero'
    $barberosTerms = get_terms([
        'taxonomy'   => 'barbero',
        'hide_empty' => false,
    ]);

    // Formatear para el FormBuilder
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
            // Iniciar el formulario con el FormBuilder
            echo FormBuilder::inicio([
                'extraClass' => 'formularioBarberia',
                'atributos'  => [
                    'data-post-type'   => 'reserva',
                    'data-post-status' => 'publish',
                ]
            ]);

            // --- CAMPOS DE DATOS DEL CLIENTE ---
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoTexto([
                'nombre'      => 'nombre_cliente', // Este será el post_title
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


            // --- CAMPOS DE SELECCIÓN DE CITA ---
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


            // --- CAMPOS DE FECHA Y HORA ---
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoFecha([
                'nombre'          => 'fecha_reserva',
                'label'           => 'Elige una Fecha',
                'obligatorio'     => true,
                'extraClassInput' => 'selector-fecha'
            ]);

            // Placeholder para los horarios. Se rellenará con JS.
            echo FormBuilder::campoSelect([
                'nombre'          => 'hora_reserva',
                'label'           => 'Elige una Hora',
                'opciones'        => ['' => 'Selecciona fecha, servicio y barbero'],
                'obligatorio'     => true,
                'extraClassInput' => 'selector-hora',
            ]);
            echo '</div>';


            // --- BOTÓN DE ENVÍO ---
            echo FormBuilder::botonEnviar([
                'accion'     => 'crearReserva',
                'texto'      => 'Confirmar Reserva',
                'extraClass' => 'botonPrincipal'
            ]);

            // Cerrar el formulario
            echo FormBuilder::fin();
            ?>
        </div>
    </section>
<?php
}