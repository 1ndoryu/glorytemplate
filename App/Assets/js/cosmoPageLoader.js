(function () {
    'use strict';

    var LOADER_ID = 'cosmoPageLoader';
    var HIDDEN_CLASS = 'isHidden';
    // Tiempo minimo que el loader permanece visible (evita parpadeos rapidos)
    var SHOW_MIN_MS = 800;

    var lastShowTime = Date.now();
    var hideTimeout = null;

    // Obtiene el loader existente del DOM (embebido en header.php)
    // Ya no lo creamos dinamicamente para que aparezca instantaneamente
    function getLoaderElement() {
        return document.getElementById(LOADER_ID);
    }

    function showLoader() {
        var loader = getLoaderElement();
        if (!loader) return;

        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        loader.classList.remove(HIDDEN_CLASS);
        lastShowTime = Date.now();
    }

    function hideLoader() {
        var loader = getLoaderElement();
        if (!loader) return;

        var elapsed = Date.now() - lastShowTime;
        var remaining = Math.max(0, SHOW_MIN_MS - elapsed);

        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        hideTimeout = setTimeout(function () {
            loader.classList.add(HIDDEN_CLASS);
            hideTimeout = null;

            try {
                var ev = new CustomEvent('cosmoPageLoaderHidden');
                document.dispatchEvent(ev);
            } catch (_e) {}
        }, remaining);
    }

    function handleAjaxClick(e) {
        // Ignorar clics con teclas modificadoras
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return;
        }

        var target = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!target || !target.href) {
            return;
        }

        // Ignorar enlaces externos, descargas, target _blank
        if (target.target === '_blank' || target.hasAttribute('download')) {
            return;
        }

        // Verificar que sea un enlace interno
        if (typeof window.location !== 'undefined') {
            try {
                var dest = new URL(target.href, window.location.origin);
                var cur = new URL(window.location.href, window.location.origin);

                // Diferente origen = enlace externo
                if (dest.origin !== cur.origin) {
                    return;
                }

                // Mismo URL exacto sin hash
                if (dest.href === cur.href && !dest.hash) {
                    return;
                }

                // Solo cambio de hash en la misma pagina
                if (dest.pathname === cur.pathname && dest.hash && !target.getAttribute('href').startsWith('http')) {
                    return;
                }
            } catch (_e) {}
        }

        // Ignorar enlaces con clase noAjax
        if (target.classList.contains('noAjax') || (target.closest && target.closest('.noAjax'))) {
            return;
        }

        showLoader();
    }

    function handleGloryRecarga() {
        hideLoader();
    }

    function boot() {
        if (!document.body) {
            return;
        }

        // Si Fusion Builder esta activo, desactivar el loader
        if (window.isFusionBuilderActive && window.isFusionBuilderActive()) {
            var loader = getLoaderElement();
            if (loader) {
                loader.classList.add(HIDDEN_CLASS);
            }
            return;
        }

        // El loader ya existe en el HTML, solo registramos los event listeners

        document.body.addEventListener('click', handleAjaxClick, false);
        document.addEventListener('gloryRecarga', handleGloryRecarga);

        // Ocultar loader cuando la pagina termine de cargar
        window.addEventListener('load', hideLoader);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
