<?php

function contructor()
{
   
?>
    
    <div gloryDiv>
        <div gloryDivSecundario>
            <p gloryTexto>Texto de ejemplo Uno</p>
        </div>
        <div gloryDivSecundario> 
            <p gloryTexto>Texto de ejemplo Dos</p>
        </div>
    </div>

    <div gloryDiv>
        <div gloryDivSecundario>
            <p gloryTexto>Texto de ejemplo Tres</p>
        </div>
        <div gloryDivSecundario> 
            <p gloryTexto>Texto de ejemplo Cuatro</p>
        </div>
    </div>
    <div gloryDiv>
    </div>
    
    <!-- TEST: Div limpio para verificar herencia del Panel de Tema -->
    <div gloryDiv id="test-herencia-limpio">
        <div gloryDivSecundario>
            <p gloryTexto>Test: Este div debe heredar padding del Panel de Tema</p>
        </div>
    </div>
    
    <div class gloryDiv>
        <div gloryDivSecundario>
            <?php $opciones = "plantilla: 'plantillaPosts'"; ?>
            <div gloryContentRender="libro" opciones="<?php echo esc_attr($opciones); ?>"></div>
        </div>
    </div>
<?php
}

