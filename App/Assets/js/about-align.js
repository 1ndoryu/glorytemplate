/**
 * About Timeline Marker Alignment
 *
 * Alinea cada marcador (C, O, S, M, O) verticalmente con su step-name
 * tanto en vista mobile como desktop.
 * Se re-inicializa despues de navegacion AJAX.
 */
(function () {
    'use strict';

    var MOBILE_BREAKPOINT = 768;
    var resizeListenerAdded = false;

    function alignMarkers() {
        var isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        var steps = document.querySelectorAll('.about-container .method-step');

        if (steps.length === 0) return;

        steps.forEach(function (step, index) {
            var marker = step.querySelector('.step-marker');
            var stepName = step.querySelector('.step-name');
            var stepTitle = step.querySelector('.step-title');

            if (!marker || !stepName) return;

            // Resetear completamente los estilos previos
            marker.style.marginTop = '0';
            marker.style.top = 'auto';
            marker.style.position = 'relative';

            if (isMobile) {
                // MOBILE: step-title esta en flow normal
                var titleHeight = 0;
                if (stepTitle) {
                    var titleStyle = getComputedStyle(stepTitle);
                    titleHeight = stepTitle.offsetHeight + parseFloat(titleStyle.marginBottom || 0) + parseFloat(titleStyle.marginTop || 0);
                }

                var nameLineHeight = parseFloat(getComputedStyle(stepName).lineHeight) || 21;
                var markerHeight = marker.offsetHeight;
                var alignOffset = titleHeight + nameLineHeight / 2 - markerHeight / 2;

                if (alignOffset > 0) {
                    marker.style.marginTop = alignOffset + 'px';
                }
            } else {
                // DESKTOP: Usar posiciones reales con getBoundingClientRect
                // Forzar un reflow para obtener medidas correctas
                void step.offsetHeight;

                var markerRect = marker.getBoundingClientRect();
                var nameRect = stepName.getBoundingClientRect();

                // Calcular cuanto debe moverse el marker para alinearse con step-name
                var markerCenter = markerRect.top + markerRect.height / 2;
                var nameLineHeight = parseFloat(getComputedStyle(stepName).lineHeight) || 21;
                var nameCenter = nameRect.top + nameLineHeight / 2;

                // Diferencia entre donde esta el marker y donde deberia estar
                var offset = nameCenter - markerCenter;

                // Aplicar el offset
                marker.style.top = offset + 'px';
            }
        });
    }

    function debounce(func, wait) {
        var timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(func, wait);
        };
    }

    var debouncedAlign = debounce(alignMarkers, 150);

    function init() {
        // Esperar un poco para que el layout se estabilice
        setTimeout(alignMarkers, 100);

        // Solo agregar listeners una vez
        if (!resizeListenerAdded) {
            window.addEventListener('resize', debouncedAlign);
            resizeListenerAdded = true;
        }

        // Re-calcular cuando las fuentes carguen
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                setTimeout(alignMarkers, 50);
            });
        }
    }

    // Inicializacion en carga de pagina
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-inicializacion despues de navegacion AJAX
    document.addEventListener('gloryRecarga', init);
})();
