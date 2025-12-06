<?php
/**
 * Template por defecto del Header GBN.
 * 
 * Este archivo define la estructura HTML del header cuando GBN está activo
 * y no hay un template personalizado guardado en wp_options.
 * 
 * Puedes editar este archivo directamente o usar el editor visual en:
 * Apariencia > Header GBN
 * 
 * Atributos GBN disponibles:
 * - gloryHeader: Contenedor principal del header
 * - gloryLogo: Componente del logo
 * - gloryMenu: Componente del menú de navegación
 * - gloryMenuItem: Items individuales del menú
 * 
 * @package Glory\Gbn
 */

use Glory\Components\MenuWalker;

// Obtener datos dinámicos
$siteTitle = get_bloginfo('name');
$homeUrl = esc_url(home_url('/'));

// Usar la misma ubicación que MenuManager: 'main_navigation'
$menuLocation = 'main_navigation';
$menuHtml = '';

if (has_nav_menu($menuLocation)) {
    // Usar MenuWalker como en HeaderRenderer para submenús con clases correctas
    $walkerArgs = [
        'theme_location' => $menuLocation,
        'container' => false,
        'menu_class' => 'menu menu-level-1 gbn-menu-list',
        'echo' => false,
        'depth' => 3,
        'fallback_cb' => false
    ];
    
    // Usar MenuWalker si está disponible
    if (class_exists(MenuWalker::class)) {
        $walkerArgs['walker'] = new MenuWalker();
    }
    
    $menuHtml = wp_nav_menu($walkerArgs);
}

// Fallback si no hay menú registrado en WordPress
if (empty($menuHtml)) {
    $menuHtml = '
    <ul class="menu menu-level-1 gbn-menu-list">
        <li class="gbn-menu-item"><a href="' . $homeUrl . '">Inicio</a></li>
        <li class="gbn-menu-item"><a href="#">Servicios</a></li>
        <li class="gbn-menu-item"><a href="#">Nosotros</a></li>
        <li class="gbn-menu-item"><a href="#">Contacto</a></li>
    </ul>';
}
?>
<header gloryHeader class="gbn-header siteMenuW" role="banner">
    <div class="siteMenuContainer">
        <div gloryLogo class="siteMenuLogo">
            <a href="<?php echo $homeUrl; ?>" rel="home" class="gbn-logo-link">
                <span class="gbn-logo-text"><?php echo esc_html($siteTitle); ?></span>
            </a>
        </div>
        <nav gloryMenu class="siteMenuNav" role="navigation" aria-label="Menú principal">
            <?php echo $menuHtml; ?>
        </nav>
        <button aria-label="Toggle menu" class="burger" type="button">
            <span></span>
            <span></span>
        </button>
        <div class="background"></div>
    </div>
</header>

