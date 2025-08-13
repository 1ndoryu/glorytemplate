(function(){
  let refreshPending = false;
  let refreshing = false;

  function isModalOpen(){
    const modal = document.querySelector('.modal');
    return modal && window.getComputedStyle(modal).display !== 'none';
  }

  function refrescarReservas(){
    if (refreshing) { refreshPending = true; return; }
    if (isModalOpen()) { refreshPending = true; return; }
    if (typeof window.gloryAjax !== 'function') { console.warn('[realtime] gloryAjax no disponible (reservas)'); return; }
    refreshing = true;
    const filtros = {};
    document.querySelectorAll('.acciones-pagina .glory-filtro [name], .acciones-reservas .glory-filtro [name]').forEach(function(el){
      filtros[el.name] = el.value || '';
    });
    window.gloryAjax('glory_filtrar_reservas', filtros).then(function(resp){
      if (resp && resp.success && resp.data && resp.data.html) {
        var wrap = document.querySelector('.pestanaContenido[data-pestana="Reservas"] .tablaWrap');
        if (wrap) { wrap.outerHTML = resp.data.html; }
        document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
      }
    }).catch(function(err){ console.error('[realtime] error refrescarReservas', err); })
      .finally(function(){ refreshing = false; if (refreshPending && !isModalOpen()) { refreshPending = false; refrescarReservas(); } });
  }

  function refrescarBarberos(){
    if (refreshing) { refreshPending = true; return; }
    if (isModalOpen()) { refreshPending = true; return; }
    if (typeof window.gloryAjax !== 'function') { console.warn('[realtime] gloryAjax no disponible (barberos)'); return; }
    refreshing = true;
    const filtros = {};
    document.querySelectorAll('.acciones-pagina .glory-filtro [name], .acciones-barberos .glory-filtro [name]').forEach(function(el){
      filtros[el.name] = el.value || '';
    });
    window.gloryAjax('glory_filtrar_barberos', filtros).then(function(resp){
      if (resp && resp.success && resp.data && resp.data.html) {
        var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
        if (wrap) { wrap.outerHTML = resp.data.html; }
        document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
      }
    }).catch(function(err){ console.error('[realtime] error refrescarBarberos', err); })
      .finally(function(){ refreshing = false; if (refreshPending && !isModalOpen()) { refreshPending = false; refrescarBarberos(); } });
  }

    function initRealtime(){
    if (typeof window.gloryRealtimePoll !== 'function') { console.warn('[realtime] gloryRealtimePoll no disponible'); return; }
    console.log('[realtime] iniciando poll de canales', ['post_reserva','term_barbero','term_servicio']);
    var stop = window.gloryRealtimePoll(['post_reserva','term_barbero','term_servicio'], { intervalMs: 3000 });
    window.addEventListener('beforeunload', function(){ try { stop(); } catch(e){} });
    document.addEventListener('gloryRealtime:update', function(e){
      try { console.debug('[realtime] evento recibido', e && e.detail ? e.detail : e); } catch(_) {}
      if (!e || !e.detail) return;
      if (e.detail.channel === 'post_reserva') {
        refrescarReservas();
      } else if (e.detail.channel === 'term_barbero') {
        refrescarBarberos();
      } else if (e.detail.channel === 'term_servicio') {
        refrescarServicios();
      }
    });
    document.addEventListener('gloryModal:close', function(){ if (refreshPending) { const p = refreshPending; refreshPending = false; if (p) refrescarReservas(); } });
    // silencioso por defecto
  }
  function refrescarServicios(){
    if (refreshing) { refreshPending = true; return; }
    if (isModalOpen()) { refreshPending = true; return; }
    if (typeof window.gloryAjax !== 'function') { console.warn('[realtime] gloryAjax no disponible (servicios)'); return; }
    refreshing = true;
    const filtros = {};
    document.querySelectorAll('.acciones-pagina .glory-filtro [name], .acciones-servicios .glory-filtro [name]').forEach(function(el){
      filtros[el.name] = el.value || '';
    });
    window.gloryAjax('glory_filtrar_servicios', filtros).then(function(resp){
      if (resp && resp.success && resp.data && resp.data.html) {
        var wrap = document.querySelector('.pestanaContenido[data-pestana="Servicios"] .tablaWrap');
        if (wrap) { wrap.outerHTML = resp.data.html; }
        document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
      }
    }).catch(function(err){ console.error('[realtime] error refrescarServicios', err); })
      .finally(function(){ refreshing = false; if (refreshPending && !isModalOpen()) { refreshPending = false; refrescarServicios(); } });
  }

  // Eliminar servicio desde frontend sin redirección
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a.js-eliminar-servicio');
    if (!a) return;
    ev.preventDefault();
    var termId = parseInt(a.getAttribute('data-term-id') || '0', 10);
    if (!termId) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) return;
    var form = a.parentElement && a.parentElement.querySelector('form.glory-delete-servicio-fallback');
    if (typeof window.gloryAjax === 'function' && !document.body.classList.contains('wp-admin')) {
      window.gloryAjax('glory_eliminar_servicios', { ids: String(termId) }).then(function (resp) {
        if (resp && resp.success && resp.data && resp.data.html) {
          var wrap = document.querySelector('.pestanaContenido[data-pestana="Servicios"] .tablaWrap');
          if (wrap) { wrap.outerHTML = resp.data.html; }
          document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
        }
      }).catch(function(err){ console.error('[realtime] error eliminar servicio', err); });
    } else if (form) {
      form.submit();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtime);
  } else {
    initRealtime();
  }

  // Eliminar barbero desde frontend sin redirección
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a.js-eliminar-barbero');
    if (!a) return;
    ev.preventDefault();
    var termId = parseInt(a.getAttribute('data-term-id') || '0', 10);
    if (!termId) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este barbero?')) return;
    var form = a.parentElement && a.parentElement.querySelector('form.glory-delete-barbero-fallback');
    if (typeof window.gloryAjax === 'function' && !document.body.classList.contains('wp-admin')) {
      window.gloryAjax('glory_eliminar_barberos', { ids: String(termId) }).then(function (resp) {
        if (resp && resp.success && resp.data && resp.data.html) {
          var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
          if (wrap) { wrap.outerHTML = resp.data.html; }
          document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
        }
      });
    } else if (form) {
      form.submit();
    }
  });
})();


