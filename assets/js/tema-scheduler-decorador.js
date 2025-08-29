(function(){
    function renderContenidoDesdeDataset(bloque){
        if (!bloque) return;
        var cont = bloque.querySelector('.eventoContenido');
        if (!cont) return;
        // Evitar duplicar
        if (cont.dataset.decorado === '1') return;

        var titulo = bloque.dataset.titulo || '';
        var detalle = bloque.dataset.detalle || '';
        var recurso = bloque.dataset.recurso || '';
        var horaInicio = bloque.dataset.horaInicio || '';
        var horaFin = bloque.dataset.horaFin || '';
        var telefono = bloque.dataset.telefono || '';
        var exclusividad = (bloque.dataset.exclusividad === 'true' || bloque.dataset.exclusividad === '1');

        var iconoEx = exclusividad ? ' <span class="iconoExclusividad">❤️</span>' : '';
        var telefonoStr = telefono ? escapeHtml(telefono) : '';

        // Nuevo orden e información solicitada:
        // 1) Hora (+ corazón al lado si aplica)
        // 2) Nombre del cliente (solo nombre + primer apellido)
        // 3) Servicio solicitado
        // 4) Teléfono al final

        // Extraer solo primer nombre y primer apellido del título (suponiendo formato "Nombre Apellido1 Apellido2")
        var nombreClienteCorto = '';
        if (titulo) {
            var partes = titulo.trim().split(/\s+/);
            if (partes.length >= 2) {
                nombreClienteCorto = partes[0] + ' ' + partes[1];
            } else {
                nombreClienteCorto = partes[0];
            }
            nombreClienteCorto = escapeHtml(nombreClienteCorto);
        }

        var horaLine = '';
        if (horaInicio || horaFin) {
            var horaInicioStr = horaInicio ? escapeHtml(horaInicio) : '';
            var horaFinStr = horaFin ? escapeHtml(horaFin) : '';
            if (horaInicioStr && horaFinStr) {
                horaLine = horaInicioStr + ' - ' + horaFinStr + iconoEx;
            } else {
                horaLine = (horaInicioStr || horaFinStr) + iconoEx;
            }
        }

        cont.innerHTML = ''
            + '<p class="eventoParrafo">'
            + (horaLine ? horaLine + '<br/>' : '')
            + (nombreClienteCorto ? nombreClienteCorto + '<br/>' : '')
            + (detalle ? escapeHtml(detalle) + '<br/>' : '')
            + (telefonoStr ? telefonoStr : '')
            + '</p>';

        cont.dataset.decorado = '1';
    }

    function decorarContenedor(cont){
        if (!cont) return;
        cont.querySelectorAll('.bloqueEvento').forEach(renderContenidoDesdeDataset);
        enableDragScroll(cont);
    }

    function onRendered(e){
        try { decorarContenedor(e.detail && e.detail.container ? e.detail.container : null); } catch (err) {}
    }

    function onReady(){
        document.querySelectorAll('.glorySchedulerContenedor').forEach(decorarContenedor);
    }

    function escapeHtml(str){
        var p = document.createElement('p');
        p.textContent = String(str);
        return p.innerHTML;
    }

    function enableDragScroll(cont){
        if (!cont || cont.dataset.dragScroll === '1') return;
        cont.dataset.dragScroll = '1';

        var isDown = false;
        var startX = 0;
        var scrollLeft = 0;

        function start(e){
            // Solo botón izquierdo para mouse
            if (e.type === 'mousedown' && e.button !== 0) return;
            isDown = true;
            cont.classList.add('is-dragging');
            startX = (e.touches && e.touches[0] ? e.touches[0].pageX : e.pageX);
            scrollLeft = cont.scrollLeft;
        }

        function move(e){
            if (!isDown) return;
            if (e.cancelable) e.preventDefault();
            var x = (e.touches && e.touches[0] ? e.touches[0].pageX : e.pageX);
            var dx = x - startX;
            cont.scrollLeft = scrollLeft - dx;
        }

        function end(){
            if (!isDown) return;
            isDown = false;
            cont.classList.remove('is-dragging');
        }

        cont.addEventListener('mousedown', start);
        cont.addEventListener('mousemove', move);
        cont.addEventListener('mouseup', end);
        cont.addEventListener('mouseleave', end);

        cont.addEventListener('touchstart', start, { passive: true });
        cont.addEventListener('touchmove', move, { passive: false });
        cont.addEventListener('touchend', end, { passive: true });
        cont.addEventListener('touchcancel', end, { passive: true });
    }

    document.addEventListener('DOMContentLoaded', onReady);
    document.addEventListener('gloryRecarga', onReady);
    document.addEventListener('glorySchedulerRendered', onRendered, true);
})();


