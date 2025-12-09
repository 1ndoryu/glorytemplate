(function (window, doc) {
    'use strict';

    function Grained(ele, opt) {
        var element = null,
            options = opt || {};

        if (typeof ele === 'string') {
            element = doc.querySelectorAll(ele);
        } else if (typeof ele === 'object') {
            element = [ele];
        }

        if (!element || element.length === 0) {
            console.error('Grained: Element not found');
            return;
        }

        var defaults = {
            animate: false, // Static by default
            patternWidth: 100,
            patternHeight: 100,
            grainOpacity: 0.01,
            grainDensity: 1,
            grainWidth: 1,
            grainHeight: 1
        };

        for (var key in defaults) {
            if (!options.hasOwnProperty(key)) {
                options[key] = defaults[key];
            }
        }

        var generateNoise = function () {
            var canvas = doc.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = options.patternWidth;
            canvas.height = options.patternHeight;

            for (var w = 0; w < options.patternWidth; w += options.grainWidth) {
                for (var h = 0; h < options.patternHeight; h += options.grainHeight) {
                    var rgb = (Math.random() * 256) | 0;
                    var alpha = Math.random() * options.grainOpacity;

                    ctx.fillStyle = 'rgba(' + rgb + ',' + rgb + ',' + rgb + ',' + alpha + ')';
                    ctx.fillRect(w, h, options.grainWidth, options.grainHeight);
                }
            }
            return canvas.toDataURL('image/png');
        };

        var noiseUrl = generateNoise();

        // Optimizacion: Leer todos los estilos primero para evitar layout thrashing
        var positions = [];
        for (var i = 0; i < element.length; i++) {
            positions.push(getComputedStyle(element[i]).position);
        }

        // Luego aplicar todos los cambios
        for (var i = 0; i < element.length; i++) {
            var item = element[i];

            // Ensure container is relative (usando valor cacheado)
            if (positions[i] === 'static') {
                item.style.position = 'relative';
            }

            var noiseDiv = doc.createElement('div');
            noiseDiv.className = 'grained-overlay';
            noiseDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;z-index:1;pointer-events:none;background-image:url(' + noiseUrl + ');background-repeat:repeat';

            // Insert as first child
            if (item.firstChild) {
                item.insertBefore(noiseDiv, item.firstChild);
            } else {
                item.appendChild(noiseDiv);
            }
        }
    }

    window.grained = Grained;
})(window, document);
