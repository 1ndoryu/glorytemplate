(function () {
    if (window.__gloryRealtimeScriptLoaded) {
        return;
    }
    window.__gloryRealtimeScriptLoaded = true;
    let refreshPending = false;
    let refreshing = false;
    var lastRefreshAt = 0;
    var MIN_REFRESH_GAP_MS = 1000; // evita ráfagas de refrescos consecutivos

    function isModalOpen() {
        const modal = document.querySelector('.modal');
        return modal && window.getComputedStyle(modal).display !== 'none';
    }

    function refrescarReservas() {
        if (refreshing) {
            refreshPending = true;
            return;
        }
        if (isModalOpen()) {
            refreshPending = true;
            return;
        }
        if (typeof window.gloryAjax !== 'function') {
            console.warn('[realtime] gloryAjax no disponible (reservas)');
            return;
        }
        var now = Date.now();
        var gap = now - lastRefreshAt;
        if (gap < MIN_REFRESH_GAP_MS) {
            refreshPending = true;
            setTimeout(function(){
                if (!isModalOpen()) refrescarReservas();
            }, MIN_REFRESH_GAP_MS - gap);
            return;
        }
        refreshing = true;
        lastRefreshAt = now;
        const filtros = {};
        document.querySelectorAll('.acciones-pagina .glory-filtro [name], .acciones-reservas .glory-filtro [name]').forEach(function (el) {
            filtros[el.name] = el.value || '';
        });
        window
            .gloryAjax('glory_filtrar_reservas', filtros)
            .then(function (resp) {
                if (resp && resp.success && resp.data && resp.data.html) {
                    var wrap = document.querySelector('.pestanaContenido[data-pestana="Reservas"] .tablaWrap');
                    if (wrap) {
                        wrap.outerHTML = resp.data.html;
                    }
                    document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
                }
            })
            .catch(function (err) {
                console.error('[realtime] error refrescarReservas', err);
            })
            .finally(function () {
                refreshing = false;
                if (refreshPending && !isModalOpen()) {
                    refreshPending = false;
                    var delay = Math.max(0, MIN_REFRESH_GAP_MS - (Date.now() - lastRefreshAt));
                    if (delay > 0) {
                        setTimeout(refrescarReservas, delay);
                    } else {
                        refrescarReservas();
                    }
                }
            });
    }

    function refrescarBarberos() {
        if (refreshing) {
            refreshPending = true;
            return;
        }
        if (isModalOpen()) {
            refreshPending = true;
            return;
        }
        if (typeof window.gloryAjax !== 'function') {
            console.warn('[realtime] gloryAjax no disponible (barberos)');
            return;
        }
        var now = Date.now();
        var gap = now - lastRefreshAt;
        if (gap < MIN_REFRESH_GAP_MS) {
            refreshPending = true;
            setTimeout(function(){
                if (!isModalOpen()) refrescarBarberos();
            }, MIN_REFRESH_GAP_MS - gap);
            return;
        }
        refreshing = true;
        lastRefreshAt = now;
        const filtros = {};
        document.querySelectorAll('.acciones-pagina .glory-filtro [name], .acciones-barberos .glory-filtro [name]').forEach(function (el) {
            filtros[el.name] = el.value || '';
        });
        window
            .gloryAjax('glory_filtrar_barberos', filtros)
            .then(function (resp) {
                if (resp && resp.success && resp.data && resp.data.html) {
                    var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
                    if (wrap) {
                        wrap.outerHTML = resp.data.html;
                    }
                    document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
                }
            })
            .catch(function (err) {
                console.error('[realtime] error refrescarBarberos', err);
            })
            .finally(function () {
                refreshing = false;
                if (refreshPending && !isModalOpen()) {
                    refreshPending = false;
                    var delay = Math.max(0, MIN_REFRESH_GAP_MS - (Date.now() - lastRefreshAt));
                    if (delay > 0) {
                        setTimeout(refrescarBarberos, delay);
                    } else {
                        refrescarBarberos();
                    }
                }
            });
    }

    function initRealtime() {
        if (window.__gloryRealtimeInited) {
            return; // evitar múltiples polls/listeners
        }
        var tieneContenedor = !!(document.querySelector('.homeFront .pestanasPaneles') || document.querySelector('.pestanaContenido'));
        if (!tieneContenedor) {
            return; // no estamos en una vista con tabs/listados
        }
        if (typeof window.gloryRealtimePoll !== 'function') {
            console.warn('[realtime] gloryRealtimePoll no disponible');
            return;
        }
        window.__gloryRealtimeInited = true;
        // console.log('[realtime] iniciando poll de canales', ['post_reserva', 'term_barbero', 'term_servicio']); // desactivado
        var stop = window.gloryRealtimePoll(['post_reserva', 'term_barbero', 'term_servicio'], {intervalMs: 3000});
        window.addEventListener('beforeunload', function () {
            try {
                stop();
            } catch (e) {}
        });
        var lastRealtimeAt = Date.now();

        function onRealtimeEvent(e) {
            try {
                console.debug('[realtime] evento recibido', e && e.detail ? e.detail : e);
            } catch (_) {}
            lastRealtimeAt = Date.now();
            if (!e || !e.detail) return;
            if (e.detail.channel === 'post_reserva') {
                refrescarReservas();
            } else if (e.detail.channel === 'term_barbero') {
                refrescarBarberos();
            } else if (e.detail.channel === 'term_servicio') {
                refrescarServicios();
            }
        }
        // Escuchar en document y en window por compatibilidad
        document.addEventListener('gloryRealtime:update', onRealtimeEvent);
        window.addEventListener('gloryRealtime:update', onRealtimeEvent);
        // Posibles variantes del nombre del evento
        document.addEventListener('gloryRealtimeUpdate', onRealtimeEvent);
        window.addEventListener('gloryRealtimeUpdate', onRealtimeEvent);
        // Fallback: si no llegan eventos en X segundos, refrescar la pestaña activa
        setInterval(function () {
            var since = Date.now() - lastRealtimeAt;
            if (since < 12000) return; // 12s sin eventos
            var activa = document.querySelector('.pestanaContenido.activa');
            if (!activa) return;
            var tab = activa.getAttribute('data-pestana');
            // console.log('[realtime] fallback refresh (sin eventos ~' + Math.round(since / 1000) + 's). Pestaña:', tab); // desactivado
            if (tab === 'Reservas') {
                refrescarReservas();
            } else if (tab === 'Barberos') {
                refrescarBarberos();
            } else if (tab === 'Servicios') {
                refrescarServicios();
            }
        }, 10000);
        document.addEventListener('gloryModal:close', function () {
            if (!refreshPending) return;
            refreshPending = false;
            var activa = document.querySelector('.pestanaContenido.activa');
            if (!activa) return;
            var tab = activa.getAttribute('data-pestana');
            if (tab === 'Reservas') {
                refrescarReservas();
            } else if (tab === 'Barberos') {
                refrescarBarberos();
            } else if (tab === 'Servicios') {
                refrescarServicios();
            }
        });
        // silencioso por defecto
    }
    function refrescarServicios() {
        if (refreshing) {
            refreshPending = true;
            return;
        }
        if (isModalOpen()) {
            refreshPending = true;
            return;
        }
        if (typeof window.gloryAjax !== 'function') {
            console.warn('[realtime] gloryAjax no disponible (servicios)');
            return;
        }
        var now = Date.now();
        var gap = now - lastRefreshAt;
        if (gap < MIN_REFRESH_GAP_MS) {
            refreshPending = true;
            setTimeout(function(){
                if (!isModalOpen()) refrescarServicios();
            }, MIN_REFRESH_GAP_MS - gap);
            return;
        }
        refreshing = true;
        lastRefreshAt = now;
        const filtros = {};
        document.querySelectorAll('.acciones-pagina .glory-filtro [name], .acciones-servicios .glory-filtro [name]').forEach(function (el) {
            filtros[el.name] = el.value || '';
        });
        window
            .gloryAjax('glory_filtrar_servicios', filtros)
            .then(function (resp) {
                if (resp && resp.success && resp.data && resp.data.html) {
                    var wrap = document.querySelector('.pestanaContenido[data-pestana="Servicios"] .tablaWrap');
                    if (wrap) {
                        wrap.outerHTML = resp.data.html;
                    }
                    document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
                }
            })
            .catch(function (err) {
                console.error('[realtime] error refrescarServicios', err);
            })
            .finally(function () {
                refreshing = false;
                if (refreshPending && !isModalOpen()) {
                    refreshPending = false;
                    var delay = Math.max(0, MIN_REFRESH_GAP_MS - (Date.now() - lastRefreshAt));
                    if (delay > 0) {
                        setTimeout(refrescarServicios, delay);
                    } else {
                        refrescarServicios();
                    }
                }
            });
    }

    // Eliminar servicio desde frontend sin redirección
    if (!window.__gloryRealtimeClicksBound) {

    function confirmarAccion(mensaje, onConfirm) {
        try {
            var res = window.confirm(mensaje);
            if (res && typeof res.then === 'function') {
                res.then(function (ok) { if (ok) onConfirm(); });
            } else {
                if (res) onConfirm();
            }
        } catch (e) {
            // Si confirm falla por algún motivo, no hacemos la acción
        }
    }

    document.addEventListener('click', function (ev) {
        var a = ev.target.closest('a.js-eliminar-servicio');
        if (!a) return;
        ev.preventDefault();
        var termId = parseInt(a.getAttribute('data-term-id') || '0', 10);
        if (!termId) return;
        var ejecutarEliminacion = function () {
            var form = a.parentElement && a.parentElement.querySelector('form.glory-delete-servicio-fallback');
            if (typeof window.gloryAjax === 'function' && !document.body.classList.contains('wp-admin')) {
                window
                    .gloryAjax('glory_eliminar_servicios', {ids: String(termId)})
                    .then(function (resp) {
                        if (resp && resp.success && resp.data && resp.data.html) {
                            var wrap = document.querySelector('.pestanaContenido[data-pestana="Servicios"] .tablaWrap');
                            if (wrap) {
                                wrap.outerHTML = resp.data.html;
                            }
                            document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
                        }
                    })
                    .catch(function (err) {
                        console.error('[realtime] error eliminar servicio', err);
                    });
            } else if (form) {
                form.submit();
            }
        };
        confirmarAccion('¿Estás seguro de que quieres eliminar este servicio?', ejecutarEliminacion);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRealtime, { once: true });
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
        var ejecutarEliminacionBarbero = function () {
            var form = a.parentElement && a.parentElement.querySelector('form.glory-delete-barbero-fallback');
            if (typeof window.gloryAjax === 'function' && !document.body.classList.contains('wp-admin')) {
                window.gloryAjax('glory_eliminar_barberos', {ids: String(termId)}).then(function (resp) {
                    if (resp && resp.success && resp.data && resp.data.html) {
                        var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
                        if (wrap) {
                            wrap.outerHTML = resp.data.html;
                        }
                        document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
                    }
                });
            } else if (form) {
                form.submit();
            }
        };
        confirmarAccion('¿Estás seguro de que quieres eliminar este barbero?', ejecutarEliminacionBarbero);
    });
    window.__gloryRealtimeClicksBound = true;
    }
})();
