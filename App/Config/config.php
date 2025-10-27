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
    'home' => [
        'title' => 'Tienda Pádel: Palas, Zapatillas, Ropa y Ofertas en Amazon',
        'desc' => 'Guías y comparativas para elegir tu equipo de pádel: palas, zapatillas, ropa, pelotas y accesorios. Descubre marcas top y últimas ofertas en Amazon.',
        'canonical' => home_url('/'),
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => home_url('/')],
        ],
    ],
	'palas-de-padel' => [
		'title' => 'Palas de pádel | Control, potencia y ofertas en Amazon',
		'desc' => 'Compra palas de pádel baratas o de gama alta. Guía por nivel y forma. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/palas-de-padel',
		'faq' => [
			['q' => '¿Qué pala de pádel me conviene si soy principiante?', 'a' => 'Una pala redonda de 355–365 g y EVA blanda/media para ganar control y confort.'],
			['q' => '¿Control, potencia o polivalente?', 'a' => 'Si dudas, una polivalente (lágrima) equilibra defensa y remate; la diamante es para jugadores avanzados con pegada.'],
			['q' => '¿Qué peso es "ligero" en palas de adulto?', 'a' => 'Aproximadamente 355–360 g; por debajo suele ser junior o gamas muy específicas.'],
			['q' => '¿El carbono es siempre mejor que la fibra de vidrio?', 'a' => 'No siempre. Carbono = mayor rigidez/precisión; vidrio = más cómodo y económico.'],
			['q' => '¿Puedo ver precios y reseñas actualizadas?', 'a' => 'Sí, en cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones en tiempo real.'],
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
			['q' => '¿Qué suela es mejor para pádel, clay o híbrida?', 'a' => 'La clay ofrece gran agarre y durabilidad; la híbrida equilibra agarre y deslizamiento si alternas superficies. La omni/microtaco funciona bien en superficies muy lisas, con menos agarre en pistas arenosas.'],
			['q' => '¿Cada cuánto debo cambiar las zapatillas de pádel?', 'a' => 'Según uso y desgaste: muchas personas las cambian cada 6–12 meses o cuando la espiga pierde relieve.'],
			['q' => '¿Diferencias con zapatillas de tenis o running?', 'a' => 'Las de pádel priorizan la estabilidad lateral y suela específica para pistas con arena o sintético.'],
			['q' => '¿Cómo elijo talla y ajuste?', 'a' => 'Deja ~1 cm en puntera, pruébalas con tus calcetines habituales y valora media talla más si notas presión lateral.'],
			['q' => '¿Puedo ver precios y reseñas actualizadas?', 'a' => 'Sí, en cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones en tiempo real.'],
		],
	],
	'ropa-padel' => [
		'title' => 'Ropa de pádel | Transpirable, térmica y ofertas en Amazon',
		'desc' => 'Compra ropa de pádel hombre y mujer. Guía por prendas, tejidos y temporada: transpirable o térmica. Consulta precio y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/ropa-padel',
		'faq' => [
			['q' => '¿Qué ropa de pádel es mejor para verano?', 'a' => 'Camisetas y shorts transpirables con paneles de malla y secado rápido; colores claros para mayor confort.'],
			['q' => '¿Y para invierno?', 'a' => 'Primera capa térmica y sudadera o chaqueta ligera que no limite la movilidad.'],
			['q' => '¿En qué me fijo en los tejidos?', 'a' => 'Poliéster/elastano por elasticidad y secado rápido; costuras planas y patronaje deportivo para evitar roces.'],
			['q' => '¿Ropa de pádel y de running sirven igual?', 'a' => 'La de pádel prioriza movilidad lateral y ventilación en zonas clave; la de running está pensada para impacto lineal.'],
			['q' => '¿Puedo ver precios y reseñas actualizadas?', 'a' => 'Sí, en cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones en tiempo real.'],
		],
	],
	'pelotas-de-padel' => [
		'title' => 'Pelotas de pádel | Presión, durabilidad y ofertas',
		'desc' => 'Compra pelotas de pádel: opciones duraderas y económicas. Consejos de conservación y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/pelotas-de-padel',
		'faq' => [
			['q' => '¿Qué pelotas elegir según pista y clima?', 'a' => 'En pistas lentas o frío, elige pelotas más rápidas (bote alto). En pistas rápidas o calor, pelotas más controladas (bote medio).'],
			['q' => '¿Cada cuánto conviene cambiarlas?', 'a' => 'Cuando pierden bote o el fieltro está muy gastado; en partidos exigentes, algunas personas las cambian cada 1–2 encuentros.'],
			['q' => '¿Diferencias entre pelotas de pádel y de tenis?', 'a' => 'Las de pádel ajustan presión y fieltro para pistas más cortas y con arena, ofreciendo un bote y durabilidad acordes al juego.'],
			['q' => '¿Cómo conservar la presión y el fieltro?', 'a' => 'Guarda los botes cerrados, evita el calor directo y considera un presurizador; rota tubos si juegas a menudo.'],
			['q' => '¿Puedo ver precios y reseñas actualizadas?', 'a' => 'Sí, en cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones en tiempo real.'],
		],
	],
	'accesorios-padel' => [
		'title' => 'Accesorios de pádel | Overgrips, protectores y más',
		'desc' => 'Accesorios de pádel: agarre, protección, mantenimiento y confort. Recomendaciones y ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/accesorios-padel',
		'faq' => [
			['q' => '¿Qué overgrip me conviene, tacky o absorbente?', 'a' => 'Tacky mejora la adherencia; absorbente gestiona mejor el sudor. Si sudas mucho, prioriza el absorbente.'],
			['q' => '¿Cada cuánto debo cambiar el overgrip?', 'a' => 'Cuando pierda adherencia o se apelmace; en uso frecuente, muchas personas lo cambian cada 1–3 partidos.'],
			['q' => '¿Sirve el protector de marco para algo más que golpes?', 'a' => 'Sí, protege la pintura y puede variar ligeramente el balance, añadiendo un poco de peso en la cabeza.'],
			['q' => '¿Merece la pena un presurizador de pelotas?', 'a' => 'Si juegas a menudo, ayuda a conservar la presión y alarga la vida útil entre sesiones.'],
			['q' => '¿Qué accesorios básicos recomiendas para empezar?', 'a' => 'Overgrips, protector de marco, muñequeras o cinta y calcetines técnicos; añade presurizador si rotas muchas pelotas.'],
		],
	],
	'bolsas-y-paleteros' => [
		'title' => 'Bolsas y paleteros | Protección y organización',
		'desc' => 'Paleteros y mochilas de pádel: capacidad, protección y confort. Ofertas 2025 en Amazon.',
		'canonical' => 'https://materialdepadel.com/bolsas-y-paleteros',
		'faq' => [
			['q' => '¿Paletero o mochila de pádel?', 'a' => 'Paletero = más capacidad y bolsillos; mochila = compacta para 1 pala y uso diario.'],
			['q' => '¿Qué capacidad elegir?', 'a' => '1–2 palas para entrenos ligeros; 3–6 palas si compites o llevas equipación completa.'],
			['q' => '¿Sirve el compartimento térmico?', 'a' => 'Sí, protege gomas y planos del calor; útil en verano o si dejas la bolsa en el coche.'],
			['q' => '¿Calzado y ropa húmeda, cómo separarlos?', 'a' => 'Busca bolsillo de calzado ventilado y bolsa independiente para prendas mojadas.'],
			['q' => '¿Valen como equipaje de cabina?', 'a' => 'Algunas mochilas y paleteros compactos sí; revisa dimensiones del fabricante de la aerolínea.'],
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

PageManager::define('home', 'home'); 
PageManager::define('productos', 'pageProductos');
PageManager::define('marcas', 'pageMarcas');
PageManager::define('ofertas', 'pageOfertas');


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


AjaxNav::contentSelector('#main');
AjaxNav::mainScrollSelector('#main');
AjaxNav::registerFilter();
