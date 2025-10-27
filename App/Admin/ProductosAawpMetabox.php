<?php

namespace App\Admin;

class ProductosAawpMetabox
{
    private const META_ASINS = '_app_aawp_asins';

    public static function register(): void
    {
        // Hook específico para páginas para evitar dobles registros
        \add_action('add_meta_boxes_page', [self::class, 'addMetabox']);
        \add_action('save_post_page', [self::class, 'save'], 10, 2);
    }

    public static function addMetabox(): void
    {
        static $yaAnadido = false;
        if ($yaAnadido) { return; }
        $yaAnadido = true;

        \add_meta_box(
            'app_aawp_products',
            'Productos AAWP (Tema)',
            [self::class, 'render'],
            'page',
            'normal',
            // Prioridad alta: bajo SEO (que también es high) y por encima de Revisiones
            'high'
        );
    }

    public static function render(\WP_Post $post): void
    {
        $asins = get_post_meta($post->ID, self::META_ASINS, true);
        if (!is_array($asins)) {
            $asins = [];
        }
        if (empty($asins)) {
            $asins = ['B09M56N5C5', 'B09M56N5C5', 'B09M56N5C5'];
        }

        wp_nonce_field('app_aawp_products_save', 'app_aawp_products_nonce');

        echo '<p>Selecciona los ASIN (uno por línea). No llama a ninguna API; solo envuelve el shortcode.</p>';
        echo '<div id="app_aawp_wrap" style="display:grid;gap:8px;max-width:680px">';
        foreach ($asins as $i => $asin) {
            $asin = is_string($asin) ? $asin : '';
            echo '<div class="app-asin-item" style="display:flex;gap:8px;align-items:center">';
            echo '<input type="text" name="app_aawp_asins[]" value="' . esc_attr($asin) . '" placeholder="ASIN (10 caracteres)" style="flex:1" maxlength="20">';
            echo '<button type="button" class="button app-asin-del">Eliminar</button>';
            echo '</div>';
        }
        echo '</div>';
        echo '<p><button type="button" class="button" id="app_aawp_add">Añadir producto</button></p>';

        echo '<p style="color:#666">Salida en la página: <code>[productos_aawp_pagina]</code> generará <code>&lt;div class="gridAAWP"&gt;[amazon box="ASIN"]...&lt;/div&gt;</code> o vista previa HTML según la opción global.</p>';

        echo '<script>' . <<<'JS'
(function(){
  var wrap=document.getElementById('app_aawp_wrap');
  document.getElementById('app_aawp_add')?.addEventListener('click', function(){
    var div=document.createElement('div');
    div.className='app-asin-item';
    div.style='display:flex;gap:8px;align-items:center';
    div.innerHTML='<input type="text" name="app_aawp_asins[]" placeholder="ASIN (10 caracteres)" style="flex:1" maxlength="20">' +
                  '<button type="button" class="button app-asin-del">Eliminar</button>';
    wrap.appendChild(div);
  });
  document.addEventListener('click', function(e){
    if(e.target && e.target.classList.contains('app-asin-del')){
      var row=e.target.closest('.app-asin-item'); if(row) row.remove();
    }
  });
})();
JS
        . '</script>';
    }

    public static function save(int $postId, \WP_Post $post): void
    {
        if (!isset($_POST['app_aawp_products_nonce']) || !wp_verify_nonce($_POST['app_aawp_products_nonce'], 'app_aawp_products_save')) {
            return;
        }
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        if (!current_user_can('edit_page', $postId)) {
            return;
        }

        $input = isset($_POST['app_aawp_asins']) && is_array($_POST['app_aawp_asins']) ? $_POST['app_aawp_asins'] : [];
        $limpios = [];
        foreach ($input as $asin) {
            if (!is_string($asin)) { continue; }
            $asin = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $asin));
            if ($asin !== '') { $limpios[] = $asin; }
        }
        if (empty($limpios)) {
            $limpios = ['B09M56N5C5', 'B09M56N5C5', 'B09M56N5C5'];
        }
        update_post_meta($postId, self::META_ASINS, $limpios);
    }
}

ProductosAawpMetabox::register();


