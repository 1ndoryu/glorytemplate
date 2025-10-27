(function(){
    function aplicarLight(){
        try { localStorage.setItem('site-theme', 'light'); } catch(_) {}
        try { document.documentElement.setAttribute('data-theme', 'light'); } catch(_) {}
        // Notificar a posibles componentes que reaccionen a theme (sin romper agnosticidad)
        try { document.dispatchEvent(new CustomEvent('gloryRecarga', { detail: { reason: 'force-light' } })); } catch(_) {}
    }
    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', aplicarLight);
    } else {
        aplicarLight();
    }
    window.addEventListener('load', aplicarLight);
})();


