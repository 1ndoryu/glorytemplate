# Notificaciones Android — 2026-03-20

## Objetivo
Garantizar que Android reciba todas las categorías de notificaciones relevantes, tanto actividad social como mensajes directos, incluso con la app en background o cerrada.

## Causas raíz corregidas en 193A-76
- La deduplicación en `ServicioNotificaciones` comparaba solo `usuario_id + tipo + actor_id` dentro de la ventana temporal.
- Eso hacía que eventos distintos del mismo actor colisionaran cuando compartían tipo genérico, por ejemplo `like` en entidades distintas o `comentario` frente a `respuestaComentario`.
- Los mensajes directos (`mensaje_nuevo`) no salían por FCM: solo emitían WebSocket, así que con la app cerrada no había ninguna vía de entrega a Android.

## Solución aplicada
- `NotificacionesRepository::existeReciente()` ahora puede comparar también el payload `datos` en JSONB.
- `ServicioNotificaciones::crear()` usa ese payload JSON como parte de la deduplicación, manteniendo antispam pero sin mezclar entidades distintas.
- `MensajesEnvioController` ahora envía `ServicioFcm::enviarAUsuario()` cuando entra un mensaje nuevo, con `tipo=mensaje_nuevo` y navegación a `/mensajes/{conversacionId}/`.

## Implicaciones
- El antispam sigue funcionando para acciones realmente repetidas sobre la misma entidad.
- Likes, comentarios y respuestas de un mismo actor dejan de pisarse entre sí cuando pertenecen a objetos distintos.
- Los DMs pasan a usar el canal Android `mensajes` también en background/cerrada.

## Validación ejecutada
- php -l App/Kamples/Services/ServicioNotificaciones.php
- php -l App/Kamples/Database/Repositories/NotificacionesRepository.php
- php -l App/Kamples/Api/Controladores/MensajesEnvioController.php
- npm run type-check