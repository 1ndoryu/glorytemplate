(function(){
  function refrescarReservas(){
    if (typeof window.gloryAjax !== 'function') return;
    const filtros = {};
    document.querySelectorAll('.acciones-reservas .glory-filtro [name]').forEach(function(el){
      filtros[el.name] = el.value || '';
    });
    window.gloryAjax('glory_filtrar_reservas', filtros).then(function(resp){
      if (resp && resp.success && resp.data && resp.data.html) {
        var wrap = document.querySelector('.pestanaContenido[data-pestana="Reservas"] .tablaWrap');
        if (wrap) { wrap.outerHTML = resp.data.html; }
        document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
      }
    }).catch(function(err){ /* silencioso */ });
  }

  function initRealtime(){
    if (typeof window.gloryRealtimePoll !== 'function') return;
    var stop = window.gloryRealtimePoll(['post_reserva'], { intervalMs: 3000 });
    window.addEventListener('beforeunload', function(){ try { stop(); } catch(e){} });
    document.addEventListener('gloryRealtime:update', function(e){
      if (e && e.detail && e.detail.channel === 'post_reserva') {
        refrescarReservas();
      }
    });
    // silencioso por defecto
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtime);
  } else {
    initRealtime();
  }
})();


