<?php

/**
 * Constructor Page - GBN Components Test Page
 * 
 * Página de prueba para testear TODOS los componentes GBN con sus estilos DEFAULT.
 * Sin estilos inline en los componentes para probar los defaults del sistema.
 * 
 * ============================================
 * COMPONENTES INCLUIDOS
 * ============================================
 * - PrincipalComponent (gloryDiv)
 * - SecundarioComponent (gloryDivSecundario)
 * - TextComponent (gloryTexto)
 * - ButtonComponent (gloryButton)
 * - ImageComponent (gloryImagen)
 * - PostRenderComponent (gloryPostRender)
 * - PostItemComponent (gloryPostItem)
 * - PostFieldComponent (gloryPostField)
 * - FormComponent (gloryForm)
 * - InputComponent (gloryInput)
 * - TextareaComponent (gloryTextarea)
 * - SelectComponent (glorySelect)
 * - SubmitComponent (glorySubmit)
 * - HeaderComponent (gloryHeader)
 * - LogoComponent (gloryLogo)
 * - MenuComponent (gloryMenu)
 * - MenuItemComponent (gloryMenuItem)
 * - FooterComponent (gloryFooter)
 * 
 * ============================================
 * CÓMO DEFINIR DEFAULTS CSS
 * ============================================
 * 
 * Para definir estilos default que el panel GBN pueda leer y sobrescribir:
 * 
 * 1. VARIABLES CSS EN :root (para valores globales):
 *    ```css
 *    :root {
 *        --gbn-principal-padding-top: 20px;
 *        --gbn-text-color: #333;
 *        --gbn-font-family: 'Inter', sans-serif;
 *    }
 *    ```
 * 
 * 2. SELECTORES :where() (para estilos de componentes - especificidad 0):
 *    ```css
 *    :where([gloryTexto]) {
 *        font-family: var(--gbn-font-family, system-ui);
 *        color: var(--gbn-text-color, inherit);
 *    }
 *    
 *    :where(h1[gloryTexto]) {
 *        font-size: 48px;
 *        font-weight: 700;
 *    }
 *    
 *    :where(h2[gloryTexto]) {
 *        font-size: 36px;
 *        font-weight: 600;
 *    }
 *    
 *    :where([gloryButton]) {
 *        padding: 12px 24px;
 *        background: var(--gbn-primary, #667eea);
 *        color: white;
 *        border-radius: 8px;
 *        text-decoration: none;
 *    }
 *    ```
 * 
 * 3. ARCHIVOS DE DEFAULTS:
 *    - theme-styles.css → Estilos base de todos los componentes
 *    - gbn.css → Variables CSS globales
 *    - (Futuro) components/{Nombre}/defaults.css → Defaults por componente
 * 
 * @see Glory/src/Gbn/plan.md para documentación completa
 * @see Glory/src/Gbn/assets/css/theme-styles.css para estilos base
 */

