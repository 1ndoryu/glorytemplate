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

    <div class gloryDiv>
        <div gloryDivSecundario>
            <?php $opciones = "plantilla: 'plantillaPosts'"; ?>
            <div gloryContentRender="libro" opciones="<?php echo esc_attr($opciones); ?>"></div>
        </div>
    </div>
<?php
}

/*
Idea, paso 1

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

Idea, paso 2 

Algunas cosas de la anteriores no se aplicaron correctamente, empezando por las configuraciones del tema, no se aplica, no se guardan, tampoco tienen efecto en tiempo real, cuando seleciono un color, sigue apareciendo el selector por defecto y no un selector propio donde aparezca los colores por defecto definidos, los default (padding de pagina) por lo visto si se aplica el padding 20px por defecto pero ese valor por defecto de debería cargar en las opciones de default de pagina

luego esta el problema de que cuando abro las configuraciones de la pagina, abre la priimera vez pero a la segunda a cambiar de configuraciones de pagina a la del tema aparece 

Uncaught TypeError: Cannot read properties of null (reading 'replaceChild')
    at renderPlaceholder (panel-core.js?ver=1764498808:30:36)
    at Object.close (panel-core.js?ver=1764498808:321:35)
    at HTMLButtonElement.<anonymous> (panel-core.js?ver=1764498808:83:27)

El contenido del componente texto debería cargar el que ya tiene en vez de poner "Nuevo texto"

las configuraciones de ancho 1/1, no estan todas, faltan algunas, tiene que ser todas las que indique, no se ve que tenga un efecto real, si asigno 1/1, debería ocupar todo el ancho pero eso no sucede, si aplico 1/2, debería ocupar la mitad del div principal pero no sucede en tiempo real ni creo que al guardar, tampoco las opciones de Layout del div principal parecen tener algun efecto, por ejemplo si pongo Justify Content centrado, los div secundarios no se centran

otro problema es que en los tamaños de fuente del componente texto, por ejemplo si pongo un valor como "22" funciona pero si pongo "22px" no, debería poder ser valido ambos o si quiero colocar 1rem tambien

paso 3

el problema de error de conexion y no guardar cambio ni mostrarlo en tiempo real cuando se trata del panel de configuracion del tema o de pagina continua, necesito resolver este problema primero, foco total en esto

paso 4 

ya se solucionaron casi todos los problemas 

faltan mas cosas

cuando se abre las configuraciones de componete texto, respecto a lo que dice de "Contenido", hay un problema,

primero que debería cargar el contenido real, no eso que dice por defecto de "Nuevo texto"

segundo debería tener las opciones de fuente como las hicimso reciente, fuente, tamaño, line height, etc,

la parte de contenido debe ser mas elaborada, debe ser basicamente un editor de text donde podemso poner negritas, cursiva cosas asi pero minimalista y sencillo 

los botones al hacer hover de los componentes, de todos los componentes (la barra donde aparece el boton de eliminar o configurar) deben aparecer centrados en el componente, el resto de barras de los div principales y secundarios deben seguir igual en esquina superior


paso 5

configuración de los div principales y secundarios

los div principales les falta la opcion de gap, y para el layout grid no expone ninguna opcion, tiene que exponer opciones para eso, 

el select de layout (para elegir entre flexbox o grid) es muy feo, debe cambiarse por 2 iconos que los identifique, y grid exponer sus opciones con iconos asi como lo hace flexbox, 

agregar un gloryContentRender de postType libro, y exponer sus opciones de forma ordenada en el panel

paso 6, no entiendo porque no funciona  $opciones = "plantilla: 'plantillaLibro'"; ¿no estoy elgiendo la plantilla de la forma correcta o esta desactualizada la plantilla?

paso 7 completar gloryContentRender

Explico brevemente, la integración de Avada soportaba ContentRender de una forma muy avanzada y compleja, con opciones de alineación, layout, efectos complejos, tenemos que replicar todo eso, y que soporte las plantillas, todas las plantillas (no estan actualizadas todas pero si es complejo), se pueden adaptar las plantillas para que funcionen con gbn, en resumen, todo lo que hace la integración de ContentRender en Avada, tiene que poder hacerse en GBN, todas sus opciones complejas, si puedes simplicarlo, aplicar principios solid y no replicar errores que se cometieron en Avada bien, si te parece mejorr reutilizar la logica, esta bien, toma la mejor decisión basandote en la escabilidad y mantenimiento

Glory tiene una carpeta de Integración, alli encontraras la integración de Avada con GloryContentRender, el proposito es que GBN tenga las mismas opciones, si se puede hacer mas ordenadas, mejor

Paso 8

detalles,

ID: gbn-v3-ogcqed

Rol: content

Contenido: libro

Tipo de contenido

Por defecto si tengo

$opciones = "plantilla: 'plantillaPosts'";
<div gloryContentRender="libro" opciones="<?php echo esc_attr($opciones); ?>"></div>

Puedes en el select de Tipo de contenido debería aparecer el tipo de contenido actual

tambien Plantilla (ID)

no quiero que haya que especificar el id, necesito que las plantillas se registren y se detecten

Mostrar Imagen

Mostrar Título

Aparecen marcadas como No (x) pero en realidad por defecto si estan activas, asi que todo esta mal en cuanto a detectar su estado por defecto, y obvio qeu la imagen y titulo siempre se muestran por defecto

si bien he marcado la plantilla plantillaPosts

cambias las opciones de visualizacion parecen funcionar

aunque veo que lo solicita 

tambien veo que inicialmente las imagenes aparecen pero si toca la opcion de Mostrar Imagen, independiente de off o on, la imagen nunca vuelve aparecer y si se ve que se solicita con "img_show
: 
true" en la consola

lo mismo con el titulo, no vuelve aparecer al tocar la opción

estoy atorada en este paso

ultima actualización 

paso 8.1 

CARGANDO ESTE GLORYRENDER 

<?php $opciones = "plantilla: 'plantillaPosts'"; ?>
<div gloryContentRender="libro" opciones="<?php echo esc_attr($opciones); ?>"></div>

1) Tipo de contenido ES UN SELECT Y APARECE POR DEFECTO "ENTRADAS" EN VEZ DE "LIBRO"
2) Plantilla (ID) YA APARECEN LAS PLANTILLAS PERO NO SE APLICAN Y TAMPOCO APARECE LA PLANTILLA CORRECTA ACTUAL POR DEFECTO QUE DEBERIA SER plantillaPosts
3) Mostrar Imagen APARECE POR DEFECTO EN TRUE PERO NO SE VE; NO APARECE
4) Mostrar Título APARECEN POR DEFECTO EN TRUE NO NO SE VE TAMPOCO

paso 8.2

los problemas anteriores aparentemente se solucionaron 

hay un detalle, al revisar el html encontre <div data-gbn-root="" class="gbnPage-56" style="padding: 120pxpx 20pxpx 40pxpx 20pxpx;background-color: #ffffff;">    estilos invalidos

luego vi que esos estilos se aplicaban correctamente en 

<main id="main" class="main gbn-main-offset" style="padding: 120px 20px 40px; --gbn-text-size: 14px; --gbn-text-font: Roboto; --gbn-custom-0: #b04a4a; background-color: rgb(255, 255, 255);" data-gbn-root="true"><div data-gbn-root="" class="gbnPage-56" style="padding: 120pxpx 20pxpx 40pxpx 20pxpx;background-color: #ffffff;">  

eso no es lo mas interesante

cuando el usuario esta deslogeado, no hay ningun estilo, solo estos

<main id="main" class="main"><div data-gbn-root="" class="gbnPage-56" style="padding: 120pxpx 20pxpx 40pxpx 20pxpx;background-color: #ffffff;"> (este padding lo estoy aplicando en las opciones de pagina, pero imagino que debemos revisar donde sea que se aplique paddings para que no se cometa ese error)

tambien, al usuario deslogeado le aparece <div glorycontentrender="libro" opciones="plantilla: 'plantillaPosts'"></div> sin cargar los post, hay un problema que no vimos venir respecto a esto, hay que solucionarlo porque los estilos y todo funcione para los usuarios deslogeados (mantener que solo el usuario admin puede ver el panel de modificar elementos y esas cosas)

paso 8.3 

El flex de glorycontentrender no parece funcionar, el grid si, pero, por ejemplo si aplico flex horizontal y wrap, se que debería de verse de determina forma pero lo logro ver por 1 segundo y luego vuelve a su estado original

*/
