(function(){
    var header, burger, backgroundBtn, navMenu;
    var observado = false;

    function esMovil(){
        return window.matchMedia('(max-width: 999px)').matches;
    }

    function getColorTexto(){
        return 'var(--text)';
    }

    function aplicarColoresMenuAbierto(){
        if (!header) return;
        var logo = header.querySelector('.siteMenuLogo');
        var logoLink = header.querySelector('.siteMenuLogo a');
        var logoImg = header.querySelector('.siteMenuLogo img');
        var logoSvg = header.querySelector('.siteMenuLogo svg');

        if (burger){
            burger.style.color = getColorTexto();
        }
        if (logo){
            logo.style.color = getColorTexto();
        }
        if (logoLink){
            logoLink.style.color = getColorTexto();
        }
        if (logoImg){
            // Forzar versión negra
            logoImg.style.filter = 'brightness(0) invert(0)';
        }
        if (logoSvg){
            // Evitar filtros de adaptiveHeader
            logoSvg.style.filter = '';
            logoSvg.style.color = getColorTexto();
        }
    }

    function limpiarColoresMenu(){
        if (!header) return;
        var logo = header.querySelector('.siteMenuLogo');
        var logoLink = header.querySelector('.siteMenuLogo a');
        var logoImg = header.querySelector('.siteMenuLogo img');
        var logoSvg = header.querySelector('.siteMenuLogo svg');

        if (burger){
            burger.style.removeProperty('color');
        }
        if (logo){
            logo.style.removeProperty('color');
        }
        if (logoLink){
            logoLink.style.removeProperty('color');
        }
        if (logoImg){
            logoImg.style.removeProperty('filter');
        }
        if (logoSvg){
            logoSvg.style.removeProperty('filter');
            logoSvg.style.removeProperty('color');
        }
    }

    function cerrarMenu(){
        if (!header || !header.classList.contains('open')) return;
        if (backgroundBtn){
            // Reutiliza el cierre nativo del menú de Glory
            backgroundBtn.click();
        } else if (burger){
            burger.click();
        } else {
            document.body.classList.remove('menu-open');
            header.classList.remove('open');
        }
    }

    function onHeaderClaseMutada(){
        if (!header) return;
        if (header.classList.contains('open')){
            aplicarColoresMenuAbierto();
            // Mientras esté abierto, asegurar colores ante scroll/resize/adaptive
            window.addEventListener('scroll', aplicarColoresMenuAbierto, { passive: true });
            window.addEventListener('resize', aplicarColoresMenuAbierto, { passive: true });
        } else {
            limpiarColoresMenu();
            window.removeEventListener('scroll', aplicarColoresMenuAbierto);
            window.removeEventListener('resize', aplicarColoresMenuAbierto);
            // Forzar recalculo inmediato del contraste del header
            if (typeof window !== 'undefined') {
                requestAnimationFrame(function(){
                    try { window.dispatchEvent(new Event('resize')); } catch(_) {}
                    try { window.dispatchEvent(new Event('scroll')); } catch(_) {}
                });
            }
        }
    }

    function enlazarCierreEnlaces(){
        if (!navMenu) return;
        var enlaces = navMenu.querySelectorAll('a');
        enlaces.forEach(function(a){
            // Evitar duplicar listeners
            if (a.__menuTemaBound) return;
            a.__menuTemaBound = true;
            a.addEventListener('click', function(){
                if (!esMovil()) return;
                // No cerrar si es un padre con submenú (no navega)
                var li = a.closest('li');
                var esPadre = li && li.classList && li.classList.contains('menu-item-has-children');
                if (esPadre) return;
                // Cerrar inmediatamente para sensación de respuesta en ítems hoja
                cerrarMenu();
            });
        });
    }

    function boot(){
        header = document.querySelector('.siteMenuW');
        burger = document.querySelector('.burger');
        backgroundBtn = document.querySelector('.background');
        navMenu = document.querySelector('.siteMenuNav');
        if (!header || !burger || !navMenu) return;

        // Observar cambios de clase (open)
        if (!observado){
            observado = true;
            var obs = new MutationObserver(function(muts){
                for (var i=0;i<muts.length;i++){
                    if (muts[i].type === 'attributes' && muts[i].attributeName === 'class'){
                        onHeaderClaseMutada();
                        break;
                    }
                }
            });
            obs.observe(header, { attributes: true });
        }

        // Aplicar si ya está abierto por alguna razón
        onHeaderClaseMutada();

        // Enlaces cierran menú en móvil
        enlazarCierreEnlaces();

        // Re-enlazar si Glory recarga contenido
        document.addEventListener('gloryRecarga', function(){
            setTimeout(function(){
                enlazarCierreEnlaces();
                onHeaderClaseMutada();
            }, 100);
        });
    }

    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    window.addEventListener('load', boot);
})();


