-Este proyecto

- [x] Agregar un h1 titulo de pagina, poder elegir si va en la parte superior o inferior del div de los titulos, el usuario debe poder elegir la fuente de este titulo, el tamaño, etc, no se haya elegido nada de debe tener los mismos atributos que los titulos de los post, hay que unificar la pestaña de titles y list, crear una nueva pestaña para agregar la opción de titulo de pagina, esto debe ser opcional, activar o desactivar el titulo, gbn tiene que soportar opciones condicionales, es decir, cuando este el titulo desactivado no salen sus opciones de fuente, tamaño, etc, por ultimo para los titulos de los post poder elegir si van arriba o abajo, su alineación. Estas opciones deben de estar para el avada builder y gbn y funcionar bien sincronizadamente 
    - [x] El Enable Page Title al dar yes (esta en español pero debería ser ingles )no aparecen las opciones correspondientes, tambien el titulo que deberia cargar por defecto cuando esta en yes es obviamente el 
Site Title de wordpress, y poder cambiarse desde alli. Veo este error Uncaught ReferenceError: updateConditionalVisibility is not defined
    at HTMLSelectElement.<anonymous> (gbn.js?ver=1760399003:413:21)

- [x] Bug, cuando le doy a save no se cierra instaneamente sino que a veces se queja colgado y se cierra a los segundos, es molesto y deberia cerrarse al momento, tambien, cuando se da a save, las el css de manito de arrastre queda activo en los titulos y no se puede dar click. Tambien, al dar a save o cambiar de pagina, desaparece el segundo boton para cambiar el color de la pagina.

- [x] Opción para mostrar los links o no, el post type de link no se muestra, deberia mostrarse y tener una opcion para mostrarlos o no. 

- [x] Cuando se le de editar a un link, debe abrirse un modal para modificar el titulo y el link, tambien cuando le de a new link, ese mismo modal debe de abrirse y permitir crear un nuevo link 

- [x] Los link siempre aparecen arriba, su orden no se guarda o mezcla con los otros tipos de post, debería poderse guardar el orden, el orden si funciona los post normales pero no con los links, los link su arrastre si funciona.

- [x] Poder añadir titulos(o mejor dicho encabezados) en la lista de post, no se como hacer esto pero la idea es que en el modal donde aparece para new post o new link aparezca new titulo (en ingles), este titulo se va a poner justo arriba desde donde se creo, creo que es confuso llamarlo titulo asi que le dire encabezado, y va a poder arrastrarse y moverse, tendra la misma fuente, tamaño y todo similar a los titulos, con la excepción de que estará en negrita, despues, los encabezada tendrá todo una opción para poder definir su padding top y padding bottom asi el usuario puede elegir que tan separado estan los post con sus cabezado entre ellos
    - [x] Los titulos se pueden añadir aparentemente pero no aparecen en la lista aunque existan algunos

- [x] Falta un boton para eliminar los post, al eliminar debe salir una alerta y preguntar si esta seguro y mover el post a la papelera, debe funcionar para lo headers y los link tambien, debe aparecer este icono <svg data-testid="geist-icon" height="16" stroke-linejoin="round" style="color:currentColor" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z" fill="currentColor"></path></svg>

- [x] Al cargar directamente un post con su slug # *ir directamente al enlace, por ejemplo http://blogtwo.local/test/#borrowed-rhythm <button type="button" class="gbn-floating-settings"> no aparece, el otro boton si pero ese no

- [ ] al abrir el panel Glory Split Content, la opción de Enable Page Title en vez de si o no debe ser yes o no en ingles, y cuando esta en yes debe mostrar las opciones que del titulo, no se muestra, tengo entendido que "Page Title" tiene opciones para personalizar la fuente, tamaño, etc que se activan marcarla como si o yes, pero no aparecen, deben aparecer siempre que esten marcadas en yes

-Para la plantlla principal

- [ ] agregar GloryFeatures::disable('performanceProfiler')
- [ ] ajustar rutas de themes\Avada\App\Config\assets.php

-Para la plantilla builder

- [ ] eliminar estilos 