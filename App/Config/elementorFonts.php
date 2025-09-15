<?php

// Exponer fuentes del tema en el selector de tipografías de Elementor

add_filter('elementor/fonts/groups', function ($groups) {
    $groups['tema'] = 'Tema';
    return $groups;
});

add_filter('elementor/fonts/additional_fonts', function ($fonts) {
    // Deben coincidir exactamente con los nombres declarados en @font-face de assets/css/fonts.css
    $fonts['Rinter'] = 'tema';
    $fonts['Source Sans 3'] = 'tema';
    $fonts['Gothic 60'] = 'tema';
    return $fonts;
});



