

# Tareas pendientes

##

Resumen, el roadmap fue formateado para que se rehaga con la nueva estructura. 

El proyecto existe en coolify-manager-rs. No se ha probado con la versión de rs, por lo que en caso de que necesito correciones el despliegue habría que hacerlas sin perdids de datos.

## 2003A-1

Este proyecto no tiene un roadmap coherente con las nuevas reglas y protocolo, hacer una intro a este roadmap muy resumida. 

App\React\docs (LEGACY)\especificaciones.md

## 2003A-2

Utimos comentarios del cliente. 

He revisado la página y quería consultarte esto:

- A los dueños de las autoescuelas (los clientes de la página) le aparece en Configuración la casilla "Configuración de Stripe" ? Como esto es algo mio para gestionar los pagos creo que no le debería de salir.

Esto hay que revisarlo porque solo al usuario admin le debe de salir lo de confiugarión de stripe.

- Cuando le doy a "Gestionar Pagos" en la casilla Suscripción pone que debería llevarme a Stripe (entiendo que ahí se abre la típica ventana para paagr y suscribirse) pero no pasa nada, no se abre nada. 

Mi comentario: esto probablemente suceda porque como su usuario es admin, no tiene coherencia que abra gestionar pagos porque es el usuario que gestiona los pagos, no el cliente. No se si hay una forma de que abra una pestaña para ver todos los pagos.


- El precio de la suscripción debe empezar costando 75€ con la opción de 14 días de prueba gratis activada, si puedes configurar esto te lo agradezco. 

Revisa si se puede configurar en la web o tengo que ir stripe y comentamelo. 

## 2003A-3

Limitaciones, esto nunca se comento en los requerimientos pero ahora me doy cuenta. 

Se puede rehusar la tabla de columnas para agregar una nueva tab para los clientes y pagos. Una ventana donde se administre los clientes con acciones, como activar plan, desactivar, ver pagos, etc. Todo lo que pueda ser útil para el admin. 

## 2003A-4

He generado .sentinel-report.md para revises, corriges cualquier cosa que este mal y cualquier falso positivo lo arregles en la extension. 

## 2003A-5

Este error ha aparecido de repente

Fatal error: Trait "Glory\App\Api\Traits\ConCallbackSeguro" not found in C:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\App\Api\CapAlumnosEndpoints.php on line 14m, en local 

## 2003A-6

Testear el despliegue con coolify-manager-rs, si puedes usar el vps 2 de prueba para ver si se despliega correctamente y si no hay errores, corregir cualquier cosa y luego actualizar en el 1. Bien. 