<?php

use Glory\Components\FormBuilder;
use Glory\Utility\UserUtility;

function renderFormularioCategory()
{
?>
    <section class="seccionComponente" data-category="formulario">
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
<?php
}
