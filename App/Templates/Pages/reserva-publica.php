<?php

use Glory\Components\FormBuilder;
use Glory\Components\Modal;

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

            <?php echo FormBuilder::inicio([
                'extraClass' => 'formularioBarberia',
                'atributos'  => [
                    'data-post-type'   => 'reserva',
                    'data-post-status' => 'publish',
                    // Orden de habilitación ajustada al nuevo orden de campos
                    'data-fm-submit-habilitar-cuando' => 'nombre_cliente,telefono_cliente,correo_cliente,fecha_reserva,hora_reserva,servicio_id,barbero_id',
                    // Desactivar autocompletado del navegador
                    'autocomplete' => 'off',
                ]
            ]); ?>

            <!-- Nombre y Apellidos -->
            <div class="filaFormulario">
                <?php echo FormBuilder::campoTexto([
                    'nombre'      => 'nombre_cliente',
                    'label'       => 'Nombre Completo',
                    'placeholder' => 'Ej: Juan Pérez',
                    'obligatorio' => true,
                    'atributosExtra' => [
                        'autocomplete'   => 'off',
                        'autocorrect'    => 'off',
                        'autocapitalize' => 'off',
                        'spellcheck'     => 'false',
                    ],
                ]); ?>
            </div>

            <!-- Teléfono -->
            <div class="filaFormulario">
                <?php echo FormBuilder::campoTexto([
                    'nombre'      => 'telefono_cliente',
                    'label'       => 'Número de Teléfono',
                    'placeholder' => 'Ej: 600 123 456',
                    'obligatorio' => true,
                    'atributosExtra' => [
                        'autocomplete'   => 'off',
                        'autocorrect'    => 'off',
                        'autocapitalize' => 'off',
                        'spellcheck'     => 'false',
                        'inputmode'      => 'tel',
                    ],
                ]); ?>
            </div>

            <!-- Correo -->
            <div class="filaFormulario">
                <?php echo FormBuilder::campoTexto([
                    'nombre'      => 'correo_cliente',
                    'label'       => 'Correo Electrónico',
                    'placeholder' => 'Ej: juan.perez@correo.com',
                    'obligatorio' => true,
                    'atributosExtra' => [
                        'autocomplete'   => 'off',
                        'autocorrect'    => 'off',
                        'autocapitalize' => 'off',
                        'spellcheck'     => 'false',
                        'inputmode'      => 'email',
                    ],
                ]); ?>
            </div>

            <!-- Fecha -->
            <div class="filaFormulario">
                <?php echo FormBuilder::campoFecha([
                    'nombre'          => 'fecha_reserva',
                    'label'           => 'Elige una Fecha',
                    'obligatorio'     => true,
                    'extraClassInput' => 'selector-fecha',
                    'atributosExtra'  => [
                        'autocomplete' => 'off'
                    ]
                ]); ?>
            </div>

            <!-- Hora (depende de fecha y opcionalmente servicio; si servicio no está, se calcula unión de servicios) -->
            <div class="filaFormulario">
                <?php echo FormBuilder::campoSelect([
                    'nombre'          => 'hora_reserva',
                    'label'           => 'Elige una Hora',
                    'opciones'        => ['' => 'Selecciona una fecha'],
                    'obligatorio'     => true,
                    'extraClassInput' => 'selector-hora',
                    'atributosExtra'  => [
                        'data-fm-accion-opciones' => 'glory_verificar_disponibilidad',
                        // Cargar horas según fecha y opcionalmente servicio
                        'data-fm-depende' => 'fecha_reserva,servicio_id',
                        'data-fm-placeholder-deshabilitado' => 'Selecciona una fecha',
                        'data-fm-placeholder' => 'Selecciona una hora',
                        'autocomplete' => 'off',
                    ]
                ]); ?>
            </div>

            <!-- Servicio (filtrado por fecha y hora para ocultar no disponibles) -->
            <div class="filaFormulario">
                <?php echo FormBuilder::campoSelect([
                    'nombre'          => 'servicio_id',
                    'label'           => 'Elige un Servicio',
                    'opciones'        => ['' => 'Selecciona fecha y hora'],
                    'obligatorio'     => true,
                    'extraClassInput' => 'selector-servicio',
                    'atributosExtra'  => [
                        'data-fm-accion-opciones' => 'glory_servicios_disponibles_por_hora',
                        'data-fm-depende' => 'fecha_reserva,hora_reserva',
                        'data-fm-placeholder-deshabilitado' => 'Completa fecha y hora',
                        'data-fm-placeholder' => 'Selecciona un servicio',
                        'autocomplete' => 'off',
                    ]
                ]); ?>
            </div>

            <!-- Barbero: botón + modal + input oculto -->
            <div class="filaFormulario">
                <label>Elige un Barbero</label>
                <input type="hidden" name="barbero_id" value="any" />
                <button type="button" class="selectorBarberoBtn openModal" data-modal="modalSelectorBarbero">Cualquier barbero</button>
            </div>

            <!-- Modal de selección de barbero: estructura simplificada para usar directamente con gloryModal.js -->
            <div id="modalSelectorBarbero" class="modalOverlay modal" role="dialog" aria-modal="true" style="display:none;" data-close-on-overlay="1">
                <div class="listaBarberos" data-estado-cargado="0"></div>
            </div>

            <?php echo FormBuilder::botonEnviar([
                'accion'     => 'crearReserva',
                'texto'      => 'Confirmar Reserva',
                'extraClass' => 'botonPrincipal'
            ]); ?>

            <?php echo FormBuilder::fin(); ?>
        </div>
    </section>
<?php
}