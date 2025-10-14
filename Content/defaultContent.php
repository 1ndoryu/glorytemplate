<?php

use Glory\Manager\DefaultContentManager;
use Glory\Utility\AssetsUtility;


// 3) Párrafos de ejemplo (en inglés) sobre arte
$parrafosArte = [
	"Art is a slow conversation between the hand and the eye, where forms are negotiated rather than declared. In the quiet intervals of sketching, the mind rehearses countless possibilities, bending light into meaning, shadow into memory. Every brushstroke is a wager, a way of asking the surface what it might become when color meets intention and ambiguity is allowed to breathe.",
	"In contemporary practice, color is not mere ornament; it is structure and tempo. Saturated hues can quicken the pulse of a composition, while subdued palettes decelerate perception, inviting longer pauses. Artists choreograph these rhythms, trusting that viewers will listen with their eyes and discover the silent cadences threaded through the canvas.",
	"Materials carry their own dialects. Graphite murmurs, oil paint sings, clay gathers breath in the palm. The artist translates across these tongues, letting accidents intervene—drips, scrapes, and fractures that reveal the work's honest weather. What appears as control is often a pact with chance, a willingness to be surprised.",
	"Abstraction is not the absence of reality but an argument with it. By loosening resemblance, the painter loosens certainty, too, making room for the viewer's private geographies. A field of marks can feel like a remembered street; a single line can hold the gravity of a horizon after rain.",
	"Great composition balances contradictions: weight and lift, density and air, pattern and rupture. The eye travels these borders like a curious pilgrim, collecting small astonishments. When balance is felt—not calculated—the work begins to breathe, and looking becomes a form of listening.",
	"Texture is time made visible. A scumbled surface recalls the repetition of days; a polished one, the insistence of revision. Viewers read these textures like diaries, tracing the insistence of the maker's attention, the edits and hesitations that finally settle into presence.",
	"The history of art is a chorus of continuities and refusals. Each new voice borrows a note from the past, then bends it, sometimes gently, sometimes to the point of breaking. Innovation rarely arrives with a shout; more often it returns as an echo reframed by different rooms.",
	"To draw is to measure with empathy. The line does not simply outline a body; it lingers where weight gathers and where tenderness leaves a trace. In this sense, representation becomes an ethics: a way of attending to the world that refuses haste and accepts complexity.",
];

// 3) Títulos cortos (2 palabras) específicos
$titulos = [
	'Color Memory',
	'Quiet Horizon',
	'Velvety Light',
	'Fractured Echo',
	'Chromatic Drift',
	'Tactile Silence',
	'Borrowed Rhythm',
	'Veiled Geometry',
	'Patient Line',
	'Weathered Surface',
];

// 4) Generar definiciones usando el helper nativo
$definiciones = DefaultContentManager::buildSamplePosts(
	$titulos,
	$parrafosArte,
	[ 'aliasImagenes' => 'colors', 'minBytes' => 103424 ]
);

// 5) Registrar definiciones para el tipo de post nativo 'post'
DefaultContentManager::define('post', $definiciones, 'smart', false);
