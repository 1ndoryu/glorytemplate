<?php

use Glory\Components\ContentRender;
use Glory\Components\FormBuilder;
use Glory\Components\TermRender;
use Glory\Utility\UserUtility;
use Glory\Components\ThemeToggle;
use Glory\Components\Button;
use Glory\Components\BadgeList;

function home()
{
?>

    <div class="bagdeList" style="margin-top: 150px">
        <?php

        //Haremos un badge por componente
        echo BadgeList::render([
            'badges' => ['Formulario', 'Modal', 'Pestanas', 'Alertas', 'Previews', 'Contenido', 'Filtros', 'Busqueda', 'Submenus'],
            'mode' => 'tab'
        ]);
        ?>
    </div>

    <div id="glory-component-examples" style="margin-top: 0px">


        <?php echo ThemeToggle::render(); ?>

        <section class="seccionComponente" data-category="busqueda">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>BusquedaRenderer</code></h2>
                <p>Busca en tiempo real entre posts y libros. Escribe "poder" o "alicia" para ver resultados.</p>
                <input type="text" class="busqueda busqueda-ejemplo-input" data-tipos="post,libro" data-cantidad="3" data-target="#resultados-busqueda-ejemplo" data-renderer="BusquedaRenderer" placeholder="Buscar posts y libros...">
                <div id="resultados-busqueda-ejemplo"></div>
            </div>
        </section>

        <!-- Ejemplo: Código (resaltado) para Alertas -->
        <section class="seccionComponente" data-category="alertas">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: Marcado para Alertas (mostrado como código)</h2>
                <p>Ejemplo mínimo para mostrar alertas/confirmaciones desde el frontend.</p>
                <pre><code class="language-html">&lt;button
    class="borde"
    onclick="alert('Esta es una alerta personalizada.')"
&gt;
    Mostrar Alerta
&lt;/button&gt;

&lt;button
    class="borde"
    onclick="confirm('¿Estás seguro?').then(res =&gt; console.log('Confirmado:', res))"
&gt;
    Mostrar Confirmación
&lt;/button&gt;</code></pre>
            </div>
        </section>

        <!-- Sección de ejemplo: Input de búsqueda mostrado como código (resaltado) -->
        <section class="seccionComponente" data-category="busqueda">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: Input de búsqueda (mostrado como código)</h2>
                <p>Ejemplo de marcado HTML para integrar el input de búsqueda frontend.</p>
                <pre><code class="language-html">&lt;input type="text"
    class="busqueda"
    data-tipos="post,libro"
    data-cantidad="3"
    data-target="#resultados-busqueda-ejemplo-2"
    data-renderer="BusquedaRenderer"
    placeholder="Buscar posts y libros..."&gt;

&lt;div id="resultados-busqueda-ejemplo-2"&gt;
&lt;/div&gt;</code></pre>
            </div>
        </section>

        <section class="seccionComponente" data-category="modal">
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

        <!-- Ejemplo: Código (resaltado) para integrar un modal -->
        <section class="seccionComponente" data-category="modal">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: Marcado para Modal (mostrado como código)</h2>
                <p>HTML mínimo para usar el sistema de modales del tema.</p>
                <pre><code class="language-html">&lt;button class="openModal borde" data-modal="miModalEjemplo"&gt;Abrir Modal&lt;/button&gt;

&lt;div id="miModalEjemplo" class="modal" style="display:none;"&gt;
    &lt;h3&gt;Título del Modal&lt;/h3&gt;
    &lt;p&gt;Contenido del modal...&lt;/p&gt;
    &lt;button class="borde" onclick="window.ocultarFondo()"&gt;Cerrar&lt;/button&gt;
&lt;/div&gt;</code></pre>
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

        <section class="seccionComponente" data-category="busqueda">
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


        <section class="seccionComponente" data-category="alertas">
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

        <section class="seccionComponente" data-category="pestanas">
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

        <!-- Ejemplo: Código (resaltado) para Pestañas -->
        <section class="seccionComponente" data-category="pestanas">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: Marcado para Pestañas (mostrado como código)</h2>
                <p>HTML mínimo para generar pestañas con el sistema de pestañas del tema.</p>
                <pre><code class="language-html">&lt;div class="pestanas-wrapper gloryTabs"&gt;
    &lt;div class="pestanas"&gt;&lt;/div&gt;
    &lt;div class="pestanaContenido" data-pestana="Perfil"&gt;Contenido de la pestaña Perfil&lt;/div&gt;
    &lt;div class="pestanaContenido" data-pestana="Opciones"&gt;Contenido de la pestaña Opciones&lt;/div&gt;
    &lt;div class="pestanaContenido" data-pestana="Ayuda"&gt;Contenido de la pestaña Ayuda&lt;/div&gt;
&lt;/div&gt;</code></pre>
            </div>
        </section>

        <section class="seccionComponente" data-category="submenus">
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

        <!-- Ejemplo: Código (resaltado) para Submenús -->
        <section class="seccionComponente" data-category="submenus">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: Marcado para Submenús (mostrado como código)</h2>
                <p>Ejemplo mínimo para crear un submenú contextual con <code>data-submenu</code>.</p>
                <pre><code class="language-html">&lt;button class="borde" data-submenu="miSubmenuEjemplo"&gt;Abrir Submenú&lt;/button&gt;

&lt;div id="miSubmenuEjemplo" class="submenu" style="display:none;"&gt;
    &lt;ul&gt;
        &lt;li&gt;&lt;a href="#"&gt;Opción 1&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="#"&gt;Opción 2&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="#"&gt;Opción 3&lt;/a&gt;&lt;/li&gt;
    &lt;/ul&gt;
&lt;/div&gt;</code></pre>
            </div>
        </section>

        <?php if (is_user_logged_in()) : ?>
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

            <!-- Sección avanzada: PreviewImagen (dividida en sub-secciones) -->
            <section class="seccionComponente" data-category="previews">
                <div class="contenidoSeccionComponente">
                    <h2>Componente UI: Preview de Imagen (avanzado)</h2>
                    <p>Resumen: ejemplos y opciones para integrar la previsualización de imágenes con <code>gestionarPreviews.js</code>. Cada ejemplo está separado en su propia sección para facilitar pruebas y documentación.</p>
                </div>
            </section>

            <section class="seccionComponente" data-category="previews">
                <div class="contenidoSeccionComponente">
                    <h3>1) Ejemplo usando <code>FormBuilder::campoImagen</code> (recomendado)</h3>
                    <p>Parámetros útiles: <code>'nombre'</code>, <code>'label'</code>, <code>'valor'</code> (ID del adjunto), <code>'descripcion'</code>, <code>'placeholder'</code>, <code>'idPreview'</code> (opcional).</p>
                    <?php
                    echo FormBuilder::campoImagen([
                        'nombre' => 'avatar_demo',
                        'label'  => 'Avatar demo (sin botón)',
                        'valor'  => UserUtility::meta('avatar', get_current_user_id()) ?: '',
                        'descripcion' => 'Arrastra una imagen o haz clic en el área para seleccionar.',
                        'placeholder' => 'Haz clic para subir una imagen (demo)'
                    ]);
                    ?>
                </div>
            </section>

            <section class="seccionComponente" data-category="previews">
                <div class="contenidoSeccionComponente">
                    <h3>2) Ejemplo manual — asociación por <code>data-preview-id</code> / <code>data-preview-for</code></h3>
                    <p>Usa esto cuando el <code>input</code> y la <code>preview</code> estén en partes distintas del DOM o cuando debas enlazar varios inputs a previews concretas.</p>
                    <div class="previewContenedor" data-uploadclick="true" data-extrapreview=".extra-preview-demo" data-extrapreview-on="drag">
                        <input type="file" id="demo-file-1" name="demo_image" style="display:none;" accept="image/*" data-preview-for="demo-preview-1" />
                        <div class="previewImagen" data-preview-id="demo-preview-1">
                            <span class="image-preview-placeholder">Haz clic para subir una imagen (manual)</span>
                        </div>
                        <div class="extra-preview-demo oculto" style="margin-top:8px;padding:6px;border:1px dashed #ccc;">Elemento extra (se muestra al arrastrar)</div>
                    </div>
                </div>
            </section>

            <section class="seccionComponente" data-category="previews">
                <div class="contenidoSeccionComponente">
                    <h3>3) Preview con imagen inicial</h3>
                    <p>Si ya hay una imagen, muéstrala dentro de la preview.</p>
                    <div class="previewContenedor" style="margin-top:8px;">
                        <input type="file" id="demo-file-2" name="demo_image2" style="display:none;" accept="image/*" data-preview-for="demo-preview-2" />
                        <div class="previewImagen" data-preview-id="demo-preview-2">
                            <?php $imgId = UserUtility::meta('avatar', get_current_user_id()) ?: 0; ?>
                            <?php if ($imgId): ?>
                                <img src="<?php echo esc_url(wp_get_attachment_image_url((int)$imgId, 'thumbnail')); ?>" alt="Inicial" />
                            <?php else: ?>
                                <span class="image-preview-placeholder">Sin imagen inicial</span>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </section>

            <section class="seccionComponente" data-category="previews">
                <div class="contenidoSeccionComponente">
                    <h3>4) Opciones y detalles</h3>
                    <ul>
                        <li><strong>data-uploadclick="true"</strong>: permite abrir el selector al hacer clic en cualquier parte del contenedor.</li>
                        <li><strong>data-preview-id</strong> / <strong>data-preview-for</strong>: enlazan un <code>input[type="file"]</code> con su preview cuando no están directamente en la misma estructura DOM.</li>
                        <li><strong>data-extrapreview</strong> y <strong>data-extrapreview-on</strong>: selector CSS y modo de aparición del elemento extra. Modos: <code>drag</code>, <code>drop</code>, <code>click</code>, <code>change</code>, <code>always</code>.</li>
                        <li><strong>accept</strong>: restringe tipos (ej. <code>image/*</code>).</li>
                        <li><strong>placeholder</strong>: texto mostrado cuando no hay imagen; se puede pasar vía <code>FormBuilder::campoImagen('placeholder')</code>.</li>
                        <li><strong>input oculto (hidden)</strong>: mantiene el ID del attachment para compatibilidad con el backend (campo con el mismo <code>name</code> que el que procesas en servidor).</li>
                    </ul>

                    <p>Prueba arrastrando una imagen sobre cualquiera de los contenedores o haz clic en el área para seleccionar un archivo. El script <code>Glory/assets/js/UI/gestionarPreviews.js</code> se encargará de mostrar la preview y de propagar el cambio al input oculto.</p>
                </div>
            </section>

            <!-- Sección avanzada 2: Mostrar campo siguiente al subir y activar contenedor al arrastrar -->
            <section class="seccionComponente" id="demo-activacion-externa" data-category="previews">
                <div class="contenidoSeccionComponente">
                    <h2>Preview de imagen con activación de siguiente campo y activación externa</h2>
                    <p>Al soltar una imagen en el primer contenedor, se muestra el segundo campo (inicialmente oculto). Además, arrastrar sobre este bloque activa el contenedor oculto.</p>

                    <!-- Activador externo: al arrastrar sobre este bloque se activa #contenedor-oculto -->
                    <div style="padding:10px;border:1px dashed #999;margin-bottom:10px;" data-activapreview="#contenedor-oculto">
                        Arrastra una imagen sobre este bloque para activar el siguiente contenedor oculto.
                    </div>

                    <!-- Primer campo: al cambiar, muestra el segundo -->
                    <div class="previewContenedor" data-uploadclick="true" data-extrapreview="#contenedor-oculto" data-extrapreview-on="drop">
                        <input type="file" id="demo-file-a" name="demo_image_a" style="display:none;" accept="image/*" data-preview-for="demo-preview-a" />
                        <div class="previewImagen" data-preview-id="demo-preview-a">
                            <span class="image-preview-placeholder">Sube una imagen (A). Al soltar, se mostrará el siguiente campo.</span>
                        </div>
                    </div>

                    <!-- Segundo campo: inicia oculto y se activa con drop o arrastre externo -->
                    <div id="contenedor-oculto" class="previewContenedor oculto" data-uploadclick="true">
                        <input type="file" id="demo-file-b" name="demo_image_b" style="display:none;" accept="image/*" data-preview-for="demo-preview-b" />
                        <div class="previewImagen oculto" data-preview-id="demo-preview-b">
                            <span class="image-preview-placeholder">Segundo campo (B): ahora visible.</span>
                        </div>
                    </div>
                </div>
            </section>

        <?php endif; ?>

        <section class="seccionComponente" data-category="contenido">
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

        <!-- Ejemplo: Código (resaltado) para ContentRender -->
        <section class="seccionComponente" data-category="contenido">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: Marcado para ContentRender (mostrado como código)</h2>
                <p>Ejemplo de uso mínimo en PHP para listar publicaciones de un CPT usando <code>ContentRender</code>.</p>
                <pre><code class="language-php">&lt;?php
use Glory\\Components\\ContentRender;

ContentRender::print('libro', [
    'publicacionesPorPagina' => 3,
    'paginacion'             => false,
    'plantillaCallback'      => 'plantillaLibro',
]);
?&gt;</code></pre>
            </div>
        </section>

        <section class="seccionComponente" data-category="filtros">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>TermRender</code></h2>
                <p>Mostrando todas las categorías de entradas.</p>
                <?php
                TermRender::print('category');
                ?>
            </div>
        </section>
    </div>

<?php
}

// Script inline eliminado: ahora la funcionalidad se delega a `Glory/assets/js/UI/glory-theme-toggle.js`
