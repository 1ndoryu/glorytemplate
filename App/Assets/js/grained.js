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

        for (var i = 0; i < element.length; i++) {
            var item = element[i];

            // Ensure container is relative
            if (getComputedStyle(item).position === 'static') {
                item.style.position = 'relative';
            }

            var noiseDiv = doc.createElement('div');
            noiseDiv.className = 'grained-overlay';
            noiseDiv.style.position = 'absolute';
            noiseDiv.style.top = '0';
            noiseDiv.style.left = '0';
            noiseDiv.style.width = '100%';
            noiseDiv.style.height = '100%';
            noiseDiv.style.overflow = 'hidden';
            noiseDiv.style.zIndex = '1';
            noiseDiv.style.pointerEvents = 'none';
            noiseDiv.style.backgroundImage = 'url(' + noiseUrl + ')';
            noiseDiv.style.backgroundRepeat = 'repeat';

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
