<?php

function contructor()
{
?>
    <style>
        .primario {
            display: flex;
            padding: 20px;
        }

        .secundario {
            padding: 20px;
        }

    </style>
    <div gloryDiv class="primario">
        <div gloryDivSecundario class="secundario">
            <p gloryTexto>Texto de ejemplo Uno</p>
        </div>
        <div gloryDivSecundario class="secundario"> 
            <p gloryTexto>Texto de ejemplo Dos</p>
        </div>
    </div>

    <div gloryDiv class="primario">
        <div gloryDivSecundario class="secundario">
            <p gloryTexto>Texto de ejemplo Tres</p>
        </div>
        <div gloryDivSecundario class="secundario"> 
            <p gloryTexto>Texto de ejemplo Cuatro</p>
        </div>
    </div>
<?php
}

/*
Idea. 

Para la el apartado de configuración del tema

1. Los gloryDiv por defecto deben tener 20px de padding y ser flex 
2. Los gloryDivSecundario por defecto deben tener 20px de padding  

Por defecto deben agregarse la clase primaro y secundario para que sean faciles de modificar por css si se desea en el futuro, tiene que agregarse la clase aunque no se especifique en el codigo, aunque cargue antes o despues de ser modificado 

estos valores por de defecto tiene que poder cambiarse en el apartado de configuracion del tema que aún no se ha configurado

en templateGlory.php se coloco esta clase, que no se si es necesaria o para que sirve <div data-gbn-root>, 

lo importante es que eso debe aparecer solo cuando gbn esta activado si es que sirve para algo 

En la configuracion del tema, tiene que poder elegirse el color background del main, la pagina siempr estara envuelta en <main id="main" class="main"><div data-gbn-root=""></div></main> 

alli donde aparece gbn-root, se puede agregar una clase especifica para la pagina, ya que cada pagina tendra su configuración personalizada, se debe elegir el color del background, el padding, por cierto, por defecto siempre va agregar un padding de 20px, la clase podría ser 

<div data-gbn-root="" class="gbnPage"> y claro su identificar unico porque cada pagina tendra su propia configuracion, 

todo esto que comento tiene que cargarse en sus respectivos paneles

Otra idea

gloryTexto y los componentes, gloryTexto sera el primer componente, se que ya hay otros que se puede probar, pero, este es el mas importante porque será el que más se usará, 

gloryTexto, es un componente, que se pueda con p, h1, h2, lo que sea, (tiene que tener la capacidad de cambiar su definicion, osea pasar de p a h2, o viversa y cualquier forma), esto cuando se ponga el cursor sobre el, sacara su pequeño panel de configuracion, la de los div secundarioes anarajanda, la de los primario es azul, la de los componentes sera morada, al modificar el componente texto, tiene que estar las opciones de texto, como fuente, color, alineacion, etc 

aqui entra un factor importante con la configuración del tema, 

los valores por defecto que van a cargar para estos tipos de elementos, como el texto, tiene que ser modificables en el panel de configuración del tema, es decir, 

en el panel de configuración del tema habra diferentes apartados, como unos menu, al abrir, abrira un conjunto de configuraciones, por ejemplo, un apartado para texto, un apartado para color, otro apartado para paginas (su padding, background etc),  

en el apartado de texto, se elegirá la fuente, temaño, color por defecto, de los parrafos, de los h2, h1, etc, aqui se configurara los valores por defecto 

los colores, aqui se eligirá los colores por defecto 

hay que hacer algo especial con cada selector de color, hay que hacer nuestro propio selector de color para que al selecionar un color en cualquier componente o un lado, muestre un pequeña lista de los colores por defecto (igual respetar la capacidad de agregar colores personalizados), 

en el apartado de colores por defecto, se podra añadir colores con nombre, por ejemplo color principal, color secundario, etc, agrega por defecto 5 colores, el usuario puede añadir mas colores por defecto y borrar los nuevo que añadio 

Algo más avanzado despues de cumplir con lo anterior 

cuando eligo la configuracion de un bloque o div secundario sale una opcion de layout con las opciones de bloques apilado, flexbox, css grid, esto tiene que ser mas intuitivo y estar representado con iconos luego las opcones de dirección, envoltura, etc tienen que tener iconos tambien sus opciones, no un select, sino iconos a los que das click y se marcan y puedes cambiar a la otra opcion, esto sobre el diseño tiene que ser centralizado, 

me di cuenta que los bloques primarios tambien necesitan estas opciones

algo más sobre los bloques secundarios, una configuracion especial, el tamaño 

cuando se agrega un bloque secundario, tiene que preguntar por el tamaño de este, los tamaños van a ser 1/1, 5/6, 4/5, 3/4, 2/3, 3/5, 1/2, 2/5, 1/3, 1/4, 1/5, 1/6. 

asi si hay 2 div secundarios dentro de un div primario y ambos secundarios tienen 1/2, significa que ambos ocuparan las 2 mitades del primaro, creo que con esto se entiende la idea. 
*/
