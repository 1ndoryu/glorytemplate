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
                if (!val) {
                    selectEl.disabled = true;
                    if (placeholderDisabled) repopulateSelect(selectEl, [], placeholderDisabled);
                    return;
                }
                payload[dep] = val;
            }
            // Tema: cuando cargamos horas en edición, incluir exclude_id para permitir la hora actual
            if (selectEl.name === 'hora_reserva') {
                const ownerForm = selectEl.closest('form, .gloryForm, .formularioBarberia');
                if (ownerForm && ownerForm.dataset && ownerForm.dataset.objectId) {
                    payload.exclude_id = ownerForm.dataset.objectId;
                }
            }
            const resp = await callAjax(action, payload);
            const options = parseOptionsFromResponse(resp);
            repopulateSelect(selectEl, options, '');
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
})();
