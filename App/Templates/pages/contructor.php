<?php

function contructor()
{
   $opciones = "plantilla: 'plantillaPosts'";
?>
    
    <style>
        .divClaseTest {
            padding: 50px;
            background-color: #ff9f9f;
        }
    </style>
    <div gloryDiv style="padding: 50px; background-color: #f0f0f0;">
        <div gloryDivSecundario>
            <p gloryTexto>Aqui voy agregar estilos inline</p>
        </div>
        <div gloryDivSecundario>
            <p gloryTexto>Aqui voy agregar estilos inline</p>
        </div>
    </div>

    <div gloryDiv class="divClaseTest">
        <div gloryDivSecundario>
            <p gloryTexto>Y aqui voy agregar estilos mediante clases</p>
        </div>
        <div gloryDivSecundario>
            <p gloryTexto>Y aqui voy agregar estilos mediante clases</p>
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
            <div gloryContentRender="libro" opciones="<?php echo esc_attr($opciones); ?>"></div>
        </div>
    </div>
<?php
}

