# Proyecto nakomi, detalles.

esto es una lista de los proyectos los que tengo que sacar imágenes para agregar al portafolio. 

https://mabuhayviajes.com
https://www.entretenedores.net
https://cosmorevenue.com 
https://guillechatbots.es
https://materialdepadel.es 
https://autoescuelaCAD.es 
podría incluir los proyectos de nakomi (task, y los próximos) 

Un breve resumen, es un proyecto extremadamente ambicioso. 

+ Lo primero sería limpiar el entorno, pues, hay un proyecto de ejemplo en este repositorio, hay que leer el readme de react de glory  Glory\assets\react\Docs\react-glory.md y limpiar pages.md para las nuevas paginas (conservar comentarios), basicamente preparar el entorno. 

A continuación esto es una idea no muy planificada, hay muchas cosas que se estan dejando por fuera seguramente, pero lo que haremos apartir de aqui es un roadmap, el roadmap no debe abarcar todo el proceso, haremos fases y nos enforemos en roadmap por fases para no sobrecargar el contexto. 

¿Como organizaremos el proyecto? No lo se pero lo que si tengo claro es la organización de las tareas

En App\React hacer una carpeta de agente, en esa carpeta iran los roadmap por fase, no tienen que ser detallados todos, se pueden actualizar progresivaente, la fase 1 obviamente sera la mas detallada por el momento, sera el mvp

+ Servicios en Nakomi: aplicaciones react, moviles, temas wordpress desde cero, mantenimiento de temas wordpress, creación de sitios con laravel, creación de sitios en framework mas famosos, aplicaciones para windows (js), ciberseguridad para aplicaciones, hosting y dominios.
+ Aplicaciones en Nakomi, por el momento task.nakomi.studo
+ Panel para clientes, los clientes gestionan servicios, se suscriben, desuscriben, pagan, se comunican mediante la plataforma, etc, eligen servicios para pagar, compran.
+ Contratar servicios a trave de Nakomi. (Pedir el pago, retener el pago, mecanismo de devolución, mecanismo de reseñas). Mercado de servicios similar a Fiverr.
+ Pasar reseñas del Fiverr antiguo al Fiverr nuevo. (esto es una nota fimal) 
+ El usuario admin gestiona los clientes, tiene un panel con toda la información de los clientes, se usa el backend de wordpress para agilizar, puede asignar servicios, enviar facturas de pagos pendiente, gestionar esos servicos, etc.
+ Separar responsabilidades, usuario Admin será una sola persona, gestionara los ingresos, pagos, todo lo que vendría siendo la gestión de nakomi, sus ingresos, pagos, factura, clientes, etc, empleado, el usuario admin tambien puede funcionar como empleado, hacer trabajos, los empleados atienden los clientes, si un cliente compra un servicio un empleado debe hacerse responsable de atender ese servicio, es algo similar a fiverr, el cliente paga el servicio, el pago se retiene, elige un tiempo de entrega predefinido, envia sus requerimientos, el plan del servicio, etc, el empleado es responsable de atender ese cliente, y el cliente tiene en su panel sus servicios en progreso, suscripciones, etc
+ El sitio es extremadamente minimalista, la pagina de inicio será el nombre nakomi arriba que cubra el ancho completo dinámicamente, y abajo un grid de los proyectos, usar imagenes de colors de glory mientras tanto, agregar 6 contenido de ejemplo mientras tanto, cada item de portafolio se puede abrir, sin recargar la pagina, y mostrara los detalles e imagenes del proyecto. El menu de navegación seria, el inicio, servicios, proyectos, aplicaciones, sobre nosotros, y login, claro aparecerá el boton panel cuando el usuario este logeado. Todo es muy minimalista. Letras pequeñas y todo muy compacto. 
+ El panel es muy minimalista, tiene que ser un panel lateral que se expande y autoexpande, pensar desde el principio en la responsividad, donde el cliente podra gestionar sus servicios, el inicio de panel por defecto muestra los servicios en proceso, habra para gestionar suscripciones, esto por lo general es completo porque algunos servicios o suscripciones deben poder gestionarse de forma compleja, no hacen una accion directa todavía para simplificar, pero por ejemmplo, gestionar un hosting (ofreceremos ese servicio), por ejemplo contratar un hosting crea la petición, elige un plan con sus caracteristicas, etc, tambien puede pagar mensual o anual, cuando el servicio esta contratado, debería poder solicitar cancelar el hosting, y las acciones normales de un hosting, no tenemos cpanel, gestionamos los hosting con coolify, asi que las cosas basica como permimtir conexion ssh, administrar archivo, ver almacenamiento, etc. Lo del hosting es extredamente complejo. Las tareas complejas deben de dejarse de ultima. 
+ El MVP es tener el landing listo, que el cliente pueda contratar servicios, gestionar, suscribirse a planes, cancerlar planes, comunicarse con los responsables de sus servicios, etc, nada muy complicado. Esta es la idea inicial.

se usaran estas variables (cambiar dashboard por algo mas genérico)

--dashboard-fondoPrincipal: #090909;
    --dashboard-fondoSecundario: #0c0c0c;
    --dashboard-fondoTerciario: #151515;
    --dashboard-fondoHover: #1e1e1e;
    --dashboard-acento: #60a5fa;
    --dashboard-acentoHover: #3b82f6;
    --dashboard-bordePrincipal: #1a1a1a;
    --dashboard-bordeSutil: #222;
    --dashboard-fondoHover: #0c0c0c;
    --dashboard-textoActivo: #f5f5f5;
    --dashboard-textoNormal: #e0e0e0;
    --dashboard-textoSecundario: #a0a0a0;
    --dashboard-textoApagado: #808080;
    --dashboard-textoMuyApagado: #606060;
    --dashboard-textoIndice: #505050;
    --dashboard-textoPlaceholder: #404040;
    --dashboard-barraFondo: #2a2a2a;
    --dashboard-barraNormal: #555555;
    --dashboard-scrollbarThumb: rgba(255, 255, 255, .2);
    --dashboard-scrollbarThumbHover: rgba(255, 255, 255, .35);
    --dashboard-superposicionClara: rgba(255, 255, 255, .03);
    --dashboard-superposicionMuyClara: rgba(255, 255, 255, .01);
    --dashboard-superposicionSutil: rgba(255, 255, 255, .06);
    --dashboard-superposicionMedia: rgba(255, 255, 255, .1);
    --dashboard-superposicioMedioOscuro: rgba(0, 0, 0, .3);
    --dashboard-superposicionOscuro: rgba(0, 0, 0, .6);
    --dashboard-radioSm: 4px;
    --dashboard-radioMd: 4px;
    --dashboard-radioLg: 4px;