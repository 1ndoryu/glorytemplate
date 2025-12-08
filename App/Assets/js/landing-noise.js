// Landing noise effect usando grained.js
// Se re-inicializa despues de navegacion AJAX
(function () {
    'use strict';

    function initNoise() {
        var heroSection = document.querySelector('.landing-container .hero-section');
        if (!heroSection || !window.grained) return;

        // Limpiar overlay anterior si existe (evita duplicados en navegacion AJAX)
        var existingOverlay = heroSection.querySelector('.grained-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Options for Grained.js
        var options = {
            animate: false, // Ruido estatico
            patternWidth: 100,
            patternHeight: 100,
            grainOpacity: 0.05, // Adjusted for subtle effect
            grainDensity: 1,
            grainWidth: 1,
            grainHeight: 1
        };

        window.grained(heroSection, options);
    }

    // Inicializacion en carga de pagina
    document.addEventListener('DOMContentLoaded', initNoise);

    // Re-inicializacion despues de navegacion AJAX
    document.addEventListener('gloryRecarga', initNoise);
})();
