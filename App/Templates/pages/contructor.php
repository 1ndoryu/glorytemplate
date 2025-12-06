<?php

/**
 * Constructor Page - Test PostRender Component
 * 
 * Página minimalista para probar el nuevo componente PostRender
 * que renderiza posts dinámicamente.
 */

function contructor()
{
    // Capturamos el output para procesarlo (PostRender necesita ser renderizado por PHP)
    ob_start();
?>
    <style>
        .tempTestPage { 
            padding: 40px; 
        }

        .gloryPostRender {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
        }

        * {
            font-size 13px;
        }

    </style>


    <div class="tempTestPage">
        <div gloryPostRender opciones="postType: 'libro', categoryFilter: true, hoverEffect: 'lift'" class="gloryPostRender">
            
            <article gloryPostItem class="postCard">
                
                <div gloryPostField="featuredImage" class="postCardImage">
                    <img src="" alt="">
                </div>
                <div class="postCardContent">
                    <h3 gloryPostField="title" class="postCardTitle">
                        <a href="#">Título del post</a>
                    </h3>
                    <p gloryPostField="excerpt" class="postCardExcerpt">
                        El extracto del post aparecerá aquí...
                    </p>
                    <span gloryPostField="date" class="postCardDate">Fecha</span>
                </div>
            </article>
        </div>

    </div>

    <div gloryDiv>
        <p gloryTexto>Hola</p>
    </div>

    <!-- Fase 14.5: Formulario GBN con envío AJAX y email automático -->
    <div gloryDiv style="padding: 32px; max-width: 700px; margin: 32px auto;">
        <form gloryForm method="post" data-form-id="contacto" data-ajax-submit="true" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            
            <div gloryInput>
                <label class="gbn-label">Nombre</label>
                <input type="text" name="nombre" placeholder="Tu nombre" class="gbn-input" required>
            </div>
            
            <div gloryInput>
                <label class="gbn-label">Email</label>
                <input type="email" name="email" placeholder="tu@email.com" class="gbn-input" required>
            </div>
            
            <div gloryInput>
                <label class="gbn-label">Teléfono</label>
                <input type="tel" name="telefono" placeholder="+1 234 567 890" class="gbn-input">
            </div>
            
            <div glorySelect>
                <label class="gbn-label">Asunto</label>
                <select name="asunto" class="gbn-select" required>
                    <option value="" disabled selected>Seleccionar...</option>
                    <option value="consulta">Consulta</option>
                    <option value="soporte">Soporte</option>
                    <option value="ventas">Ventas</option>
                </select>
            </div>
            
            <div gloryTextarea style="grid-column: 1 / -1;">
                <label class="gbn-label">Mensaje</label>
                <textarea name="mensaje" rows="4" placeholder="Tu mensaje..." class="gbn-textarea" required></textarea>
            </div>
            
            <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end;">
                <button type="submit" glorySubmit class="gbn-submit">Enviar</button>
            </div>
            
        </form>
    </div>
<?php
    $html = ob_get_clean();
    
    // Procesar componentes dinámicos si la clase existe
    if (class_exists(\Glory\Gbn\Components\PostRender\PostRenderProcessor::class)) {
        echo \Glory\Gbn\Components\PostRender\PostRenderProcessor::processContent($html);
    } else {
        echo $html;
    }
}
