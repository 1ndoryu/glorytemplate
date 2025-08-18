<?php

use Glory\Components\ContentRender;
use Glory\Components\FormBuilder;
use Glory\Components\TermRender;
use Glory\Utility\UserUtility;
use Glory\Components\ThemeToggle;
use Glory\Components\Button;

function home()
{
?>

    <div id="glory-component-examples">


        <?php echo ThemeToggle::render(); ?>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>BusquedaRenderer</code></h2>
                <p>Busca en tiempo real entre posts y libros. Escribe "poder" o "alicia" para ver resultados.</p>
                <input type="text" class="busqueda busqueda-ejemplo-input" data-tipos="post,libro" data-cantidad="3" data-target="#resultados-busqueda-ejemplo" data-renderer="BusquedaRenderer" placeholder="Buscar posts y libros...">
                <div id="resultados-busqueda-ejemplo"></div>
            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Modales</h2>
                <p>Usa <code>.openModal</code> con <code>data-modal="id"</code>.</p>
                <?php echo Button::render([
                    'texto' => 'Abrir Modal',
                    'class' => 'openModal borde',
                    'attrs' => ['data-modal' => 'miModalEjemplo']
                ]); ?>

            </div>
        </section>

        <div id="miModalEjemplo" class="modal" style="display:none;">
            <h3>Ventana Modal de Ejemplo</h3>
            <p>Este es el contenido de la ventana modal. Puedes cerrarla con la tecla ESC o haciendo clic fuera.</p>
            <?php echo Button::render([
                'texto' => 'Cerrar',
                'class' => 'borde',
                'attrs' => ['onclick' => 'window.ocultarFondo()']
            ]); ?>
        </div>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>BusquedaRenderer</code> con resultados en Modal </h2>
                <p>Escribe en el campo y los resultados aparecerán en un modal. Escribe "poder" o "alicia" para ver resultados.</p>
                <input type="text"
                    class="busqueda busqueda-modal-input"
                    data-tipos="post,libro"
                    data-cantidad="3"
                    data-target="#resultados-busqueda-modal"
                    data-renderer="BusquedaRenderer"
                    data-overlay="true"
                    data-modal="modalBusquedaEjemplo" data-modal-relative="true"
                    placeholder="Buscar posts y libros..." />
            </div>
        </section>

        <!-- Modal que contendrá solo los resultados -->
        <div id="modalBusquedaEjemplo" class="modal" style="display:none;">
            <h3>Resultados de la búsqueda</h3>
            <div id="resultados-busqueda-modal"></div>
            <?php echo Button::render([
                'texto' => 'Cerrar',
                'class' => 'borde',
                'attrs' => ['onclick' => 'window.ocultarFondo()']
            ]); ?>
        </div>


        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Alertas</h2>
                <p>Reemplaza <code>alert()</code> y <code>confirm()</code> nativos.</p>
                <?php echo Button::render([
                    'texto' => 'Mostrar Alerta',
                    'class' => 'borde',
                    'attrs' => ['onclick' => "alert('Esta es una alerta personalizada.')"]
                ]); ?>
                <?php echo Button::render([
                    'texto' => 'Mostrar Confirmación',
                    'class' => 'borde',
                    'attrs' => ['onclick' => "confirm('¿Estás seguro?').then(res => console.log('Confirmado:', res))"]
                ]); ?>

            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Pestañas</h2>
                <p>Se generan a partir de divs con la clase <code>.pestanaContenido</code>.</p>
                <div class="pestanas-wrapper gloryTabs">
                    <div class="pestanas"></div>
                    <div class="pestanaContenido" data-pestana="Perfil">Contenido de la pestaña de Perfil.</div>
                    <div class="pestanaContenido" data-pestana="Opciones">Contenido de la pestaña de Opciones.</div>
                    <div class="pestanaContenido" data-pestana="Ayuda">Contenido de la pestaña de Ayuda.</div>
                </div>

            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Submenús Contextuales</h2>
                <p>Usa <code>data-submenu="id"</code> para activar un menú.</p>
                <?php echo Button::render([
                    'texto' => 'Abrir Submenú',
                    'class' => 'borde',
                    'attrs' => ['data-submenu' => 'miSubmenuEjemplo']
                ]); ?>

            </div>
        </section>

        <?php if (is_user_logged_in()) : ?>
            <section class="seccionComponente">
                <div class="contenidoSeccionComponente">
                    <h2>Ejemplo: <code>FormBuilder</code></h2>
                    <p>Ejemplo que muestra múltiples tipos de campos y cómo se adaptan al tema.</p>
                    <?php
                    echo FormBuilder::inicio(['atributos' => ['data-meta-target' => 'user']]);

                    // Nombre público
                    echo FormBuilder::campoTexto([
                        'nombre' => 'nombre_usuario_display',
                        'label'  => 'Tu Nombre para Mostrar',
                        'valor'  => UserUtility::meta('nombre_usuario_display', get_current_user_id()) ?: wp_get_current_user()->display_name,
                        'placeholder' => 'Ej: María Pérez'
                    ]);

                    // Email
                    echo FormBuilder::campoTexto([
                        'nombre' => 'email_contacto',
                        'label'  => 'Email de contacto',
                        'valor'  => wp_get_current_user()->user_email ?? '',
                        'placeholder' => 'tu@ejemplo.com'
                    ]);

                    // Biografía
                    echo FormBuilder::campoTextarea([
                        'nombre' => 'bio_usuario',
                        'label'  => 'Biografía corta',
                        'valor'  => UserUtility::meta('bio_usuario', get_current_user_id()) ?: '',
                        'placeholder' => 'Cuéntanos sobre ti',
                        'rows' => 4
                    ]);

                    // Selección de género favorito (asegurar que el select quede debajo del label)
                    echo FormBuilder::campoSelect([
                        'nombre' => 'genero_favorito',
                        'label'  => 'Género favorito',
                        'valor'  => UserUtility::meta('genero_favorito', get_current_user_id()) ?: '',
                        'opciones' => [
                            '' => '-- Seleccionar --',
                            'ficcion' => 'Ficción',
                            'no_ficcion' => 'No ficción',
                            'poesia' => 'Poesía'
                        ]
                    ]);

                    // Intereses (grupo de checkboxes tradicionales)
                    echo FormBuilder::campoCheckboxGrupo([
                        'nombre' => 'intereses[]',
                        'label'  => 'Intereses',
                        'valor'  => (array) (UserUtility::meta('intereses', get_current_user_id()) ?: []),
                        'opciones' => [
                            'lectura' => 'Lectura',
                            'escritura' => 'Escritura',
                            'viajes' => 'Viajes',
                            'musica' => 'Música'
                        ]
                    ]);

                    // Intereses (estilo opción moderna con switch)
                    echo FormBuilder::campoOpcionCheck([
                        'nombre' => 'ocultarDescargados',
                        'label'  => 'Ocultar descargados',
                        'descripcion' => 'No verás samples ya descargados.',
                        'checked' => false,
                    ]);

                    // Avatar (uploader)
                    echo FormBuilder::campoImagen([
                        'nombre' => 'avatar',
                        'label'  => 'Avatar de perfil',
                        'valor'  => UserUtility::meta('avatar', get_current_user_id()) ?: ''
                    ]);

                    // Rango (ejemplo: preferencia de noches)
                    echo FormBuilder::campoRango([
                        'nombre' => 'noches_preferidas',
                        'label'  => 'Noches preferidas',
                        'valor'  => UserUtility::meta('noches_preferidas', get_current_user_id()) ?: '3',
                        'min' => 1,
                        'max' => 31
                    ]);

                    // Fecha de cumpleaños
                    echo FormBuilder::campoFecha([
                        'nombre' => 'fecha_nacimiento',
                        'label'  => 'Fecha de nacimiento',
                        'valor'  => UserUtility::meta('fecha_nacimiento', get_current_user_id()) ?: ''
                    ]);

                    // Color favorito
                    echo FormBuilder::campoColor([
                        'nombre' => 'color_favorito',
                        'label'  => 'Color favorito',
                        'valor'  => UserUtility::meta('color_favorito', get_current_user_id()) ?: '#000000'
                    ]);

                    // Botón de envío
                    echo FormBuilder::botonEnviar([
                        'accion' => 'guardarMeta',
                        'texto'  => 'Guardar cambios',
                        'extraClass' => 'borde'
                    ]);

                    echo FormBuilder::fin();
                    ?>
                </div>
            </section>
        <?php endif; ?>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2 style="text-align:center;">Ejemplo: <code>ContentRender</code> con Libros</h2>
                <p>Ejemplo de un listado para el Custom Post Type "Libro", usando una plantilla personalizada y estilo minimalista.</p>
                <?php
                ContentRender::print('libro', [
                    'publicacionesPorPagina' => 3,
                    'paginacion'             => false, 
                    'plantillaCallback'      => 'plantillaLibro', // La función que renderiza cada libro.
                    'claseContenedor'        => 'lista-libros-contenedor', // Clase para el contenedor de la lista.
                    'claseItem'              => 'libro-item', // Clase para cada elemento de la lista.
                ]);
                ?>
            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>TermRender</code></h2>
                <p>Mostrando todas las categorías de entradas.</p>
                <?php
                TermRender::print('category');
                ?>
            </div>
        </section>

        <section class="seccionComponente" style="text-align:center;">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>LogoRenderer</code> (Shortcode)</h2>
                <p>El logo del tema renderizado con un shortcode, con un ancho y filtro personalizados.</p>
                <?php echo do_shortcode('[theme_logo width="150px" filter="white"]'); ?>
            </div>
        </section>

    </div>


    <div id="miSubmenuEjemplo" class="submenu-contextual">
        <?php echo Button::render(['texto' => 'Opción 1']); ?>
        <?php echo Button::render(['texto' => 'Opción 2']); ?>
        <?php echo Button::render(['texto' => 'Opción 3']); ?>
    </div>

<?php
}

// Script inline eliminado: ahora la funcionalidad se delega a `Glory/assets/js/UI/glory-theme-toggle.js`
