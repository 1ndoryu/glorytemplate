<?php

function contructor()
{
    $opciones = "publicacionesPorPagina: 3, claseContenedor: 'gbn-content-grid', claseItem: 'gbn-content-card', forzarSinCache: true";
    // cosas de la que me doy los estilos se aplican muy bien, por ejemplo a divPrincipal sin estilos le puedo agregar padding cmo yo quiera en el constructor y persite 

    //ahora que pasa con divPrincipalDos, si especifico paddng-top: 100px no lo puedo cambiar en el constructor tampco el constructor lo detecta inicialmente el (100px), no se cual sea la mejor decisión, pero, creo que debo de obtar por que el front este por encima de los estilos del codigo y que pueda detectar los estilos agregados con style="" y cargalos (si esto es muy dificil de detectar los estlos para cargarlo y manejarlos menor no hacerlo)

    //Aprovecho para explicar algunas cosas

    /*
    Los div deben tener estas opciones, aunque sean primarias o secundarias (no siempre aplica)

    modifica el height con 3 opciones, auto, minimo, altura completa (altua completa agrega 100% de la altura con el css moderno que no recuerdo cual es)

    poder elegir entre flex, grid

    si se elige flex pues muestra las opciones flex (continuaa)
    */
?>
    <div gloryDiv class="divPrincipal"> 
        <div gloryDivSecundario class="divSecundario" style="display: grid; gap: 20px;">
            <div gloryContentRender="post" opciones="<?php echo esc_attr($opciones); ?>">
            </div>
        </div>
    </div>
    <div gloryDiv class="divPrincipalDos" style="padding-top: 100px;">
        <div gloryDivSecundario class="divSecundarioDos" style="padding-top: 100px;">
            <div gloryContentRender="post" opciones="<?php echo esc_attr($opciones); ?>">
            </div>
        </div>
        <div gloryDivSecundario class="divSecundarioDos" style="padding-top: 100px;">
            <div gloryContentRender="post" opciones="<?php echo esc_attr($opciones); ?>">
            </div>
        </div>
    </div>
<?php
}
