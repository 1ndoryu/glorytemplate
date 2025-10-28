<?php 

use Glory\Manager\AssetManager;
use Glory\Manager\PageManager;
use Glory\Admin\SyncManager;
use Glory\Helpers\AjaxNav;
use Glory\Core\GloryFeatures;

AssetManager::setThemeVersion('0.1.4');
add_filter('show_admin_bar', '__return_false');
SyncManager::setAdminBarVisible(true); 
SyncManager::setResetButtonVisible(true);


PageManager::setDefaultContentMode('editor');

// Defaults SEO por slug (título, descripción, canónica)
PageManager::setDefaultSeoMap([
    'home' => [
        'title' => 'Tienda Pádel: Palas, Zapatillas, Ropa y Ofertas en Amazon',
        'desc' => 'Guías y comparativas para elegir tu equipo de pádel: palas, zapatillas, ropa, pelotas y accesorios. Descubre marcas top y últimas ofertas en Amazon.',
        'canonical' => 'https://materialdepadel.com/',
        'breadcrumb' => [
            ['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
        ],
    ],
	'palas-de-padel' => [
		'title' => 'Palas de pádel | Control, potencia y ofertas en Amazon',
		'desc' => 'Compra palas de pádel baratas o de gama alta. Guía por nivel y forma. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/palas-de-padel/',
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
			'canonical' => 'https://materialdepadel.com/zapatillas-padel/',
		'faq' => [
			['q' => '¿Qué suela es mejor para pádel, clay o híbrida?', 'a' => 'La clay ofrece gran agarre y durabilidad; la híbrida equilibra agarre y deslizamiento si alternas superficies. La omni/microtaco funciona bien en superficies muy lisas, con menos agarre en pistas arenosas.'],
			['q' => '¿Cada cuánto debo cambiar las zapatillas de pádel?', 'a' => 'Según uso y desgaste: muchas personas las cambian cada 6–12 meses o cuando la espiga pierde relieve.'],
			['q' => '¿Diferencias con zapatillas de tenis o running?', 'a' => 'Las de pádel priorizan la estabilidad lateral y suela específica para pistas con arena o sintético.'],
			['q' => '¿Cómo elijo talla y ajuste?', 'a' => 'Deja ~1 cm en puntera, pruébalas con tus calcetines habituales y valora media talla más si notas presión lateral.'],
			['q' => '¿Puedo ver precios y reseñas actualizadas?', 'a' => 'Sí, en cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones en tiempo real.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Zapatillas de pádel', 'url' => 'https://materialdepadel.com/zapatillas-padel/'],
		],
	],
	'ropa-padel' => [
		'title' => 'Ropa de pádel | Transpirable, térmica y ofertas en Amazon',
		'desc' => 'Compra ropa de pádel hombre y mujer. Guía por prendas, tejidos y temporada: transpirable o térmica. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/ropa-padel/',
		'faq' => [
			['q' => '¿Qué ropa de pádel es mejor para verano?', 'a' => 'Camisetas y shorts transpirables con paneles de malla y secado rápido; colores claros para mayor confort.'],
			['q' => '¿Y para invierno?', 'a' => 'Primera capa térmica y sudadera o chaqueta ligera que no limite la movilidad.'],
			['q' => '¿En qué me fijo en los tejidos?', 'a' => 'Poliéster/elastano por elasticidad y secado rápido; costuras planas y patronaje deportivo para evitar roces.'],
			['q' => '¿Ropa de pádel y de running sirven igual?', 'a' => 'La de pádel prioriza movilidad lateral y ventilación en zonas clave; la de running está pensada para impacto lineal.'],
			['q' => '¿Puedo ver precios y reseñas actualizadas?', 'a' => 'Sí, en cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones en tiempo real.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Ropa de pádel', 'url' => 'https://materialdepadel.com/ropa-padel/'],
		],
	],
	'pelotas-de-padel' => [
		'title' => 'Pelotas de pádel | Bote, velocidad y ofertas en Amazon',
		'desc' => 'Compra pelotas de pádel baratas o homologadas. Guía por bote, velocidad y clima. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/pelotas-de-padel/',
		'faq' => [
			['q' => '¿Qué pelotas elegir según pista y clima?', 'a' => 'En pistas lentas o frío, elige pelotas más rápidas (bote alto). En pistas rápidas o calor, pelotas más controladas (bote medio).'],
			['q' => '¿Cada cuánto conviene cambiarlas?', 'a' => 'Cuando pierden bote o el fieltro está muy gastado; en partidos exigentes, algunas personas las cambian cada 1–2 encuentros.'],
			['q' => '¿Diferencias entre pelotas de pádel y de tenis?', 'a' => 'Las de pádel ajustan presión y fieltro para pistas más cortas y con arena, ofreciendo un bote y durabilidad acordes al juego.'],
			['q' => '¿Cómo conservar la presión y el fieltro?', 'a' => 'Guarda los botes cerrados, evita el calor directo y considera un presurizador; rota tubos si juegas a menudo.'],
			['q' => '¿Puedo ver precios y reseñas actualizadas?', 'a' => 'Sí, en cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones en tiempo real.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Pelotas de pádel', 'url' => 'https://materialdepadel.com/pelotas-de-padel/'],
		],
	],
	'accesorios-padel' => [
		'title' => 'Accesorios de pádel | Overgrips, protectores y ofertas en Amazon',
		'desc' => 'Compra accesorios de pádel baratos: overgrips, protectores, muñequeras, calcetines y presurizadores. Guía y mantenimiento. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/accesorios-padel/',
		'faq' => [
			['q' => '¿Qué overgrip me conviene, tacky o absorbente?', 'a' => 'Tacky mejora la adherencia; absorbente gestiona mejor el sudor. Si sudas mucho, prioriza el absorbente.'],
			['q' => '¿Cada cuánto debo cambiar el overgrip?', 'a' => 'Cuando pierda adherencia o se apelmace; en uso frecuente, muchas personas lo cambian cada 1–3 partidos.'],
			['q' => '¿Sirve el protector de marco para algo más que golpes?', 'a' => 'Sí, protege la pintura y puede variar ligeramente el balance, añadiendo un poco de peso en la cabeza.'],
			['q' => '¿Merece la pena un presurizador de pelotas?', 'a' => 'Si juegas a menudo, ayuda a conservar la presión y alarga la vida útil entre sesiones.'],
			['q' => '¿Qué accesorios básicos recomiendas para empezar?', 'a' => 'Overgrips, protector de marco, muñequeras o cinta y calcetines técnicos; añade presurizador si rotas muchas pelotas.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Accesorios de pádel', 'url' => 'https://materialdepadel.com/accesorios-padel/'],
		],
	],
	'bolsas-y-paleteros' => [
		'title' => 'Bolsas y paleteros de pádel | Térmicos y mochila',
		'desc' => 'Compra bolsas y paleteros de pádel: térmicos, con compartimento de calzado y mochilas. Guía por capacidad y materiales. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/bolsas-y-paleteros/',
		'faq' => [
			['q' => '¿Paletero o mochila de pádel?', 'a' => 'Paletero = más capacidad y bolsillos; mochila = compacta para 1 pala y uso diario.'],
			['q' => '¿Qué capacidad elegir?', 'a' => '1–2 palas para entrenos ligeros; 3–6 palas si compites o llevas equipación completa.'],
			['q' => '¿Sirve el compartimento térmico?', 'a' => 'Sí, protege gomas y planos del calor; útil en verano o si dejas la bolsa en el coche.'],
			['q' => '¿Calzado y ropa húmeda, cómo separarlos?', 'a' => 'Busca bolsillo de calzado ventilado y bolsa independiente para prendas mojadas.'],
			['q' => '¿Valen como equipaje de cabina?', 'a' => 'Algunas mochilas y paleteros compactos sí; revisa dimensiones del fabricante de la aerolínea.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Bolsas y paleteros de pádel', 'url' => 'https://materialdepadel.com/bolsas-y-paleteros/'],
		],
	],
	'ofertas' => [
		'title' => 'Ofertas de pádel | Descuentos en palas, zapatillas y más',
		'desc' => 'Ofertas de pádel 2025: palas, zapatillas, ropa, pelotas y accesorios con descuento. Consulta precio y valoraciones en Amazon.',
			'canonical' => 'https://materialdepadel.com/ofertas/',
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
			'canonical' => 'https://materialdepadel.com/marcas/adidas/',
		'faq' => [
			['q' => '¿Para quién son las palas Adidas de control?', 'a' => 'Ideales si buscas seguridad desde el fondo y regularidad; suelen ser redondas y de tacto cómodo.'],
			['q' => '¿Adidas tiene palas potentes para rematar?', 'a' => 'Sí. Mira modelos diamante con balance alto y planos más firmes para ganar pegada.'],
			['q' => '¿Qué peso elegir en palas Adidas?', 'a' => 'Como guía general, 355–365 g para adulto; ajusta según fuerza y antecedentes de codo u hombro.'],
			['q' => '¿Carbono o fibra de vidrio en Adidas?', 'a' => 'Carbono = precisión y estabilidad; fibra de vidrio = mayor confort y mejor precio.'],
			['q' => '¿Dónde veo precios y reseñas actualizadas de palas Adidas?', 'a' => 'En cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Adidas', 'url' => 'https://materialdepadel.com/marcas/adidas/'],
		],
	],
	'bullpadel' => [
		'title' => 'Palas de pádel Bullpadel | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Bullpadel por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/bullpadel/',
		'faq' => [
			['q' => '¿Bullpadel tiene palas cómodas para empezar?', 'a' => 'Sí; busca modelos con tacto blando/medio y buena tolerancia para fallar menos al inicio.'],
			['q' => 'Quiero potencia en la red, ¿qué debo priorizar?', 'a' => 'Una pala con respuesta rápida, buena estabilidad al impacto y sensación más firme.'],
			['q' => 'Si tengo codo sensible, ¿qué me conviene?', 'a' => 'Palas cómodas (menos vibración) y peso contenido; añade overgrip para mejorar agarre sin tensar el antebrazo.'],
			['q' => '¿Qué peso es orientativo en Bullpadel para adulto?', 'a' => 'De forma general, 355–365 g; ajusta según fuerza, frecuencia de juego y sensaciones.'],
			['q' => '¿Dónde veo precios y reseñas de palas Bullpadel?', 'a' => 'En las tarjetas AAWP, pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Bullpadel', 'url' => 'https://materialdepadel.com/marcas/bullpadel/'],
		],
	],
	'nox' => [
		'title' => 'Palas de pádel NOX | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel NOX por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/nox/',
		'faq' => [
			['q' => '¿NOX tiene palas cómodas para empezar?', 'a' => 'Sí; prioriza modelos con tacto amable y buena tolerancia para ganar confianza rápido.'],
			['q' => 'Quiero más potencia arriba, ¿qué NOX me conviene?', 'a' => 'Una pala con respuesta rápida, buena estabilidad y sensación algo más firme para transferir energía.'],
			['q' => 'Si busco control desde el fondo, ¿qué priorizo?', 'a' => 'Salida constante, maniobrabilidad y que perdone cuando no impactas al centro.'],
			['q' => '¿Carbono o fibra de vidrio en NOX?', 'a' => 'Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Dónde ver precios y reseñas de palas NOX?', 'a' => 'En cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel NOX', 'url' => 'https://materialdepadel.com/marcas/nox/'],
		],
	],
	'babolat' => [
		'title' => 'Palas de pádel Babolat | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Babolat por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/babolat/',
		'faq' => [
			['q' => '¿Babolat tiene palas cómodas para empezar?', 'a' => 'Sí; modelos con tacto amable y punto dulce amplio ayudan a fallar menos y ganar confianza.'],
			['q' => 'Busco potencia clara en la red, ¿qué priorizo en Babolat?', 'a' => 'Respuesta rápida, buena estabilidad al impacto y tacto más firme para transferir energía.'],
			['q' => 'Juego variado (defiendo y ataco), ¿qué me conviene?', 'a' => 'Una pala equilibrada con salida progresiva y agilidad en la volea para cambiar de ritmo sin perder control.'],
			['q' => '¿Carbono o fibra de vidrio en Babolat?', 'a' => 'Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Dónde veo precios y reseñas de palas Babolat?', 'a' => 'En las tarjetas AAWP, pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Babolat', 'url' => 'https://materialdepadel.com/marcas/babolat/'],
		],
	],
	'head' => [
		'title' => 'Palas de pádel Head | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Head por nivel y preferencias. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/head/',
		'faq' => [
			['q' => '¿Head tiene palas cómodas para empezar?', 'a' => 'Sí; prioriza modelos con baja vibración y punto dulce amplio para ganar seguridad.'],
			['q' => 'Quiero control desde el fondo, ¿qué busco en Head?', 'a' => 'Salida constante, pala maniobrable y que perdone los golpes descentrados.'],
			['q' => '¿Y si busco potencia en la red?', 'a' => 'Respuesta rápida, buena estabilidad al impacto y tacto algo más firme para transferir energía.'],
			['q' => '¿Qué peso orientativo recomiendas en Head?', 'a' => 'De forma general, 355–365 g en adulto; ajusta según fuerza y comodidad del antebrazo.'],
			['q' => '¿Carbono o fibra de vidrio en Head?', 'a' => 'Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Dónde veo precios y reseñas de palas Head?', 'a' => 'En cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Head', 'url' => 'https://materialdepadel.com/marcas/head/'],
		],
	],
	'siux' => [
		'title' => 'Palas de pádel Siux | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Siux por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/siux/',
		'faq' => [
			['q' => '¿Siux tiene palas cómodas para empezar?', 'a' => 'Sí; prioriza modelos con poco castigo al brazo, punto dulce grande y tacto amable para ganar confianza.'],
			['q' => 'Quiero potencia arriba, ¿qué buscar en Siux?', 'a' => 'Respuesta rápida, buena estabilidad al impacto y sensación algo más firme para transferir energía en remates.'],
			['q' => 'Juego variado, ¿qué Siux me conviene?', 'a' => 'Una pala equilibrada con salida progresiva y agilidad en la red para pasar de defensa a ataque sin sorpresas.'],
			['q' => '¿Carbono o fibra de vidrio en Siux?', 'a' => 'Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Dónde veo precios y reseñas de palas Siux?', 'a' => 'En las tarjetas AAWP, pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Siux', 'url' => 'https://materialdepadel.com/marcas/siux/'],
		],
	],
	'black-crown' => [
		'title' => 'Palas de pádel Black Crown | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Black Crown por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/black-crown/',
		'faq' => [
			['q' => '¿Black Crown tiene palas cómodas para empezar?', 'a' => 'Sí; prioriza modelos con poca vibración y punto dulce amplio para ganar seguridad desde el primer día.'],
			['q' => 'Si busco control, ¿qué debo mirar en Black Crown?', 'a' => 'Salida predecible, pala maniobrable y que perdone cuando no impactas perfecto.'],
			['q' => 'Quiero potencia arriba, ¿qué me conviene?', 'a' => 'Respuesta rápida, buena estabilidad al golpear y tacto algo más firme para transferir energía.'],
			['q' => 'Juego variado, ¿hay opciones polivalentes?', 'a' => 'Sí, palas con salida progresiva y agilidad en la red para pasar de defensa a ataque sin sorpresas.'],
			['q' => '¿Carbono o fibra de vidrio en Black Crown?', 'a' => 'Carbono = más precisión; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Dónde veo precios y reseñas de palas Black Crown?', 'a' => 'En las tarjetas AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Black Crown', 'url' => 'https://materialdepadel.com/marcas/black-crown/'],
		],
	],
	'star-vie' => [
		'title' => 'Palas de pádel Star Vie | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Star Vie por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/star-vie/',
		'faq' => [
			['q' => '¿Star Vie tiene palas cómodas para empezar?', 'a' => 'Sí; busca modelos con tacto amable, baja vibración y punto dulce amplio para ganar seguridad.'],
			['q' => 'Quiero más control, ¿qué debo priorizar en Star Vie?', 'a' => 'Salida predecible, pala maniobrable y que perdone el golpe descentrado.'],
			['q' => 'Si busco potencia arriba, ¿qué me conviene?', 'a' => 'Respuesta rápida, buena estabilidad al impacto y tacto algo más firme para transferir energía.'],
			['q' => 'Juego variado (defiendo y ataco), ¿hay opciones polivalentes?', 'a' => 'Sí, palas con salida progresiva y agilidad en la volea para cambiar de ritmo sin sorpresas.'],
			['q' => '¿Carbono o fibra de vidrio en Star Vie?', 'a' => 'Carbono = más precisión; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Dónde veo precios y reseñas de palas Star Vie?', 'a' => 'En las tarjetas AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Star Vie', 'url' => 'https://materialdepadel.com/marcas/star-vie/'],
		],
	],
	'vibor-a' => [
		'title' => 'Palas de pádel Vibor-A | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Vibor-A por nivel y estilo de juego. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/vibor-a/',
		'faq' => [
			['q' => '¿Vibor-A tiene palas cómodas para empezar?', 'a' => 'Sí; prioriza modelos con tacto amable, baja vibración y punto dulce amplio para ganar confianza.'],
			['q' => 'Quiero potencia arriba, ¿qué debo buscar en Vibor-A?', 'a' => 'Respuesta rápida, buena estabilidad al impacto y tacto algo más firme para transferir energía en remates.'],
			['q' => 'Si juego a construir desde el fondo, ¿qué me conviene?', 'a' => 'Salida constante, pala maniobrable y que perdone cuando no impactas al centro.'],
			['q' => '¿Carbono o fibra de vidrio en Vibor-A?', 'a' => 'Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Qué peso orientativo recomendáis?', 'a' => 'De forma general, 355–365 g en adulto; ajusta según fuerza, frecuencia de juego y sensaciones.'],
			['q' => '¿Dónde veo precios y reseñas de palas Vibor-A?', 'a' => 'En cada tarjeta AAWP pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
		],
		'breadcrumb' => [
			['name' => 'Inicio', 'url' => 'https://materialdepadel.com/'],
			['name' => 'Palas de pádel Vibor-A', 'url' => 'https://materialdepadel.com/marcas/vibor-a/'],
		],
	],
	'wilson' => [
		'title' => 'Palas de pádel Wilson | Control, potencia y ofertas',
		'desc' => 'Compra palas de pádel Wilson por nivel y sensaciones. Consulta precio y ofertas 2025 en Amazon.',
			'canonical' => 'https://materialdepadel.com/marcas/wilson/',
		'faq' => [
			['q' => '¿Wilson tiene palas recomendadas para empezar?', 'a' => 'Sí; modelos con tacto amable, baja vibración y punto dulce amplio para ganar seguridad desde el inicio.'],
			['q' => 'Si busco control desde el fondo, ¿qué priorizo en Wilson?', 'a' => 'Salida constante, pala maniobrable y que perdone cuando no impactas al centro.'],
			['q' => 'Quiero potencia en la red, ¿qué me conviene?', 'a' => 'Respuesta rápida, buena estabilidad y un tacto algo más firme para transferir mejor la energía.'],
			['q' => 'Juego variado (defiendo y ataco), ¿hay opciones polivalentes?', 'a' => 'Sí, palas con salida progresiva y agilidad en la volea para cambiar de ritmo con confianza.'],
			['q' => '¿Carbono o fibra de vidrio en Wilson?', 'a' => 'Carbono = más precisión y golpe definido; fibra de vidrio = confort y brazo más descansado.'],
			['q' => '¿Dónde veo precios y reseñas de palas Wilson?', 'a' => 'En las tarjetas AAWP, pulsa "Consultar precio en Amazon" para ver precio y valoraciones al día.'],
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
