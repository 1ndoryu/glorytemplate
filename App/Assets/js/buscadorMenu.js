/**
 * Buscador del Menu Principal
 *
 * Maneja la busqueda de productos Amazon desde el icono del header.
 * Usa busqueda del lado del cliente para respuestas instantaneas.
 * Fallback a AJAX si el indice no esta disponible.
 */
(function () {
    'use strict';

    const DEBOUNCE_MS = 50;
    const MIN_CARACTERES = 2;

    let buscadorAbierto = false;
    let timeoutBusqueda = null;
    let abortController = null;
    let usarBusquedaLocal = false;
    let indiceCargado = false;

    function init() {
        /* Solo activo en desktop (min-width: 834px) */
        if (!window.matchMedia('(min-width: 834px)').matches) return;

        const iconoBuscador = document.querySelector('.buscadorMenu');
        if (!iconoBuscador) return;

        crearPanelBusqueda();
        iconoBuscador.addEventListener('click', toggleBuscador);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && buscadorAbierto) {
                cerrarBuscador();
            }
        });
    }

    function crearPanelBusqueda() {
        if (document.getElementById('panelBuscadorMenu')) return;

        const panel = document.createElement('div');
        panel.id = 'panelBuscadorMenu';
        panel.className = 'panelBuscadorMenu';
        panel.innerHTML = `
            <div class="fondoBuscadorMenu"></div>
            <div class="panelBuscadorContenido">
                <div class="panelBuscadorCabecera">
                    <input 
                        type="text" 
                        id="inputBuscadorMenu" 
                        class="inputBuscadorMenu" 
                        placeholder="Buscar productos..."
                        autocomplete="off"
                    />
                    <button type="button" class="cerrarBuscadorMenu" aria-label="Cerrar buscador">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div id="resultadosBuscadorMenu" class="resultadosBuscadorMenu"></div>
            </div>
        `;

        document.body.appendChild(panel);

        const input = panel.querySelector('#inputBuscadorMenu');
        const btnCerrar = panel.querySelector('.cerrarBuscadorMenu');
        const fondo = panel.querySelector('.fondoBuscadorMenu');

        input.addEventListener('input', manejarInputBusqueda);
        btnCerrar.addEventListener('click', cerrarBuscador);
        fondo.addEventListener('click', cerrarBuscador);
    }

    function toggleBuscador() {
        if (buscadorAbierto) {
            cerrarBuscador();
        } else {
            abrirBuscador();
        }
    }

    function abrirBuscador() {
        const panel = document.getElementById('panelBuscadorMenu');
        if (!panel) return;

        panel.classList.add('activo');
        buscadorAbierto = true;

        setTimeout(() => {
            const input = panel.querySelector('#inputBuscadorMenu');
            if (input) input.focus();
        }, 100);

        /* Cargar indice de busqueda al abrir el buscador */
        if (!indiceCargado && window.BuscadorCliente) {
            cargarIndiceEnBackground();
        }
    }

    /**
     * Carga el indice de busqueda en background.
     * Muestra mensaje temporal si es la primera vez.
     */
    async function cargarIndiceEnBackground() {
        if (indiceCargado || !window.BuscadorCliente) return;

        try {
            await window.BuscadorCliente.cargarIndice();
            indiceCargado = true;
            usarBusquedaLocal = true;
        } catch (error) {
            console.warn('No se pudo cargar el indice de busqueda:', error);
            usarBusquedaLocal = false;
        }
    }

    function cerrarBuscador() {
        const panel = document.getElementById('panelBuscadorMenu');
        if (!panel) return;

        panel.classList.remove('activo');
        buscadorAbierto = false;

        const input = panel.querySelector('#inputBuscadorMenu');
        const resultados = panel.querySelector('#resultadosBuscadorMenu');

        if (input) input.value = '';
        if (resultados) resultados.innerHTML = '';

        if (abortController) {
            abortController.abort();
            abortController = null;
        }
    }

    function manejarInputBusqueda(e) {
        const termino = e.target.value.trim();

        if (timeoutBusqueda) {
            clearTimeout(timeoutBusqueda);
        }

        if (termino.length < MIN_CARACTERES) {
            mostrarResultados([]);
            return;
        }

        /* Si tenemos busqueda local, usarla inmediatamente */
        if (usarBusquedaLocal && window.BuscadorCliente) {
            buscarProductosLocal(termino);
            return;
        }

        /* Fallback a busqueda AJAX con debounce */
        timeoutBusqueda = setTimeout(() => {
            buscarProductosAjax(termino);
        }, 200);
    }

    /**
     * Busqueda instantanea en el cliente usando el indice local.
     */
    function buscarProductosLocal(termino) {
        const resultado = window.BuscadorCliente.buscar(termino, 5);

        if (resultado.productos.length === 0) {
            mostrarSinResultados();
            return;
        }

        const productos = resultado.productos.map(p => ({
            url: p.url || '#',
            imagen: p.image || '',
            titulo: p.title || '',
            precio: p.price ? `${p.price} €` : ''
        }));

        mostrarResultados(productos, resultado.total);
    }

    /**
     * Busqueda via AJAX (fallback si el indice no esta disponible).
     */
    function buscarProductosAjax(termino) {
        if (typeof amazonProductAjax === 'undefined') {
            mostrarError('El buscador de productos no esta disponible.');
            return;
        }

        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        mostrarCargando();

        const formData = new FormData();
        formData.append('action', 'amazon_quick_search');
        formData.append('nonce', amazonProductAjax.nonce);
        formData.append('search', termino);
        formData.append('limit', '5');

        fetch(amazonProductAjax.ajax_url, {
            method: 'POST',
            body: formData,
            signal: abortController.signal
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data.products) {
                    const productos = data.data.products.map(p => ({
                        url: p.url || '#',
                        imagen: p.image || '',
                        titulo: p.title || '',
                        precio: p.price ? `${p.price} €` : ''
                    }));
                    mostrarResultados(productos, data.data.count);
                } else {
                    mostrarSinResultados();
                }
            })
            .catch(error => {
                if (error.name === 'AbortError') return;
                mostrarError('Error al buscar productos.');
            });
    }

    function mostrarResultados(productos, total = 0) {
        const contenedor = document.getElementById('resultadosBuscadorMenu');
        if (!contenedor) return;

        if (productos.length === 0) {
            contenedor.innerHTML = '';
            return;
        }

        let html = `<div class="buscadorMenuConteo">${total} producto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}</div>`;
        html += '<div class="buscadorMenuLista">';

        productos.forEach(producto => {
            html += `
                <a href="${producto.url}" class="buscadorMenuItem">
                    <div class="buscadorMenuItemImagen">
                        ${producto.imagen ? `<img src="${producto.imagen}" alt="" loading="lazy" />` : ''}
                    </div>
                    <div class="buscadorMenuItemInfo">
                        <span class="buscadorMenuItemTitulo">${producto.titulo}</span>
                        ${producto.precio ? `<span class="buscadorMenuItemPrecio">${producto.precio}</span>` : ''}
                    </div>
                </a>
            `;
        });

        html += '</div>';
        contenedor.innerHTML = html;
    }

    function mostrarCargando() {
        const contenedor = document.getElementById('resultadosBuscadorMenu');
        if (!contenedor) return;

        contenedor.innerHTML = `
            <div class="buscadorMenuCargando">
                <div class="buscadorMenuSpinner"></div>
                <span>Buscando...</span>
            </div>
        `;
    }

    function mostrarSinResultados() {
        const contenedor = document.getElementById('resultadosBuscadorMenu');
        if (!contenedor) return;

        contenedor.innerHTML = `
            <div class="buscadorMenuVacio">
                No se encontraron productos.
            </div>
        `;
    }

    function mostrarError(mensaje) {
        const contenedor = document.getElementById('resultadosBuscadorMenu');
        if (!contenedor) return;

        contenedor.innerHTML = `
            <div class="buscadorMenuError">
                ${mensaje}
            </div>
        `;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
