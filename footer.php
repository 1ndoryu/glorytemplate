<?php

use Glory\Components\LogoRenderer;

?>
<style>
    .flex {
        display: flex;
    }

    .spaceBetween {
        justify-content: space-between;
    }

</style>

</main>

<footer class="footer">
    <div class="footerContenedor">
        <div class="footerSeccion logoFooter">
            <?php echo LogoRenderer::get_html(['filter' => 'white']); ?>
            <ul class="footer-menu-marcas" style="margin-top: 20px;">
                <li><a href="/">Inicio</a></li>
                <li><a href="/Ofertas">Ofertas</a></li>
            </ul>
        </div>
        <div class="footerSeccion">
            <?php
            $menu = include get_template_directory() . '/App/Content/menu.php';
            $marcas = array_filter($menu, function ($item) {
                return $item['title'] === 'Marcas';
            });

            if (!empty($marcas)) {
                $marcaItem = reset($marcas);
                if (isset($marcaItem['children']) && is_array($marcaItem['children'])) {
                    echo '<h3>' . esc_html($marcaItem['title']) . '</h3>';
                    echo '<ul class="footer-menu-marcas">';
                    foreach ($marcaItem['children'] as $child) {
                        $url = $child['url'];
                        if (strpos($url, '/') === 0) {
                            $url = home_url($url);
                        }
                        echo '<li><a href="' . esc_url($url) . '">' . esc_html($child['title']) . '</a></li>';
                    }
                    echo '</ul>';
                }
            }
            ?>
        </div>
        <div class="footerSeccion">
            <?php
            $menu = include get_template_directory() . '/App/Content/menu.php';
            $productos = array_filter($menu, function ($item) {
                return $item['title'] === 'Productos';
            });

            if (!empty($productos)) {
                $productoItem = reset($productos);
                if (isset($productoItem['children']) && is_array($productoItem['children'])) {
                    echo '<h3>' . esc_html($productoItem['title']) . '</h3>';
                    echo '<ul class="footer-menu-productos">';
                    foreach ($productoItem['children'] as $child) {
                        $url = $child['url'];
                        if (strpos($url, '/') === 0) {
                            $url = home_url($url);
                        }
                        echo '<li><a href="' . esc_url($url) . '">' . esc_html($child['title']) . '</a></li>';
                    }
                    echo '</ul>';
                }
            }
            ?>
        </div>
        <div class="footerSeccion">
            <div></div>
        </div> <!-- vacio -->
    </div>
    <div class="footerBlock">
        <p>Todos los derechos reservados 2025 ®</p>
        <p style="display: unset;">Sitio web hecho con <?php echo $GLOBALS['iconoCorazonMarcado']; ?> por <a href="https://wandori.us" target="_blank" rel="noopener noreferrer">Wan</a></p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>

</html>