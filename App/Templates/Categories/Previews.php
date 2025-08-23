<?php

use Glory\Components\FormBuilder;
use Glory\Utility\UserUtility;

function renderPreviewsCategory()
{
?>
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
<?php
}
