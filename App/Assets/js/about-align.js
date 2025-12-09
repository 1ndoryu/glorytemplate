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

        // Optimizacion: Separar lecturas de escrituras para evitar forced reflows
        // Fase 1: Recolectar todas las medidas primero (lecturas)
        var measurements = [];
        steps.forEach(function (step) {
            var marker = step.querySelector('.step-marker');
            var stepName = step.querySelector('.step-name');
            var stepTitle = step.querySelector('.step-title');

            if (!marker || !stepName) {
                measurements.push(null);
                return;
            }

            var data = {marker: marker, stepName: stepName};

            if (isMobile) {
                var titleHeight = 0;
                if (stepTitle) {
                    var titleStyle = getComputedStyle(stepTitle);
                    titleHeight = stepTitle.offsetHeight + parseFloat(titleStyle.marginBottom || 0) + parseFloat(titleStyle.marginTop || 0);
                }
                data.titleHeight = titleHeight;
                data.nameLineHeight = parseFloat(getComputedStyle(stepName).lineHeight) || 21;
                data.markerHeight = marker.offsetHeight;
            } else {
                data.markerRect = marker.getBoundingClientRect();
                data.nameRect = stepName.getBoundingClientRect();
                data.nameLineHeight = parseFloat(getComputedStyle(stepName).lineHeight) || 21;
            }

            measurements.push(data);
        });

        // Fase 2: Aplicar todas las escrituras en un solo batch (usando rAF para evitar layout thrashing)
        requestAnimationFrame(function () {
            measurements.forEach(function (data) {
                if (!data) return;

                var marker = data.marker;

                // Resetear estilos
                marker.style.marginTop = '0';
                marker.style.top = 'auto';
                marker.style.position = 'relative';

                if (isMobile) {
                    var alignOffset = data.titleHeight + data.nameLineHeight / 2 - data.markerHeight / 2;
                    if (alignOffset > 0) {
                        marker.style.marginTop = alignOffset + 'px';
                    }
                } else {
                    var markerCenter = data.markerRect.top + data.markerRect.height / 2;
                    var nameCenter = data.nameRect.top + data.nameLineHeight / 2;
                    var offset = nameCenter - markerCenter;
                    marker.style.top = offset + 'px';
                }
            });
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
