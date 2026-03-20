# Prevención: Falso positivo sentinel `request-json-directo`

**Fecha:** 2026-03-20
**Encontrado en:** 193A-92

## Problema

La regla `request-json-directo` de Code Sentinel flaggea `if (empty($body))` en AuthController (login y registro) con el mensaje:
> "$body de get_json_params() pasado directo como argumento. Filtrar campos esperados antes de pasar a la capa de datos."

Pero `$body` **no se pasa directo a la capa de datos**. Los campos se extraen individualmente con sanitización:
- `sanitize_text_field($body['email'] ?? '')`
- `sanitize_user($body['username'] ?? '')`
- `sanitize_email($body['email'] ?? '')`

## Por qué el sentinel-disable no funciona

Se probó `sentinel-disable-next-line request-json-directo` tanto en la línea de asignación (`$body = $request->get_json_params()`) como en la línea flaggeada (`if (empty($body))`). Ninguno suprime el error.

## Corrección necesaria en Code Sentinel

1. La regla debería verificar si `$body` se pasa completo a una función de BD (insert, update, query), no si simplemente se lee un campo con `$body['key']`.
2. El scanner de `sentinel-disable-next-line` parece no estar alineado con el número de línea que reporta — el error dice línea N pero el disable está en N-1 y no lo atrapa.
