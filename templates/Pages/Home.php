<?php

use Glory\Components\ContentRender;
use Glory\Components\FormBuilder;
use Glory\Components\TermRender;
use Glory\Utility\UserUtility;

function home()
{
?>

    <div id="glory-component-examples">

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
                <button class="openModal borde" data-modal="miModalEjemplo">Abrir Modal</button>

            </div>
        </section>

        <div id="miModalEjemplo" class="modal" style="display:none;">
            <h3>Ventana Modal de Ejemplo</h3>
            <p>Este es el contenido de la ventana modal. Puedes cerrarla con la tecla ESC o haciendo clic fuera.</p>
            <button class="borde" onclick="window.ocultarFondo()">Cerrar</button>
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
            <button class="borde" onclick="window.ocultarFondo()">Cerrar</button>
        </div>


        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Alertas</h2>
                <p>Reemplaza <code>alert()</code> y <code>confirm()</code> nativos.</p>
                <button class="borde" onclick="alert('Esta es una alerta personalizada.')">Mostrar Alerta</button>
                <button class="borde" onclick="confirm('¿Estás seguro?').then(res => console.log('Confirmado:', res))">Mostrar Confirmación</button>

            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Pestañas</h2>
                <p>Se generan a partir de divs con la clase <code>.pestanaContenido</code>.</p>
                <div class="pestanas-wrapper">
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
                <button class="borde" data-submenu="miSubmenuEjemplo">Abrir Submenú</button>

            </div>
        </section>

        <?php if (is_user_logged_in()) : ?>
            <section class="seccionComponente">
                <div class="contenidoSeccionComponente">
                    <h2>Ejemplo: <code>FormBuilder</code></h2>
                    <p>Este formulario actualiza un metadato de tu perfil de usuario. Visible solo si estás conectado.</p>
                    <?php
                    echo FormBuilder::inicio(['atributos' => ['data-meta-target' => 'user']]);
                    echo FormBuilder::campoTexto([
                        'nombre' => 'nombre_usuario_display',
                        'label'  => 'Tu Nombre para Mostrar',
                        'valor'  => UserUtility::meta('nombre_usuario_display', get_current_user_id()) ?: wp_get_current_user()->display_name
                    ]);
                    echo FormBuilder::botonEnviar([
                        'accion' => 'guardarMeta',
                        'texto'  => 'Guardar Nombre',
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
                    'plantillaCallback'      => 'plantillaLibro',
                    'claseContenedor'        => 'lista-libros-contenedor',
                    'claseItem'              => 'libro-item'
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
        <button>Opción 1</button>
        <button>Opción 2</button>
        <button>Opción 3</button>
    </div>

<?php
}
?>