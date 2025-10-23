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


PageManager::setDefaultContentMode('editor');

// Defaults SEO por slug (título, descripción, canónica)
PageManager::setDefaultSeoMap([
	'palas-de-padel' => [
		'title' => 'Palas de pádel | Control, potencia y ofertas en Amazon',
		'desc' => 'Compra palas de pádel baratas o de gama alta. Guía por nivel y forma. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/palas-de-padel',
		'faq' => [
			['q' => '¿Qué pala de pádel me conviene si soy principiante?', 'a' => 'Una pala redonda de 355–365 g y EVA blanda/media para ganar control y confort.'],
			['q' => '¿Control, potencia o polivalente?', 'a' => 'Si dudas, una polivalente (lágrima) equilibra defensa y remate; la diamante es para jugadores avanzados con pegada.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel', 'url' => 'https://materialdepadel.com/palas-de-padel/'],
		],
	],
	'zapatillas-padel' => [
		'title' => 'Zapatillas de pádel | Suela clay, híbrida u omni',
		'desc' => 'Compra zapatillas de pádel baratas o de gama alta. Guía por suela, amortiguación y ajuste. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/zapatillas-padel',
		'faq' => [
			['q' => '¿Qué suela es mejor para pádel?', 'a' => 'Clay si buscas agarre y evacuación de arena; híbrida si alternas superficies; omni en superficies muy lisas.'],
		],
	],
	'ropa-padel' => [
		'title' => 'Ropa de pádel | Transpirable, térmica y ofertas en Amazon',
		'desc' => 'Compra ropa de pádel hombre y mujer. Guía por prendas, tejidos y temporada: transpirable o térmica. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/ropa-padel',
		'faq' => [
			['q' => '¿Qué ropa es mejor para verano?', 'a' => 'Camisetas y shorts transpirables con paneles de malla y secado rápido.'],
		],
	],
	'pelotas-de-padel' => [
		'title' => 'Pelotas de pádel | Presión, durabilidad y ofertas',
		'desc' => 'Compra pelotas de pádel: opciones duraderas y económicas. Consejos de conservación y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/pelotas-de-padel',
		'faq' => [
			['q' => '¿Qué pelotas elegir según pista y clima?', 'a' => 'En pistas lentas o frío, pelotas rápidas; en pistas rápidas o calor, pelotas más controladas.'],
		],
	],
	'accesorios-padel' => [
		'title' => 'Accesorios de pádel | Overgrips, protectores y más',
		'desc' => 'Accesorios de pádel: agarre, protección, mantenimiento y confort. Recomendaciones y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/accesorios-padel',
		'faq' => [
			['q' => '¿Overgrip tacky o absorbente?', 'a' => 'Tacky = adherencia; absorbente = mejor gestión del sudor.'],
		],
	],
	'bolsas-y-paleteros' => [
		'title' => 'Bolsas y paleteros | Protección y organización',
		'desc' => 'Paleteros y mochilas de pádel: capacidad, protección y confort. Ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/bolsas-y-paleteros',
		'faq' => [
			['q' => '¿Paletero o mochila?', 'a' => 'Paletero = más capacidad; mochila = compacta para 1 pala y uso diario.'],
		],
	],
	'ofertas' => [
		'title' => 'Ofertas de pádel | Descuentos en palas, zapatillas y más',
		'desc' => 'Ofertas de pádel 2025: palas, zapatillas, ropa, pelotas y accesorios con descuento. Consulta precio y valoraciones en Amazon.',
		'canonical' => 'https://materialdepadel.com/ofertas',
		'faq' => [
			['q' => '¿Cada cuánto cambian las ofertas?', 'a' => 'Pueden variar varias veces al día según stock y cupones. Revisa el precio actualizado en Amazon.'],
			['q' => '¿Cómo sé si la rebaja merece la pena?', 'a' => 'Compara precio actual frente a habitual, consulta reseñas recientes y confirma talla o peso antes de comprar.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Ofertas de pádel', 'url' => 'https://materialdepadel.com/ofertas/'],
		],
	],
	// Marcas
	'adidas' => [
		'title' => 'Palas de pádel Adidas | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Adidas baratas o de gama alta. Guía por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/adidas',
		'faq' => [
			['q' => '¿Adidas tiene palas potentes?', 'a' => 'Sí, mira opciones diamante con balance alto y planos firmes.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Adidas', 'url' => 'https://materialdepadel.com/marcas/adidas/'],
		],
	],
	'bullpadel' => [
		'title' => 'Palas de pádel Bullpadel | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Bullpadel por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/bullpadel',
		'faq' => [
			['q' => '¿Bullpadel para principiantes?', 'a' => 'Sí, modelos cómodos con buena tolerancia y baja vibración.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Bullpadel', 'url' => 'https://materialdepadel.com/marcas/bullpadel/'],
		],
	],
	'nox' => [
		'title' => 'Palas de pádel NOX | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel NOX por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/nox',
		'faq' => [
			['q' => '¿NOX tiene opciones polivalentes?', 'a' => 'Sí, palas con salida progresiva y agilidad en red.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel NOX', 'url' => 'https://materialdepadel.com/marcas/nox/'],
		],
	],
	'babolat' => [
		'title' => 'Palas de pádel Babolat | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Babolat por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/babolat',
		'faq' => [
			['q' => '¿Babolat con buena potencia?', 'a' => 'Busca respuesta rápida y estabilidad en impacto.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Babolat', 'url' => 'https://materialdepadel.com/marcas/babolat/'],
		],
	],
	'head' => [
		'title' => 'Palas de pádel Head | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Head por nivel y preferencias. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/head',
		'faq' => [
			['q' => '¿Head tiene control?', 'a' => 'Sí, modelos con salida constante y maniobrabilidad.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Head', 'url' => 'https://materialdepadel.com/marcas/head/'],
		],
	],
	'siux' => [
		'title' => 'Palas de pádel Siux | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Siux por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/siux',
		'faq' => [
			['q' => '¿Siux para principiantes?', 'a' => 'Sí, tacto amable y punto dulce grande.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Siux', 'url' => 'https://materialdepadel.com/marcas/siux/'],
		],
	],
	'black-crown' => [
		'title' => 'Palas de pádel Black Crown | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Black Crown por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/black-crown',
		'faq' => [
			['q' => '¿Black Crown con control?', 'a' => 'Salida predecible y buena maniobrabilidad.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Black Crown', 'url' => 'https://materialdepadel.com/marcas/black-crown/'],
		],
	],
	'star-vie' => [
		'title' => 'Palas de pádel Star Vie | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Star Vie por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/star-vie',
		'faq' => [
			['q' => '¿Star Vie para empezar?', 'a' => 'Modelos cómodos con baja vibración y buen punto dulce.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Star Vie', 'url' => 'https://materialdepadel.com/marcas/star-vie/'],
		],
	],
	'vibor-a' => [
		'title' => 'Palas de pádel Vibor-A | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Vibor-A por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/vibor-a',
		'faq' => [
			['q' => '¿Vibor-A con potencia?', 'a' => 'Busca respuesta rápida y estabilidad al impacto.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Vibor-A', 'url' => 'https://materialdepadel.com/marcas/vibor-a/'],
		],
	],
	'wilson' => [
		'title' => 'Palas de pádel Wilson | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Wilson por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/marcas/wilson',
		'faq' => [
			['q' => '¿Wilson para empezar?', 'a' => 'Sí, tacto amable y punto dulce grande.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Wilson', 'url' => 'https://materialdepadel.com/marcas/wilson/'],
		],
	],
]);

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
