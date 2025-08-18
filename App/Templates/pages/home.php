<?php

use Glory\Components\ContentRender;
use Glory\Components\FormBuilder;
use Glory\Components\TermRender;
use Glory\Utility\UserUtility;

function home()
{
?>

    <div id="glory-component-examples">

        <!-- Toggle de tema -->
        <button id="theme-toggle" class="borde" style="position:fixed;top:1rem;right:1rem;z-index:2000;padding:8px;display:flex;align-items:center;justify-content:center;border-radius:6px;color:var(--text);background:var(--card-bg);" aria-label="Alternar tema" title="Alternar tema"></button>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>BusquedaRenderer</code></h2>
                <p>Busca en tiempo real entre posts y libros. Escribe "poder" o "alicia" para ver resultados.</p>
                <input type="text" class="busqueda busqueda-ejemplo-input" data-tipos="post,libro" data-cantidad="3" data-target="#resultados-busqueda-ejemplo" data-renderer="BusquedaRenderer" placeholder="Buscar posts y libros...">
                <div id="resultados-busqueda-ejemplo"></div>
            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Modales</h2>
                <p>Usa <code>.openModal</code> con <code>data-modal="id"</code>.</p>
                <button class="openModal borde" data-modal="miModalEjemplo">Abrir Modal</button>

            </div>
        </section>

        <div id="miModalEjemplo" class="modal" style="display:none;">
            <h3>Ventana Modal de Ejemplo</h3>
            <p>Este es el contenido de la ventana modal. Puedes cerrarla con la tecla ESC o haciendo clic fuera.</p>
            <button class="borde" onclick="window.ocultarFondo()">Cerrar</button>
        </div>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>BusquedaRenderer</code> con resultados en Modal </h2>
                <p>Escribe en el campo y los resultados aparecerán en un modal. Escribe "poder" o "alicia" para ver resultados.</p>
                <input type="text"
                    class="busqueda busqueda-modal-input"
                    data-tipos="post,libro"
                    data-cantidad="3"
                    data-target="#resultados-busqueda-modal"
                    data-renderer="BusquedaRenderer"
                    data-overlay="true"
                    data-modal="modalBusquedaEjemplo" data-modal-relative="true"
                    placeholder="Buscar posts y libros..." />
            </div>
        </section>

        <!-- Modal que contendrá solo los resultados -->
        <div id="modalBusquedaEjemplo" class="modal" style="display:none;">
            <h3>Resultados de la búsqueda</h3>
            <div id="resultados-busqueda-modal"></div>
            <button class="borde" onclick="window.ocultarFondo()">Cerrar</button>
        </div>


        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Alertas</h2>
                <p>Reemplaza <code>alert()</code> y <code>confirm()</code> nativos.</p>
                <button class="borde" onclick="alert('Esta es una alerta personalizada.')">Mostrar Alerta</button>
                <button class="borde" onclick="confirm('¿Estás seguro?').then(res => console.log('Confirmado:', res))">Mostrar Confirmación</button>

            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Pestañas</h2>
                <p>Se generan a partir de divs con la clase <code>.pestanaContenido</code>.</p>
                <div class="pestanas-wrapper">
                    <div class="pestanas"></div>
                    <div class="pestanaContenido" data-pestana="Perfil">Contenido de la pestaña de Perfil.</div>
                    <div class="pestanaContenido" data-pestana="Opciones">Contenido de la pestaña de Opciones.</div>
                    <div class="pestanaContenido" data-pestana="Ayuda">Contenido de la pestaña de Ayuda.</div>
                </div>

            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">

                <h2>Componente UI: Submenús Contextuales</h2>
                <p>Usa <code>data-submenu="id"</code> para activar un menú.</p>
                <button class="borde" data-submenu="miSubmenuEjemplo">Abrir Submenú</button>

            </div>
        </section>

        <?php if (is_user_logged_in()) : ?>
            <section class="seccionComponente">
                <div class="contenidoSeccionComponente">
                    <h2>Ejemplo: <code>FormBuilder</code></h2>
                    <p>Este formulario actualiza un metadato de tu perfil de usuario. Visible solo si estás conectado.</p>
                    <?php
                    echo FormBuilder::inicio(['atributos' => ['data-meta-target' => 'user']]);
                    echo FormBuilder::campoTexto([
                        'nombre' => 'nombre_usuario_display',
                        'label'  => 'Tu Nombre para Mostrar',
                        'valor'  => UserUtility::meta('nombre_usuario_display', get_current_user_id()) ?: wp_get_current_user()->display_name
                    ]);
                    echo FormBuilder::botonEnviar([
                        'accion' => 'guardarMeta',
                        'texto'  => 'Guardar Nombre',
                        'extraClass' => 'borde'
                    ]);
                    echo FormBuilder::fin();
                    ?>
                </div>
            </section>
        <?php endif; ?>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2 style="text-align:center;">Ejemplo: <code>ContentRender</code> con Libros</h2>
                <p>Ejemplo de un listado para el Custom Post Type "Libro", usando una plantilla personalizada y estilo minimalista.</p>
                <?php
                ContentRender::print('libro', [
                    'publicacionesPorPagina' => 3,
                    'paginacion'             => false, 
                    'plantillaCallback'      => 'plantillaLibro', // La función que renderiza cada libro.
                    'claseContenedor'        => 'lista-libros-contenedor', // Clase para el contenedor de la lista.
                    'claseItem'              => 'libro-item', // Clase para cada elemento de la lista.
                ]);
                ?>
            </div>
        </section>

        <section class="seccionComponente">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>TermRender</code></h2>
                <p>Mostrando todas las categorías de entradas.</p>
                <?php
                TermRender::print('category');
                ?>
            </div>
        </section>

        <section class="seccionComponente" style="text-align:center;">
            <div class="contenidoSeccionComponente">
                <h2>Ejemplo: <code>LogoRenderer</code> (Shortcode)</h2>
                <p>El logo del tema renderizado con un shortcode, con un ancho y filtro personalizados.</p>
                <?php echo do_shortcode('[theme_logo width="150px" filter="white"]'); ?>
            </div>
        </section>

    </div>


    <div id="miSubmenuEjemplo" class="submenu-contextual">
        <button>Opción 1</button>
        <button>Opción 2</button>
        <button>Opción 3</button>
    </div>

<?php
}

