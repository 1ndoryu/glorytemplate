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

    $opcionesBarberos = ['any' => 'Cualquier barbero'];
    if (!is_wp_error($barberosTerms)) {
        foreach ($barberosTerms as $term) {
            // No incluir barberos dados de baja
            if (get_term_meta(intval($term->term_id), 'inactivo', true) === '1') {
                continue;
            }
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
                    // Orden de habilitación ajustada al nuevo orden de campos
                    'data-fm-submit-habilitar-cuando' => 'nombre_cliente,telefono_cliente,correo_cliente,fecha_reserva,hora_reserva,servicio_id,barbero_id',
                ]
            ]);

            // Nombre y Apellidos
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoTexto([
                'nombre'      => 'nombre_cliente',
                'label'       => 'Nombre Completo',
                'placeholder' => 'Ej: Juan Pérez',
                'obligatorio' => true,
            ]);
            echo '</div>';

            // Teléfono
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoTexto([
                'nombre'      => 'telefono_cliente',
                'label'       => 'Número de Teléfono',
                'placeholder' => 'Ej: 600 123 456',
                'obligatorio' => true,
            ]);
            echo '</div>';

            // Correo
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoTexto([
                'nombre'      => 'correo_cliente',
                'label'       => 'Correo Electrónico',
                'placeholder' => 'Ej: juan.perez@correo.com',
                'obligatorio' => true,
            ]);
            echo '</div>';

            // Fecha
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoFecha([
                'nombre'          => 'fecha_reserva',
                'label'           => 'Elige una Fecha',
                'obligatorio'     => true,
                'extraClassInput' => 'selector-fecha'
            ]);
            echo '</div>';

            // Hora
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoSelect([
                'nombre'          => 'hora_reserva',
                'label'           => 'Elige una Hora',
                'opciones'        => ['' => 'Selecciona fecha y servicio'],
                'obligatorio'     => true,
                'extraClassInput' => 'selector-hora',
                'atributosExtra'  => [
                    'data-fm-accion-opciones' => 'glory_verificar_disponibilidad',
                    'data-fm-depende' => 'barbero_id,servicio_id,fecha_reserva',
                    'data-fm-placeholder-deshabilitado' => 'Completa los campos anteriores',
                ]
            ]);
            echo '</div>';

            // Servicio
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoSelect([
                'nombre'          => 'servicio_id',
                'label'           => 'Elige un Servicio',
                'opciones'        => ['' => 'Selecciona un barbero'],
                'obligatorio'     => true,
                'extraClassInput' => 'selector-servicio',
                'atributosExtra'  => [
                    'data-fm-accion-opciones' => 'glory_servicios_por_barbero',
                    'data-fm-depende' => 'barbero_id',
                    'data-fm-placeholder-deshabilitado' => 'Selecciona un barbero',
                ]
            ]);
            echo '</div>';

            // Barbero
            echo '<div class="filaFormulario">';
            echo FormBuilder::campoSelect([
                'nombre'          => 'barbero_id',
                'label'           => 'Elige un Barbero',
                'opciones'        => $opcionesBarberos,
                'obligatorio'     => true,
                'extraClassInput' => 'selector-barbero'
            ]);
            echo '</div>';

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