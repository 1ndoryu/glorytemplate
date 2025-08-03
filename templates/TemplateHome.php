<?php

get_header();

use Glory\Components\ContentRender;
use Glory\Components\FormBuilder;
use Glory\Components\TermRender;
use Glory\Utility\UserUtility;


?>

<style>
    .seccionComponente {
        padding: 4rem 2rem;
        margin: 0 auto;
        height: 100vh;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        flex-direction: column;
        background-color: #080808;
        margin: auto;
        align-content: flex-start;
    }

    .contenidoSeccionComponente {
        margin: auto;
        max-width: 1100px;
        background: #0e0e0e;
        padding: 20px;
        border-radius: var(--radius);
        text-align: start;
    }

    .seccionComponente h2 {
        /* text-align: center; */
        margin-bottom: 1rem;
        font-size: 2rem;
    }

    .seccionComponente .gloryForm {
        max-width: 500px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .lista-libros-contenedor {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 2rem;
        width: 100%;
    }

    .libro-item a {
        text-decoration: none;
    }

    .libro-card {
        background-color: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
    }

    .libro-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .libro-portada {
        width: 100%;
        height: 270px;
        object-fit: cover;
        display: block;
    }

    .libro-info {
        padding: 1rem;
    }

    .libro-titulo {
        font-size: 1rem;
        margin: 0;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>

<div id="glory-component-examples">

    <?php if (is_user_logged_in()) : ?>
        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>FormBuilder</code></h2>
                <p style="text-align: center; margin-bottom: 1.5rem;">Este formulario actualiza un metadato de tu perfil de usuario. Visible solo si estás conectado.</p>
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
            <h2 style="text-align:center;">Idea Implementada: <code>ContentRender</code> con Libros</h2>
            <p style="text-align: center; margin-bottom: 1.5rem;">Ejemplo de un listado para el Custom Post Type "Libro", usando una plantilla personalizada y estilo minimalista.</p>
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
            <h2>Ejemplo: <code>ContentRender</code> (Básico)</h2>
            <p style="text-align: center; margin-bottom: 1.5rem;">Mostrando las últimas 3 entradas del blog con la plantilla por defecto.</p>
            <?php
            ContentRender::print('post', [
                'publicacionesPorPagina' => 3,
                'paginacion' => false
            ]);
            ?>
        </div>
    </section>

    <section class="seccionComponente">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: <code>TermRender</code></h2>
            <p style="text-align: center; margin-bottom: 1.5rem;">Mostrando todas las categorías de entradas.</p>
            <?php
            TermRender::print('category');
            ?>
        </div>
    </section>

    <section class="seccionComponente" style="text-align:center;">
        <div class="contenidoSeccionComponente">
            <h2>Ejemplo: <code>LogoRenderer</code> (Shortcode)</h2>
            <p style="text-align: center; margin-bottom: 1.5rem;">El logo del tema renderizado con un shortcode, con un ancho y filtro personalizados.</p>
            <?php echo do_shortcode('[theme_logo width="150px" filter="black"]'); ?>
        </div>
    </section>

</div>


<?php
get_footer();
?>