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

<?php
    $html = ob_get_clean();
    
    // Procesar componentes dinámicos si la clase existe
    if (class_exists(\Glory\Gbn\Components\PostRender\PostRenderProcessor::class)) {
        echo \Glory\Gbn\Components\PostRender\PostRenderProcessor::processContent($html);
    } else {
        echo $html;
    }
}
