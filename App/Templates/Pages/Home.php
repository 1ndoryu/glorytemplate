<?php

use Glory\Components\AutenticacionRenderer;
use Glory\Components\PerfilRenderer;
use Glory\Manager\OpcionManager;
use Glory\Core\OpcionRepository;


function home()
{
?>
    <?php if (!is_user_logged_in()) : ?>
        <div class="homeFront" style="max-width:520px;margin:30px auto;padding:0 16px;">
            <h2 style="text-align:center;margin-bottom:10px;">Iniciar sesión</h2>
            <?php echo AutenticacionRenderer::renderLogin([
                'redirectTo' => home_url('/'),
                'mostrarRecordarme' => true,
                'claseWrapper' => 'homeFront'
            ]); ?>
        </div>
    <?php else : ?>
        <?php
        // Sincronización de configuración de API desde Home
        $apiHabilitada = (bool) OpcionManager::get('glory_api_habilitada', false);
        $apiToken = (string) OpcionManager::get('glory_api_token', '');
        $mensajeApi = '';
        if (current_user_can('manage_options') && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['glory_api_config_nonce']) && wp_verify_nonce($_POST['glory_api_config_nonce'], 'glory_api_config_guardar')) {
            $apiHabilitada = isset($_POST['glory_api_habilitada']);
            if (isset($_POST['generar_token'])) {
                $apiToken = wp_generate_password(48, true, false);
            } else {
                $apiToken = sanitize_text_field($_POST['glory_api_token'] ?? '');
            }
            OpcionRepository::save('glory_api_habilitada', $apiHabilitada);
            OpcionRepository::save('glory_api_token', $apiToken);
            OpcionManager::clearCache();
            $mensajeApi = 'Configuración de API guardada correctamente.';
        }
        ?>
        <div class="gloryTabs homeFront">
            <div class="homeFrontTabs" style="position:relative;">
                <div class="pestanas"></div>
                <div class="perfilUsuario" style="position:absolute;top:0;right:0;">
                    <button class="perfilBoton" data-submenu="menu-perfil" aria-haspopup="true" style="padding:0;">
                        <?php echo PerfilRenderer::getHtml(); ?>
                    </button>
                    <div id="menu-perfil" class="glory-submenu perfilMenu" role="menu" aria-label="Perfil">
                        <a class="perfilMenuItem" href="<?php echo esc_url(wp_logout_url(home_url())); ?>">Cerrar sesión</a>
                    </div>
                </div>
            </div>
            <div class="pestanasPaneles">

                <section class="pestanaContenido paginaReservas" data-pestana="Reservas">
                    <?php echo renderPaginaReservas(); ?>
                </section>

                <section class="pestanaContenido paginaBarberos" data-pestana="Barberos">
                    <?php echo renderPaginaBarberos(); ?>
                </section>

                <section class="pestanaContenido paginaServicios" data-pestana="Servicios">
                    <?php echo renderPaginaServicios(); ?>
                </section>

                <section class="pestanaContenido paginaVisualizacion" data-pestana="Visualización">
                    <?php echo renderPaginaVisualizacion(); ?>
                </section>

                <section class="pestanaContenido paginaHistorial" data-pestana="Historial">
                    <?php echo renderPaginaHistorial(); ?>
                </section>

                <section class="pestanaContenido paginaGanancias" data-pestana="Ganancias">
                    <?php echo renderPaginaGanancias(); ?>
                </section>

                <?php if (current_user_can('manage_options')): ?>
                <section class="pestanaContenido paginaApi" data-pestana="API">
                    <div class="wrap">
                        <h2>Configuración de API (Chatbot)</h2>
                        <?php if ($mensajeApi): ?>
                            <div class="notice notice-success is-dismissible"><p><?php echo esc_html($mensajeApi); ?></p></div>
                        <?php endif; ?>
                        <form method="post" class="glory-api-config-form" onsubmit="return false;">
                            <?php wp_nonce_field('glory_api_config_guardar', 'glory_api_config_nonce'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row"><label for="glory_api_habilitada">Habilitar API</label></th>
                                    <td>
                                        <label class="labelApiHabilitada">
                                            <input type="checkbox" id="glory_api_habilitada" name="glory_api_habilitada" <?php checked($apiHabilitada); ?> />
                                            Permite que un chatbot cree reservas vía REST.
                                        </label>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row"><label for="glory_api_token">API Token (Bearer)</label></th>
                                    <td>
                                        <input type="text" id="glory_api_token" name="glory_api_token" value="<?php echo esc_attr($apiToken); ?>" class="regular-text" style="width:100%;max-width:520px;" readonly />
                                        <p class="description">Se usa en el encabezado: Authorization: Bearer &lt;TOKEN&gt;. Recomendado 32+ caracteres aleatorios.</p>
                                    </td>
                                </tr>
                            </table>
                            <p class="submit">
                                <button type="button" id="glory_api_guardar_btn" class="button button-primary">Guardar cambios</button>
                                <button type="button" id="glory_api_generar_btn" class="button">Generar nuevo token</button>
                            </p>
                            <p>
                                <strong>Endpoints:</strong>
                                <code>/wp-json/glory/v1/reservas</code>,
                                <code>/wp-json/glory/v1/horas-disponibles</code>,
                                <code>/wp-json/glory/v1/barberos/{barbero_id}/servicios</code>
                            </p>
                            <p>
                                <button type="button" id="glory_api_ver_doc_btn" class="button">Ver documentación</button>
                            </p>
                        </form>
                        <script>
                        (function(){
                            const ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
                            const nonce = '<?php echo wp_create_nonce('glory_api_config_ajax'); ?>';
                            const inputToken = document.getElementById('glory_api_token');
                            const chkHabilitar = document.getElementById('glory_api_habilitada');
                            const btnGenerar = document.getElementById('glory_api_generar_btn');
                            const btnGuardar = document.getElementById('glory_api_guardar_btn');

                            function notify(msg, tipo){
                                const n = document.createElement('div');
                                n.className = 'notice ' + (tipo === 'error' ? 'notice-error' : 'notice-success') + ' is-dismissible';
                                n.innerHTML = '<p>' + msg + '</p>';
                                const wrap = document.querySelector('.paginaApi .wrap');
                                wrap.insertBefore(n, wrap.firstChild);
                                setTimeout(()=>{ n.remove(); }, 5000);
                            }

                            btnGenerar.addEventListener('click', function(){
                                btnGenerar.disabled = true;
                                fetch(ajaxUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: new URLSearchParams({ action: 'glory_api_generar_token', nonce })
                                }).then(r=>r.json()).then(j=>{
                                    if(j.success && j.data && j.data.token){
                                        inputToken.value = j.data.token;
                                        notify('Nuevo token generado.', 'success');
                                    } else {
                                        notify(j.data && j.data.mensaje ? j.data.mensaje : 'Error al generar token.', 'error');
                                    }
                                }).catch(()=> notify('Error de red.', 'error')).finally(()=>{ btnGenerar.disabled = false; });
                            });

                            btnGuardar.addEventListener('click', function(){
                                btnGuardar.disabled = true;
                                const payload = new URLSearchParams({
                                    action: 'glory_api_guardar_config',
                                    nonce,
                                    habilitada: chkHabilitar.checked ? '1' : '0',
                                    token: inputToken.value || ''
                                });
                                fetch(ajaxUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: payload
                                }).then(r=>r.json()).then(j=>{
                                    if(j.success){
                                        notify('Configuración guardada.', 'success');
                                    } else {
                                        notify(j.data && j.data.mensaje ? j.data.mensaje : 'Error al guardar.', 'error');
                                    }
                                }).catch(()=> notify('Error de red.', 'error')).finally(()=>{ btnGuardar.disabled = false; });
                            });

                            // Botón para abrir la documentación en una nueva pestaña
                            const btnVerDoc = document.getElementById('glory_api_ver_doc_btn');
                            if (btnVerDoc) {
                                btnVerDoc.addEventListener('click', function(){
                                    window.open('<?php echo esc_url( get_permalink( get_page_by_path( "documentacion-api" ) ) ); ?>', '_blank');
                                });
                            }
                        })();
                        </script>
                    </div>
                </section>
                <?php endif; ?>
            </div>
        </div>
    <?php endif; ?>
<?php
}
