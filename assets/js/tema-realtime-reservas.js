(function () {
    if (window.__gloryRealtimeScriptLoaded) {
        return;
    }
    window.__gloryRealtimeScriptLoaded = true;
    // Usar Glory Core Realtime si está disponible; no redefinir lógica aquí
    let refreshPending = false;
    let refreshing = false;
    var lastRefreshAt = 0;
    var MIN_REFRESH_GAP_MS = 500; // evita ráfagas de refrescos consecutivos y reduce latencia percibida

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
        // Capturar valores únicamente dentro del scope de Reservas
        var scopeReservas = document.querySelector('.pestanaContenido[data-pestana="Reservas"]') || document.querySelector('.acciones-reservas') || document;
        scopeReservas.querySelectorAll('[data-glory-filters] [name], .acciones-reservas form [name], form[data-glory-scope="reservas"] [name]').forEach(function (el) {
            if (!el.name) return;
            filtros[el.name] = el.value || '';
        });
        // Preservar solo orden/paginación desde la URL para evitar arrastrar filtros entre pestañas
        try {
            var sp = new URLSearchParams(window.location.search || '');
            ['orderby','order','paged'].forEach(function(k){
                var v = sp.get(k);
                if (v !== null && typeof filtros[k] === 'undefined') {
                    filtros[k] = v;
                }
            });
        } catch(_) {}
		// Preservar selección de checkboxes antes de reemplazar HTML
		var contenedor = document.querySelector('.pestanaContenido[data-pestana="Reservas"]');
		var seleccionAntes = new Set();
		try {
			if (contenedor) {
				contenedor.querySelectorAll('.gloryDataGridContenedor input.gloryGridSelect:checked').forEach(function(ch){
					seleccionAntes.add(String(ch.value));
				});
			}
		} catch (_) {}
        window
            .gloryAjax('glory_filtrar_reservas', filtros)
            .then(function (resp) {
                if (resp && resp.success && resp.data && resp.data.html) {
                    var wrap = document.querySelector('.pestanaContenido[data-pestana="Reservas"] .tablaWrap');
                    if (wrap) {
                        wrap.outerHTML = resp.data.html;
                    }
					// Restaurar selección después del reemplazo
					try {
						var nuevoCont = document.querySelector('.pestanaContenido[data-pestana="Reservas"]');
						if (nuevoCont && seleccionAntes.size > 0) {
							nuevoCont.querySelectorAll('.gloryDataGridContenedor input.gloryGridSelect').forEach(function(ch){
								if (seleccionAntes.has(String(ch.value))) { ch.checked = true; }
							});
						}
					} catch(_){}
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
		// Capturar valores únicamente dentro del scope de Barberos
		var scopeBarberos = document.querySelector('.pestanaContenido[data-pestana="Barberos"]') || document.querySelector('.acciones-barberos') || document;
		scopeBarberos.querySelectorAll('[data-glory-filters] [name], .acciones-barberos form [name], form[data-glory-scope="barberos"] [name]').forEach(function (el) {
			if (!el.name) return;
			filtros[el.name] = el.value || '';
		});
		// Preservar solo orden/paginación desde la URL para evitar arrastrar filtros entre pestañas
		try {
			var sp = new URLSearchParams(window.location.search || '');
			['orderby','order','paged'].forEach(function(k){
				var v = sp.get(k);
				if (v !== null && typeof filtros[k] === 'undefined') {
					filtros[k] = v;
				}
			});
		} catch(_) {}
		// Preservar selección de checkboxes antes de reemplazar HTML
		var contenedorBarberos = document.querySelector('.pestanaContenido[data-pestana="Barberos"]');
		var seleccionAntesBarberos = new Set();
		try {
			if (contenedorBarberos) {
				contenedorBarberos.querySelectorAll('.gloryDataGridContenedor input.gloryGridSelect:checked').forEach(function(ch){
					seleccionAntesBarberos.add(String(ch.value));
				});
			}
		} catch (_) {}
        window
            .gloryAjax('glory_filtrar_barberos', filtros)
            .then(function (resp) {
                if (resp && resp.success && resp.data && resp.data.html) {
                    var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
					if (wrap) {
						wrap.outerHTML = resp.data.html;
					}
					// Restaurar selección después del reemplazo
					try {
						var nuevoContBarberos = document.querySelector('.pestanaContenido[data-pestana="Barberos"]');
						if (nuevoContBarberos && seleccionAntesBarberos.size > 0) {
							nuevoContBarberos.querySelectorAll('.gloryDataGridContenedor input.gloryGridSelect').forEach(function(ch){
								if (seleccionAntesBarberos.has(String(ch.value))) { ch.checked = true; }
							});
						}
					} catch(_){}
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
        var stop = null;
        if (window.gloryRealtime && typeof window.gloryRealtime.start === 'function') {
            stop = window.gloryRealtime.start(['post_reserva', 'term_barbero', 'term_servicio'], {
                intervalMsActive: 1500,
                intervalMsHidden: 15000,
                idleMs: 30000,
                offWhenIdle: true
            });
        } else if (typeof window.gloryRealtimePoll === 'function') {
            stop = window.gloryRealtimePoll(['post_reserva', 'term_barbero', 'term_servicio'], {intervalMs: 1000});
        } else {
            console.warn('[realtime] gloryRealtime no disponible');
            return;
        }
        window.__gloryRealtimeInited = true;
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
        // Bridge agnóstico: tras éxito de formularios, notificar canal según subAccion
        if (!window.__gloryRealtimeBridgeBound) {
            document.addEventListener('gloryForm:success', function(ev){
                try {
                    var sub = String((ev && ev.detail && ev.detail.subAccion) || '').toLowerCase();
                    if (!sub || !window.gloryRealtime || typeof window.gloryRealtime.notify !== 'function') return;
                    if (sub === 'crearreserva' || sub === 'actualizarreserva' || sub === 'eliminarreserva') {
                        window.gloryRealtime.notify('post_reserva');
                    } else if (sub === 'barbero') {
                        window.gloryRealtime.notify('term_barbero');
                    } else if (sub === 'guardarservicio' || sub === 'servicio' || sub === 'guardarservicios') {
                        window.gloryRealtime.notify('term_servicio');
                    }
                } catch(_){}
            });
            window.__gloryRealtimeBridgeBound = true;
        }
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
		// Capturar valores únicamente dentro del scope de Servicios
		var scopeServicios = document.querySelector('.pestanaContenido[data-pestana="Servicios"]') || document.querySelector('.acciones-servicios') || document;
		scopeServicios.querySelectorAll('[data-glory-filters] [name], .acciones-servicios form [name], form[data-glory-scope="servicios"] [name]').forEach(function (el) {
			if (!el.name) return;
			filtros[el.name] = el.value || '';
		});
		// Preservar solo orden/paginación desde la URL para evitar arrastrar filtros entre pestañas
		try {
			var sp = new URLSearchParams(window.location.search || '');
			['orderby','order','paged'].forEach(function(k){
				var v = sp.get(k);
				if (v !== null && typeof filtros[k] === 'undefined') {
					filtros[k] = v;
				}
			});
		} catch(_) {}
		// Preservar selección de checkboxes antes de reemplazar HTML
		var contenedorServicios = document.querySelector('.pestanaContenido[data-pestana="Servicios"]');
		var seleccionAntesServicios = new Set();
		try {
			if (contenedorServicios) {
				contenedorServicios.querySelectorAll('.gloryDataGridContenedor input.gloryGridSelect:checked').forEach(function(ch){
					seleccionAntesServicios.add(String(ch.value));
				});
			}
		} catch (_) {}
        window
            .gloryAjax('glory_filtrar_servicios', filtros)
            .then(function (resp) {
                if (resp && resp.success && resp.data && resp.data.html) {
                    var wrap = document.querySelector('.pestanaContenido[data-pestana="Servicios"] .tablaWrap');
					if (wrap) {
						wrap.outerHTML = resp.data.html;
					}
					// Restaurar selección después del reemplazo
					try {
						var nuevoContServicios = document.querySelector('.pestanaContenido[data-pestana="Servicios"]');
						if (nuevoContServicios && seleccionAntesServicios.size > 0) {
							nuevoContServicios.querySelectorAll('.gloryDataGridContenedor input.gloryGridSelect').forEach(function(ch){
								if (seleccionAntesServicios.has(String(ch.value))) { ch.checked = true; }
							});
						}
					} catch(_){}
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
                            // Notificar a otras pestañas inmediatamente
                            if (window.gloryRealtime && typeof window.gloryRealtime.notify === 'function') {
                                try { window.gloryRealtime.notify('term_servicio'); } catch(_){}
                            }
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
                        // Notificar a otras pestañas inmediatamente
                        if (window.gloryRealtime && typeof window.gloryRealtime.notify === 'function') {
                            try { window.gloryRealtime.notify('term_barbero'); } catch(_){}
                        }
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