// Script para aplicar y cambiar tema (almacena en localStorage)
?>
<script>
document.addEventListener('DOMContentLoaded', function(){
    const key = 'site-theme';
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    if(!btn) return;

    const sun = `<svg data-testid="geist-icon" height="16" stroke-linejoin="round" style="color:currentColor;display:block;" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.75 0.75V0H7.25V0.75V2V2.75H8.75V2V0.75ZM11.182 3.75732L11.7123 3.22699L12.0659 2.87344L12.5962 2.34311L13.6569 3.40377L13.1265 3.9341L12.773 4.28765L12.2426 4.81798L11.182 3.75732ZM8 10.5C9.38071 10.5 10.5 9.38071 10.5 8C10.5 6.61929 9.38071 5.5 8 5.5C6.61929 5.5 5.5 6.61929 5.5 8C5.5 9.38071 6.61929 10.5 8 10.5ZM8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12ZM13.25 7.25H14H15.25H16V8.75H15.25H14H13.25V7.25ZM0.75 7.25H0V8.75H0.75H2H2.75V7.25H2H0.75ZM2.87348 12.0659L2.34315 12.5962L3.40381 13.6569L3.93414 13.1265L4.28769 12.773L4.81802 12.2426L3.75736 11.182L3.22703 11.7123L2.87348 12.0659ZM3.75735 4.81798L3.22702 4.28765L2.87347 3.9341L2.34314 3.40377L3.4038 2.34311L3.93413 2.87344L4.28768 3.22699L4.81802 3.75732L3.75735 4.81798ZM12.0659 13.1265L12.5962 13.6569L13.6569 12.5962L13.1265 12.0659L12.773 11.7123L12.2426 11.182L11.182 12.2426L11.7123 12.773L12.0659 13.1265ZM8.75 13.25V14V15.25V16H7.25V15.25V14V13.25H8.75Z" fill="currentColor"></path></svg>`;

    const moon = `<svg data-testid="geist-icon" height="16" stroke-linejoin="round" style="color:currentColor;display:block;" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 8.00005C1.5 5.53089 2.99198 3.40932 5.12349 2.48889C4.88136 3.19858 4.75 3.95936 4.75 4.7501C4.75 8.61609 7.88401 11.7501 11.75 11.7501C11.8995 11.7501 12.048 11.7454 12.1953 11.7361C11.0955 13.1164 9.40047 14.0001 7.5 14.0001C4.18629 14.0001 1.5 11.3138 1.5 8.00005ZM6.41706 0.577759C2.78784 1.1031 0 4.22536 0 8.00005C0 12.1422 3.35786 15.5001 7.5 15.5001C10.5798 15.5001 13.2244 13.6438 14.3792 10.9921L13.4588 9.9797C12.9218 10.155 12.3478 10.2501 11.75 10.2501C8.71243 10.2501 6.25 7.78767 6.25 4.7501C6.25 3.63431 6.58146 2.59823 7.15111 1.73217L6.41706 0.577759ZM13.25 1V1.75V2.75L14.25 2.75H15V4.25H14.25H13.25V5.25V6H11.75V5.25V4.25H10.75L10 4.25V2.75H10.75L11.75 2.75V1.75V1H13.25Z" fill="currentColor"></path></svg>`;

    function setIcon(theme){
        if(!btn) return;
        if(theme === 'dark'){
            btn.innerHTML = sun;
        } else {
            btn.innerHTML = moon;
        }
    }

    function applyTheme(t){
        root.setAttribute('data-theme', t);
        localStorage.setItem(key, t);
        setIcon(t);
        // Forzar color del botón en línea para evitar conflictos con reglas globales
        const computedText = getComputedStyle(document.documentElement).getPropertyValue('--text') || '#111';
        const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#fff';
        btn.style.color = computedText.trim();
        btn.style.background = computedBg.trim();
        btn.style.border = getComputedStyle(document.documentElement).getPropertyValue('--borde') || '1px solid #ccc';
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.padding = '0px';
    }

    const stored = localStorage.getItem(key) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(stored);

    btn.addEventListener('click', ()=> applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
});
</script>
