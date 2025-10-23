<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;
use Glory\Helpers\AjaxNav;
use Glory\Core\GloryFeatures;

AssetManager::setThemeVersion('0.1.1');
add_filter('show_admin_bar', '__return_false');
SyncManager::setAdminBarVisible(true); 
SyncManager::setResetButtonVisible(true);


PageManager::define('home', 'home'); #Esta pagina es de ejemplo, puedes renombrarla a otro otro lugar (las paginas van en Templates/pages)


if (GloryFeatures::isActive('task') !== false) {
    PageManager::define('task', 'task');
}

// Paginas de Productos
PageManager::define('palas-de-padel', 'pagePalas');
PageManager::define('zapatillas-padel', 'pageZapatillas');
PageManager::define('ropa-padel', 'pageRopa');
PageManager::define('pelotas-de-padel', 'pagePelotas');
PageManager::define('accesorios-padel', 'pageAccesorios');
PageManager::define('bolsas-y-paleteros', 'pageBolsasPaleteros');

// Paginas de Marcas (usar como hijos bajo "marcas/" en WP)
PageManager::define('adidas', 'pageMarcaAdidas');
PageManager::define('bullpadel', 'pageMarcaBullpadel');
PageManager::define('nox', 'pageMarcaNox');
PageManager::define('babolat', 'pageMarcaBabolat');
PageManager::define('head', 'pageMarcaHead');
PageManager::define('siux', 'pageMarcaSiux');
PageManager::define('black-crown', 'pageMarcaBlackCrown');
PageManager::define('star-vie', 'pageMarcaStarVie');
PageManager::define('vibor-a', 'pageMarcaViborA');
PageManager::define('wilson', 'pageMarcaWilson');

// Pagina Ofertas
PageManager::define('ofertas', 'pageOfertas');

AjaxNav::contentSelector('#main');
AjaxNav::mainScrollSelector('#main');
AjaxNav::registerFilter();
