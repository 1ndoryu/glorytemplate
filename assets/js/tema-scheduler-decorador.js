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
        var telefonoStr = telefono ? ", tel. " + escapeHtml(telefono) : '';

        cont.innerHTML = ''
            + '<p class="eventoParrafo">'
            + escapeHtml(detalle) + iconoEx
            + ' para el cliente <strong>"' + escapeHtml(titulo) + '"</strong>'
            + (recurso ? ' con el barbero <strong>"' + escapeHtml(recurso) + '"</strong>' : '')
            + (horaInicio ? ' a las ' + escapeHtml(horaInicio) : '')
            + telefonoStr
            + '</p>';

        cont.dataset.decorado = '1';
    }

    function decorarContenedor(cont){
        if (!cont) return;
        cont.querySelectorAll('.bloqueEvento').forEach(renderContenidoDesdeDataset);
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

    document.addEventListener('DOMContentLoaded', onReady);
    document.addEventListener('gloryRecarga', onReady);
    document.addEventListener('glorySchedulerRendered', onRendered, true);
})();