function contructor()
{
    ob_start();
?>
    <style>
        /* ============================================
           SOLO estilos de layout para la página de prueba
           NO afectan a los componentes GBN
           ============================================ */
        .test-page {
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .test-section {
            margin-bottom: 80px;
            padding: 32px;
            border: 2px dashed #e0e0e0;
            border-radius: 12px;
            background: #fafafa;
        }

        .test-section-title {
            font-size: 14px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #ddd;
        }

        .test-section-title code {
            background: #e8e8e8;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 8px;
        }

        /* Layout helpers - NO afectan componentes GBN */
        .layout-flex {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .layout-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }

        .layout-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .layout-grid-2-1 {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 32px;
        }

        .layout-full {
            grid-column: 1 / -1;
        }

        .layout-flex-end {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .layout-flex-between {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .layout-flex-col {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* Para el menú horizontal */
        .menu-list {
            display: flex;
            gap: 24px;
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .menu-list-vertical {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .menu-list-vertical li {
            margin-bottom: 8px;
        }
    </style>

    <div class="test-page" style="padding: 200px 20px; max-width: 800px;">

        <!-- ============================================
             SECCIÓN 1: PrincipalComponent y SecundarioComponent
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                1. Contenedores Principales
                <code>gloryDiv</code> <code>gloryDivSecundario</code>
            </h3>

            <div gloryDiv>
                <div gloryDivSecundario>
                    <p gloryTexto>
                        Este es un SecundarioComponent dentro de un PrincipalComponent
                    </p>
                </div>
            </div>
        </section>



        <!-- ============================================
             SECCIÓN 2: TextComponent
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                2. Componentes de Texto
                <code>gloryTexto</code>
            </h3>

            <h1 gloryTexto>Título Principal H1</h1>

            <h2 gloryTexto>Subtítulo H2</h2>

            <h3 gloryTexto>Encabezado H3</h3>

            <p gloryTexto>
                Este es un párrafo de ejemplo para probar el componente de texto. 
                Incluye tipografía, espaciado, y estilos de línea.
            </p>

            <span gloryTexto>Texto inline como span</span>
        </section>



        <!-- ============================================
             SECCIÓN 3: ButtonComponent
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                3. Componentes de Botón
                <code>gloryButton</code>
            </h3>

            <div class="layout-flex">
                <a href="#" gloryButton>Botón Link</a>

                <button gloryButton>Botón Element</button>

                <a href="#" gloryButton>Otro Botón</a>

                <button gloryButton>Botón Más</button>
            </div>
        </section>



        <!-- ============================================
             SECCIÓN 4: ImageComponent
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                4. Componentes de Imagen
                <code>gloryimage</code>
            </h3>

            <div class="layout-grid-3">
                <img gloryImagen
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23667eea' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='white' text-anchor='middle' dy='.3em' font-family='sans-serif'%3EImagen 1%3C/text%3E%3C/svg%3E"
                     alt="Imagen de prueba 1">

                <img gloryImagen
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23764ba2' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='white' text-anchor='middle' dy='.3em' font-family='sans-serif'%3EImagen 2%3C/text%3E%3C/svg%3E"
                     alt="Imagen de prueba 2">

                <img gloryImagen 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%2322c55e' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='white' text-anchor='middle' dy='.3em' font-family='sans-serif'%3EImagen 3%3C/text%3E%3C/svg%3E"
                     alt="Imagen de prueba 3">
            </div>
        </section>



        <!-- ============================================
             SECCIÓN 5: FormComponent con todos sus hijos
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                5. Componentes de Formulario
                <code>gloryForm</code> <code>gloryInput</code> <code>gloryTextarea</code> <code>glorySelect</code> <code>glorySubmit</code>
            </h3>

            <form gloryForm method="post" data-form-id="test-form" data-ajax-submit="true" class="layout-grid-2">
                
                <div gloryInput>
                    <label>Nombre</label>
                    <input type="text" name="nombre" placeholder="Tu nombre completo" required>
                </div>
                
                <div gloryInput>
                    <label>Email</label>
                    <input type="email" name="email" placeholder="tu@email.com" required>
                </div>
                
                <div gloryInput>
                    <label>Teléfono</label>
                    <input type="tel" name="telefono" placeholder="+1 234 567 890">
                </div>
                
                <div glorySelect>
                    <label>Asunto</label>
                    <select name="asunto" required>
                        <option value="" disabled selected>Seleccionar...</option>
                        <option value="consulta">Consulta General</option>
                        <option value="soporte">Soporte Técnico</option>
                        <option value="ventas">Ventas</option>
                    </select>
                </div>
                
                <div gloryTextarea class="layout-full">
                    <label>Mensaje</label>
                    <textarea name="mensaje" rows="5" placeholder="Escribe tu mensaje aquí..." required></textarea>
                </div>
                
                <div class="layout-full layout-flex-end">
                    <button type="reset" gloryButton>Limpiar</button>
                    <button type="submit" glorySubmit>Enviar Formulario</button>
                </div>
                
            </form>
        </section>



        <!-- ============================================
             SECCIÓN 6: PostRender con PostItem y PostField
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                6. Componentes de Post Dinámico
                <code>gloryPostRender</code> <code>gloryPostItem</code> <code>gloryPostField</code>
            </h3>

            <div gloryPostRender opciones="postType: 'post', postsPerPage: 3, categoryFilter: true" class="layout-grid-3">
                
                <article gloryPostItem>
                    <div gloryPostField="featuredImage">
                        <!-- La imagen destacada se renderiza dinámicamente -->
                    </div>
                    <div>
                        <h3 gloryPostField="title">
                            <a href="#">Título del Post</a>
                        </h3>
                        <p gloryPostField="excerpt">
                            El extracto del post aparecerá aquí automáticamente...
                        </p>
                        <span gloryPostField="date">Fecha de publicación</span>
                        <span gloryPostField="author">Autor</span>
                    </div>
                </article>

            </div>
        </section>


        <!-- ============================================
             SECCIÓN 8: FooterComponent
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                8. Componentes de Footer
                <code>gloryFooter</code>
            </h3>

            <footer gloryFooter class="layout-grid-3">
                <div gloryDivSecundario>
                    <div gloryLogo>
                        <span>Glory Logo</span>
                    </div>
                    <p gloryTexto>
                        Construye sitios web increíbles con el sistema GBN.
                    </p>
                </div>

                <div gloryDivSecundario>
                    <h4 gloryTexto>Enlaces</h4>
                    <nav gloryMenu>
                        <ul class="menu-list-vertical">
                            <li gloryMenuItem><a href="#">Inicio</a></li>
                            <li gloryMenuItem><a href="#">Servicios</a></li>
                            <li gloryMenuItem><a href="#">Proyectos</a></li>
                        </ul>
                    </nav>
                </div>

                <div gloryDivSecundario>
                    <h4 gloryTexto>Contacto</h4>
                    <p gloryTexto>info@glorytheme.com</p>
                    <p gloryTexto>+1 234 567 890</p>
                </div>
            </footer>
        </section>



        <!-- ============================================
             SECCIÓN 9: Composición Compleja - Layout Anidado
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                9. Composición Compleja
                <code>Múltiples componentes anidados</code>
            </h3>

            <div gloryDiv class="layout-grid-2-1">
                
                <!-- Columna Principal -->
                <div gloryDivSecundario>
                    <h2 gloryTexto>Artículo Principal</h2>
                    <p gloryTexto>
                        Este es un ejemplo de composición compleja donde múltiples componentes GBN 
                        trabajan juntos para crear un layout rico y dinámico.
                    </p>
                    <img gloryimage 
                         src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect fill='%23f0f4f8' width='800' height='400'/%3E%3Ctext x='50%25' y='50%25' fill='%23667eea' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='24'%3EImagen de Contenido%3C/text%3E%3C/svg%3E"
                         alt="Imagen del artículo">
                    <p gloryTexto>
                        La imagen de arriba también es un componente GBN completamente editable.
                    </p>
                </div>

                <!-- Sidebar -->
                <div gloryDivSecundario class="layout-flex-col">
                    
                    <!-- Widget 1 -->
                    <div gloryDivSecundario>
                        <h4 gloryTexto>Widget Destacado</h4>
                        <p gloryTexto>Un componente de sidebar.</p>
                        <a href="#" gloryButton>Saber Más</a>
                    </div>

                    <!-- Widget 2 -->
                    <div gloryDivSecundario>
                        <h4 gloryTexto>Enlaces Rápidos</h4>
                        <nav gloryMenu>
                            <ul class="menu-list-vertical">
                                <li gloryMenuItem><a href="#">Documentación</a></li>
                                <li gloryMenuItem><a href="#">API Reference</a></li>
                                <li gloryMenuItem><a href="#">Ejemplos</a></li>
                            </ul>
                        </nav>
                    </div>

                    <!-- Widget 3 - Newsletter -->
                    <div gloryDivSecundario>
                        <h4 gloryTexto>Newsletter</h4>
                        <p gloryTexto>Suscríbete para recibir actualizaciones.</p>
                        <form gloryForm class="layout-flex">
                            <div gloryInput>
                                <input type="email" name="newsletter_email" placeholder="tu@email.com">
                            </div>
                            <button type="submit" glorySubmit>OK</button>
                        </form>
                    </div>

                </div>
            </div>
        </section>



        <!-- ============================================
             SECCIÓN 10: Botones Múltiples para test de estados
             ============================================ -->
        <section class="test-section">
            <h3 class="test-section-title">
                10. Test de Estados Hover/Focus
                <code>_states.hover</code> <code>_states.focus</code>
            </h3>

            <p gloryTexto>
                Componentes para probar configuración de estados hover/focus desde el panel GBN.
            </p>

            <div class="layout-flex">
                <a href="#" gloryButton>Botón 1</a>
                <a href="#" gloryButton>Botón 2</a>
                <a href="#" gloryButton>Botón 3</a>
                <button gloryButton>Botón 4</button>
            </div>
        </section>

    </div>

<?php
    $html = ob_get_clean();
    
    // Procesar componentes dinámicos (PostRender) si la clase existe
    if (class_exists(\Glory\Gbn\Components\PostRender\PostRenderProcessor::class)) {
        echo \Glory\Gbn\Components\PostRender\PostRenderProcessor::processContent($html);
    } else {
        echo $html;
    }
}
