(function(){
    var initializedContainers = new WeakSet();

    function initDrag(container){
        // Evitar inicializar el mismo contenedor múltiples veces
        if (initializedContainers.has(container)) return;
        initializedContainers.add(container);

        var el = container;
        var isDown = false;
        var startX = 0;
        var scrollLeft = 0;

        el.addEventListener('mousedown', function(e){
            isDown = true;
            el.classList.add('is-dragging');
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        });
        el.addEventListener('mouseleave', function(){
            isDown = false;
            el.classList.remove('is-dragging');
        });
        el.addEventListener('mouseup', function(){
            isDown = false;
            el.classList.remove('is-dragging');
        });
        el.addEventListener('mousemove', function(e){
            if(!isDown) return;
            e.preventDefault();
            var x = e.pageX - el.offsetLeft;
            var walk = (x - startX) * 1; // velocidad
            el.scrollLeft = scrollLeft - walk;
        });
        // soporte touch
        el.addEventListener('touchstart', function(e){
            var t = e.touches[0];
            isDown = true;
            startX = t.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
        }, {passive:true});
        el.addEventListener('touchend', function(){ isDown = false; });
        el.addEventListener('touchmove', function(e){
            if(!isDown) return;
            e.preventDefault(); // Prevenir scroll nativo
            var t = e.touches[0];
            var x = t.pageX - el.offsetLeft;
            var walk = (x - startX) * 1;
            el.scrollLeft = scrollLeft - walk;
        }, {passive:false});
    }

    function boot(){
        var nodes = document.querySelectorAll('[data-horizontal-drag]');
        nodes.forEach(initDrag);
    }

    // Inicialización inicial
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Re-inicializar cuando ocurre gloryRecarga (para contenido dinámico)
    document.addEventListener('gloryRecarga', function(){
        setTimeout(boot, 100); // Pequeño delay para asegurar que el DOM esté actualizado
    });
})();


