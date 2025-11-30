<?php

function contructor()
{
    $opciones = "publicacionesPorPagina: 3, claseContenedor: 'gbn-content-grid', claseItem: 'gbn-content-card', forzarSinCache: true";

?>

    <div gloryDiv class="divPrincipalDos" style="padding-top: 500px;">
        <p>divPrincipalDos</p>
        <div gloryDivSecundario class="divSecundarioDos" style="padding-top: 100px;">
            <div gloryContentRender="post" opciones="<?php echo esc_attr($opciones); ?>">
            </div>
        </div>
        <div gloryDivSecundario class="divSecundarioDos" style="padding-top: 100px;">
            <div gloryContentRender="post" opciones="<?php echo esc_attr($opciones); ?>">
            </div>
        </div>
    </div>
    <div gloryDiv class="divPrincipalTres" style="padding-top: 300px;">
        <p>divPrincipalTres</p>
        <div gloryDivSecundario class="divSecundarioTres" style="padding-top: 100px;">
            <div gloryContentRender="post" opciones="<?php echo esc_attr($opciones); ?>">
            </div>
        </div>
        <div gloryDivSecundario class="divSecundarioTres" style="padding-top: 100px;">
            <div gloryContentRender="post" opciones="<?php echo esc_attr($opciones); ?>">
            </div>
            <?php
            if (class_exists(\Glory\Components\TermRender::class)) {
                echo '<div style="margin-top: 20px; border: 1px dashed #ccc; padding: 10px;">';
                echo '<h4>TermRender Demo</h4>';
                \Glory\Components\TermRender::print('category', [
                    'numero' => 5,
                    'claseContenedor' => 'gbn-term-list-demo',
                ]);
                echo '</div>';
            }
            ?>
        </div>
    </div>
<?php
}
