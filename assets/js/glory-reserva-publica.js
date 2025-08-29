(function () {
    const callAjax = async (action, payload) => {
        if (typeof window.gloryAjax === 'function') {
            const data = payload instanceof FormData ? payload : payload || {};
            return await window.gloryAjax(action, data);
        }
        const params = new URLSearchParams({action, ...(payload || {})});
        const url = typeof window.ajax_params !== 'undefined' && window.ajax_params.ajax_url ? window.ajax_params.ajax_url : '/wp-admin/admin-ajax.php';
        const resp = await fetch(url, {method: 'POST', body: params, headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        const text = await resp.text();
        try {
            return JSON.parse(text);
        } catch (_) {
            return {success: true, data: text};
        }
    };

    const parseOptionsFromResponse = resp => {
        const d = resp && resp.data ? resp.data : resp;
        let src = d && (d.options || d);
        if (!src) return [];
        if (Array.isArray(src)) {
            return src.map(item => (typeof item === 'object' && item !== null ? {value: String(item.value), text: String(item.text ?? item.label ?? item.value)} : {value: String(item), text: String(item)}));
        }
        if (typeof src === 'object') {
            return Object.entries(src).map(([value, text]) => ({value: String(value), text: String(text)}));
        }
        return [];
    };

    const repopulateSelect = (selectEl, options, placeholder) => {
        const previous = selectEl.value;
        selectEl.innerHTML = '';
        if (placeholder) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = placeholder;
            selectEl.appendChild(opt);
        }
        options.forEach(({value, text}) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = text;
            selectEl.appendChild(opt);
        });
        if (selectEl.dataset.fmSelectedValue) {
            selectEl.value = String(selectEl.dataset.fmSelectedValue);
        } else if (previous) {
            selectEl.value = previous;
        }
        const after = selectEl.value;
        if (after !== previous) {
            try { selectEl.dispatchEvent(new Event('change', { bubbles: true })); } catch(_) {}
        }
    };

    const getFieldByName = (form, name) => form.querySelector(`[name="${name.replace(/"/g, '\\"')}"]`);
    const getValueFor = (form, el) => {
        if (!el) return '';
        const tag = el.tagName.toLowerCase();
        if (tag === 'select') return el.value || '';
        if (tag === 'textarea') return el.value || '';
        if (tag === 'input') {
            if (['checkbox'].includes(el.type)) return el.checked ? '1' : '';
            if (['radio'].includes(el.type)) {
                const checked = form.querySelector(`input[type="radio"][name="${el.name.replace(/"/g, '\\"')}"]:checked`);
                return checked ? checked.value || '1' : '';
            }
            return el.value || '';
        }
        return '';
    };

    const wireSelect = selectEl => {
        if (selectEl.dataset.fmWired === '1') return;
        selectEl.dataset.fmWired = '1';
        const form = selectEl.closest('form, .gloryForm, .formularioBarberia') || document;
        const action = selectEl.dataset.fmAccionOpciones;
        const depends = (selectEl.dataset.fmDepende || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        const placeholderDisabled = selectEl.dataset.fmPlaceholderDeshabilitado || '';
        if (!action || depends.length === 0) return;

        const tryLoad = async () => {
            const payload = {};
            for (const dep of depends) {
                const el = getFieldByName(form, dep);
                const val = getValueFor(form, el);
                // Permitir que 'servicio_id' sea opcional específicamente para el select de horas
                if (!val) {
                    if (selectEl.name === 'hora_reserva' && dep === 'servicio_id') {
                        // omitir añadirlo al payload, pero no bloquear la carga
                    } else {
                        selectEl.disabled = true;
                        if (placeholderDisabled) repopulateSelect(selectEl, [], placeholderDisabled);
                        return;
                    }
                } else {
                    payload[dep] = val;
                }
            }
            // Evitar bucles: no recargar si el payload no cambió
            try {
                const key = action + '::' + JSON.stringify(payload);
                if (selectEl.dataset.fmLastKey === key) {
                    return;
                }
                selectEl.dataset.fmLastKey = key;
            } catch(_) {}
            // Tema: cuando cargamos horas en edición, incluir exclude_id para permitir la hora actual
            if (selectEl.name === 'hora_reserva') {
                const ownerForm = selectEl.closest('form, .gloryForm, .formularioBarberia');
                if (ownerForm && ownerForm.dataset && ownerForm.dataset.objectId) {
                    payload.exclude_id = ownerForm.dataset.objectId;
                }
            }
            const resp = await callAjax(action, payload);
            const options = parseOptionsFromResponse(resp);
            const enabledPlaceholder = selectEl.dataset.fmPlaceholder || '';
            repopulateSelect(selectEl, options, enabledPlaceholder);
            selectEl.disabled = options.length === 0;
            const event = new CustomEvent('gloryForm:optionsLoaded', {detail: {select: selectEl, options, payload}});
            document.dispatchEvent(event);
        };

        depends.forEach(dep => {
            const el = getFieldByName(form, dep);
            if (el) el.addEventListener('change', tryLoad);
        });

        tryLoad();
    };

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('select[data-fm-accion-opciones][data-fm-depende]').forEach(wireSelect);
        // Autofill fixer: si el navegador autocompleta, forzar eventos change/input para disparar dependencias
        try {
            const form = document.querySelector('.formularioBarberia');
            if (form) {
                setTimeout(() => {
                    ['nombre_cliente','telefono_cliente','correo_cliente','fecha_reserva','hora_reserva','servicio_id','barbero_id']
                        .forEach(name => {
                            const el = form.querySelector(`[name="${name}"]`);
                            if (!el) return;
                            const val = (el.tagName.toLowerCase() === 'select') ? el.value : el.value;
                            if (val) {
                                try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch(_) {}
                                try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch(_) {}
                            }
                        });
                }, 50);
            }
        } catch(_) {}
    });

  // Eliminar barbero desde frontend sin redirección
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a.js-eliminar-barbero');
    if (!a) return;
    ev.preventDefault();
    if (window.__gloryRealtimeScriptLoaded) return;
    if (document.body && document.body.classList && document.body.classList.contains('wp-admin')) return;
    var termId = parseInt(a.getAttribute('data-term-id') || '0', 10);
    if (!termId) return;
    var __confirm = window.confirm('¿Estás seguro de que quieres eliminar este barbero?');
    if (__confirm && typeof __confirm.then === 'function') {
      return __confirm.then(function (ok) {
        if (!ok) return;
        var form = a.parentElement && a.parentElement.querySelector('form.glory-delete-barbero-fallback');
        if (typeof window.gloryAjax === 'function') {
          window.gloryAjax('glory_eliminar_barberos', { ids: String(termId) }).then(function (resp) {
            if (resp && resp.success && resp.data && resp.data.html) {
              var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
              if (wrap) { wrap.outerHTML = resp.data.html; }
              document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
              if (window.gloryRealtime && typeof window.gloryRealtime.notify === 'function') {
                try { window.gloryRealtime.notify('term_barbero'); } catch(_){ }
              }
            }
          });
        } else if (form) {
          form.submit();
        }
      });
    }
    if (!__confirm) return;
    var form = a.parentElement && a.parentElement.querySelector('form.glory-delete-barbero-fallback');
    if (typeof window.gloryAjax === 'function') {
      window.gloryAjax('glory_eliminar_barberos', { ids: String(termId) }).then(function (resp) {
        if (resp && resp.success && resp.data && resp.data.html) {
          var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
          if (wrap) { wrap.outerHTML = resp.data.html; }
          document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
          if (window.gloryRealtime && typeof window.gloryRealtime.notify === 'function') {
            try { window.gloryRealtime.notify('term_barbero'); } catch(_){}
          }
        }
      });
    } else if (form) {
      form.submit();
    }
  });

  // Toggle dar de baja / reactivar barbero
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a.js-toggle-barbero');
    if (!a) return;
    ev.preventDefault();
    var termId = parseInt(a.getAttribute('data-term-id') || '0', 10);
    if (!termId) return;
    if (typeof window.gloryAjax === 'function') {
      window.gloryAjax('glory_toggle_barbero', { id: String(termId) }).then(function (resp) {
        if (resp && resp.success && resp.data && resp.data.html) {
          var wrap = document.querySelector('.pestanaContenido[data-pestana="Barberos"] .tablaWrap');
          if (wrap) { wrap.outerHTML = resp.data.html; }
          document.dispatchEvent(new CustomEvent('gloryRecarga', {bubbles: true, cancelable: true}));
          if (window.gloryRealtime && typeof window.gloryRealtime.notify === 'function') {
            try { window.gloryRealtime.notify('term_barbero'); } catch(_){ }
          }
        }
      });
    }
  });

    // Tema: al abrir modal en edición, preseleccionar hora actual inmediatamente
    document.addEventListener('gloryFormModal:afterEdit', function (ev) {
        const form = ev.detail && ev.detail.form;
        const data = ev.detail && ev.detail.data;
        if (!form || !data) return;
        const horaSelect = form.querySelector('select[name="hora_reserva"]');
        const horaVal = String(data.hora_reserva || '');
        if (horaSelect && horaVal) {
            const exists = Array.from(horaSelect.options).some(o => o.value === horaVal);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = horaVal;
                opt.textContent = horaVal;
                horaSelect.appendChild(opt);
            }
            horaSelect.dataset.fmSelectedValue = horaVal;
            horaSelect.value = horaVal;
        }
        // Marcar el checkbox de exclusividad si el server devuelve ese valor
        try {
            const exclusividadVal = String(data.exclusividad || '0');
            const exclusividadEl = form.querySelector('[name="exclusividad"]');
            if (exclusividadEl && exclusividadEl.type === 'checkbox') {
                exclusividadEl.checked = exclusividadVal === '1' || exclusividadVal === 'true';
            }
        } catch (e) {
            // silent
        }
    });

    // ---------------- Selector de Barbero (Botón + Modal) ----------------
    const renderItemBarbero = (item) => {
        const card = document.createElement('div');
        card.className = 'barberoCard';
        card.dataset.barberoId = String(item.id);
        // Determinar si el barbero está disponible PARA LA HORA SELECCIONADA
        const isAny = String(item.id) === 'any';
        const estaInactivo = !!item.inactivo;
        const estadoTxt = (item.estado || '').toString();
        const disponibleAhora = isAny ? true : (estadoTxt === 'Disponible' && !estaInactivo);
        if (!disponibleAhora) {
            card.classList.add('unavailable');
            card.setAttribute('aria-disabled', 'true');
        } else {
            card.setAttribute('aria-disabled', 'false');
        }

        card.innerHTML =
            '<div class="barberoImgWrap">'
          +   `<img src="${item.imagen}" alt="${(item.nombre||'').replace(/"/g, '&quot;')}" />`
          + '</div>'
          + '<div class="barberoInfo">'
          +   `<div class="barberoNombre">${item.nombre}</div>`
          +   `<div class="barberoEstado" data-color="${item.estadoColor||''}">${item.estado||''}</div>`
          + '</div>';
        return card;
    };

    const loadBarberosConEstado = async (contenedorLista) => {
        const form = document.querySelector('.formularioBarberia');
        const fecha = form ? (form.querySelector('[name="fecha_reserva"]')?.value || '') : '';
        const hora  = form ? (form.querySelector('[name="hora_reserva"]')?.value || '') : '';
        const servicioId = form ? (form.querySelector('[name="servicio_id"]')?.value || '') : '';
        const resp = await callAjax('glory_barberos_con_estado', { fecha, hora, servicio_id: servicioId });
        const items = resp && resp.success && resp.data && Array.isArray(resp.data.items) ? resp.data.items : [];
        const any = resp && resp.success && resp.data && resp.data.any ? resp.data.any : { id: 'any', nombre: 'Cualquier barbero', estado: 'Let us choose', estadoColor: 'green', imagen: 'https://avatar.vercel.sh/any.svg?size=80&rounded=80' };
        contenedorLista.innerHTML = '';
        // Always show "any" first (siempre seleccionable)
        contenedorLista.appendChild(renderItemBarbero(any));
        // Then all barbers (even if inactive)
        items.forEach(it => contenedorLista.appendChild(renderItemBarbero(it)));
        contenedorLista.dataset.estadoCargado = '1';
    };

    const syncBarberoSeleccion = (barberoId, barberoNombre) => {
        const form = document.querySelector('.formularioBarberia');
        const input = form ? form.querySelector('input[name="barbero_id"]') : null;
        if (input) input.value = String(barberoId || 'any');
        const btn = document.querySelector('.selectorBarberoBtn');
        if (btn) btn.textContent = barberoNombre || 'Cualquier barbero';
    };

    document.addEventListener('click', function (ev) {
        const btn = ev.target.closest('.selectorBarberoBtn.openModal');
        if (!btn) return;
        // Al abrir, si no cargamos aún, cargar lista
        setTimeout(() => {
            try {
                const modal = document.getElementById('modalSelectorBarbero');
                const lista = modal ? modal.querySelector('.listaBarberos') : null;
                if (lista && lista.dataset.estadoCargado !== '1') {
                    loadBarberosConEstado(lista);
                }
            } catch(_){ }
        }, 0);
    });

    // Re-cargar disponibilidad cuando cambien dependencias (fecha/hora/servicio)
    document.addEventListener('change', function (ev) {
        const name = ev.target && ev.target.name;
        if (!name) return;
        if (name === 'fecha_reserva' || name === 'hora_reserva' || name === 'servicio_id') {
            const modal = document.getElementById('modalSelectorBarbero');
            const lista = modal ? modal.querySelector('.listaBarberos') : null;
            if (lista) {
                lista.dataset.estadoCargado = '0';
                if (modal && modal.style.display !== 'none') {
                    loadBarberosConEstado(lista);
                }
                // Si el barbero actualmente seleccionado ya no está disponible, resetear a 'any'
                try {
                    const form = document.querySelector('.formularioBarberia');
                    const input = form ? form.querySelector('input[name="barbero_id"]') : null;
                    if (input && input.value && input.value !== 'any') {
                        // Comprobar si el id sigue entre los disponibles en el DOM (y no tiene la clase unavailable)
                        const selectedId = String(input.value);
                        // Hacer una llamada rápida al endpoint para validar disponibilidad actual
                        callAjax('glory_barberos_con_estado', { fecha: form.querySelector('[name="fecha_reserva"]')?.value || '', hora: form.querySelector('[name="hora_reserva"]')?.value || '', servicio_id: form.querySelector('[name="servicio_id"]')?.value || '' })
                            .then(resp => {
                                if (!(resp && resp.success && resp.data && Array.isArray(resp.data.items))) return;
                                const items = resp.data.items;
                                const encontrado = items.find(i => String(i.id) === selectedId);
                                const disponible = encontrado && String(encontrado.estado || '') === 'Disponible' && !encontrado.inactivo;
                                if (!disponible) {
                                    // reset a 'any'
                                    input.value = 'any';
                                    const btn = document.querySelector('.selectorBarberoBtn');
                                    if (btn) btn.textContent = 'Cualquier barbero';
                                }
                            }).catch(()=>{});
                    }
                } catch(_){}
            }
        }
    });

    // Selección de barbero dentro del modal
    document.addEventListener('click', function (ev) {
        const card = ev.target.closest && ev.target.closest('.barberoCard');
        if (!card) return;
        const modal = card.closest && card.closest('#modalSelectorBarbero');
        if (!modal) return;
        const barberoId = card.dataset.barberoId;
        const nombre = card.querySelector('.barberoNombre')?.textContent || '';
        syncBarberoSeleccion(barberoId, nombre);
        // Cerrar modal activo
        document.dispatchEvent(new CustomEvent('gloryModal:close'));
        // Si gloryModal necesita evento específico, hacer click en overlay o usar la API
        if (typeof window.ocultarFondo === 'function') { try { window.ocultarFondo(); } catch(_){} }
        const overlay = document.getElementById('modalSelectorBarbero');
        if (overlay) overlay.style.display = 'none';
    });
})();
