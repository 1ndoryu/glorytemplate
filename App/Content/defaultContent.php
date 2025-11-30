<?php

use Glory\Manager\DefaultContentManager;

DefaultContentManager::define('libro', [
    [
        'slugDefault' => 'las-48-leyes-del-poder',
        'titulo'      => 'Las 48 Leyes del Poder',
        'contenido'   => 'Un libro de Robert Greene que explora las dinámicas del poder a través de la historia.',
        'imagenDestacadaAsset' => 'elements::libros/48leyesdelpoder.png',
    ],
    [
        'slugDefault' => 'alicia-en-el-pais-de-las-maravillas',
        'titulo'      => 'Alicia en el País de las Maravillas',
        'contenido'   => 'Un clásico de Lewis Carroll sobre las fantásticas aventuras de una niña llamada Alicia.',
        'imagenDestacadaAsset' => 'elements::libros/aliciaenelpais.jpg',
    ],
    [
        'slugDefault' => 'el-principito',
        'titulo'      => 'El Principito',
        'contenido'   => 'Una novela poética de Antoine de Saint-Exupéry que reflexiona sobre la vida, el amor y la amistad.',
        'imagenDestacadaAsset' => 'elements::libros/principito.jpeg',
    ],
]);

if (\Glory\Core\GloryFeatures::isActive('gbn')) {
    DefaultContentManager::define('pokemon', [
        [
            'slugDefault' => 'pikachu',
            'titulo'      => 'Pikachu',
            'contenido'   => 'Pikachu es un Pokémon de tipo eléctrico introducido en la primera generación. Es el Pokémon más conocido de la historia, ya que es el acompañante del protagonista del anime, Ash Ketchum.',
            'imagenDestacadaAsset' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        ],
        [
            'slugDefault' => 'charizard',
            'titulo'      => 'Charizard',
            'contenido'   => 'Charizard es un Pokémon de tipo fuego/volador introducido en la primera generación. Es la evolución de Charmeleon.',
            'imagenDestacadaAsset' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
        ],
        [
            'slugDefault' => 'bulbasaur',
            'titulo'      => 'Bulbasaur',
            'contenido'   => 'Bulbasaur es un Pokémon de tipo planta/veneno introducido en la primera generación. Es uno de los Pokémon iniciales de la región de Kanto.',
            'imagenDestacadaAsset' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
        ],
        [
            'slugDefault' => 'squirtle',
            'titulo'      => 'Squirtle',
            'contenido'   => 'Squirtle es un Pokémon de tipo agua introducido en la primera generación. Es uno de los Pokémon iniciales de la región de Kanto.',
            'imagenDestacadaAsset' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png',
        ],
        [
            'slugDefault' => 'gengar',
            'titulo'      => 'Gengar',
            'contenido'   => 'Gengar es un Pokémon de tipo fantasma/veneno introducido en la primera generación. Es la evolución de Haunter.',
            'imagenDestacadaAsset' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
        ],
        [
            'slugDefault' => 'mewtwo',
            'titulo'      => 'Mewtwo',
            'contenido'   => 'Mewtwo es un Pokémon legendario y artificial de tipo psíquico introducido en la primera generación.',
            'imagenDestacadaAsset' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
        ],
    ]);
}
