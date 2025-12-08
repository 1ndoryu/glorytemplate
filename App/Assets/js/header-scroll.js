// Header scroll effect
// Agrega clase 'scrolled' al header cuando el usuario hace scroll
(function () {
    'use strict';

    var scrollThreshold = 50; // Pixeles de scroll antes de activar el efecto
    var isInitialized = false;

    function handleScroll() {
        var header = document.querySelector('.cosmoHeader');
        if (!header) return;

        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    function init() {
        var header = document.querySelector('.cosmoHeader');
        if (!header) return;

        // Ejecutar al cargar por si ya hay scroll
        handleScroll();

        // Solo agregar el listener una vez
        if (!isInitialized) {
            window.addEventListener('scroll', handleScroll, {passive: true});
            isInitialized = true;
        }
    }

    // Inicializacion en carga de pagina
    document.addEventListener('DOMContentLoaded', init);

    // Re-inicializacion despues de navegacion AJAX
    document.addEventListener('gloryRecarga', init);
})();
