# API pública de Logic

Esta API expone todo el espacio Logic para que agentes externos (p. ej. IA) puedan leer y actualizar pasos, historial, hábitos y mensaje de ayuda mediante JSON.

## Autenticación
- Define la clave en **Opciones del tema → Logic → API → API Key pública de Logic** o mediante la variable de entorno `LOGIC_API_KEY`. También puedes fijar la constante `GLORY_LOGIC_PUBLIC_API_KEY`.
- Envía la clave en la cabecera `X-Glory-Logic-Key: <tu_clave>` (opcionalmente como query/body `logic_key`).
- Cada llamada debe indicar `userId` (ID numérico de WordPress) para saber qué tablero se está leyendo/modificando.

## Base
- URL base: `https://tu-sitio.com/wp-json/glory-logic/v1`
- Respuestas: `application/json` con `status:200` cuando hay éxito, o un objeto `{"code":"","message":""}` cuando falla.
- Límites: el historial acepta entre 1 y 100 registros por petición (por defecto 30).

## Resumen de endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/state` | Devuelve tareas activas, hábito rápidos, historial (limit), mensaje de ayuda y límites. |
| `GET` | `/history` | Lista el historial (parámetro `limit`, por defecto 30). |
| `DELETE` | `/history/{historyId}` | Elimina un registro concreto del historial. |
| `POST` | `/steps` | Crea un nuevo paso (`titulo`). |
| `POST` | `/steps/{taskId}/finish` | Libera/completa un paso. |
| `POST` | `/steps/{taskId}/pause` | Pausa un paso activo. |
| `POST` | `/steps/{taskId}/resume` | Reanuda un paso pausado. |
| `GET` | `/habits` | Devuelve los hábitos rápidos disponibles. |
| `POST` | `/habits` | Agrega un hábito (`titulo`). |
| `POST` | `/habits/rename` | Cambia el nombre de un hábito (`titulo`, `nuevoTitulo`). |
| `POST` | `/habits/delete` | Elimina un hábito (`titulo`). |
| `GET` | `/help-message` | Devuelve el mensaje de ayuda vigente. |
| `POST` | `/help-message` | Crea/actualiza el mensaje (`mensaje`, `duracion` en segundos). |
| `DELETE` | `/help-message` | Elimina el mensaje de ayuda. |
| `GET` | `/contexts` | Devuelve los bloques de contexto del usuario. Parámetros: `limit` (default: 10), `dateFrom`, `dateTo`. |
| `POST` | `/contexts` | Crea un nuevo bloque de contexto (`texto`). |
| `PUT` | `/contexts/{contextId}` | Actualiza el texto de un contexto existente (`texto`). |
| `DELETE` | `/contexts/{contextId}` | Elimina un bloque de contexto. |

## Ejemplos

### 1. Estado completo (tareas + historial)

```bash
curl -X GET \
  'https://tu-sitio.com/wp-json/glory-logic/v1/state?userId=12&historyLimit=30' \
  -H 'X-Glory-Logic-Key: TU_API_KEY'
```

Respuesta (resumida):
```json
{
  "userId": 12,
  "limit": 5,
  "limitReached": false,
  "tasks": [...],
  "habits": ["Ejercicio","Leer"],
  "history": [...],
  "historyLimit": 30,
  "helpMessage": {
    "texto": "Recuerda respirar",
    "visibleHastaUtc": "2025-01-12 16:00:00"
  },
  "contexts": [
    {
      "id": 789,
      "texto": "Recordar reunión con cliente",
      "editadoLabel": "14 Nov 2023 10:16"
    }
  ]
}
```

### 2. Crear un paso desde un agente

```bash
curl -X POST 'https://tu-sitio.com/wp-json/glory-logic/v1/steps' \
  -H 'Content-Type: application/json' \
  -H 'X-Glory-Logic-Key: TU_API_KEY' \
  -d '{"userId":12,"titulo":"Responder correos urgentes"}'
```
Devuelve el mismo payload de `/state` más `message: "Paso lógico fijado."`.

### 3. Pausar / Reanudar

```bash
curl -X POST 'https://tu-sitio.com/wp-json/glory-logic/v1/steps/345/pause' \
  -H 'X-Glory-Logic-Key: TU_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId":12}'
```

```bash
curl -X POST 'https://tu-sitio.com/wp-json/glory-logic/v1/steps/345/resume' \
  -H 'X-Glory-Logic-Key: TU_API_KEY' \
  -d '{"userId":12}'
```

### 4. Hábitos rápidos

- **Listar**: `GET /habits?userId=12`
- **Agregar**:
    ```bash
    curl -X POST '.../habits' \
      -H 'Content-Type: application/json' \
      -H 'X-Glory-Logic-Key: TU_API_KEY' \
      -d '{"userId":12,"titulo":"Estiramientos"}'
    ```
- **Renombrar**: `POST /habits/rename` con `{"userId":12,"titulo":"Estiramientos","nuevoTitulo":"Stretch"}`.
- **Eliminar**: `POST /habits/delete` con `{"userId":12,"titulo":"Stretch"}`.

### 5. Mensaje de ayuda

```bash
curl -X POST '.../help-message' \
  -H 'Content-Type: application/json' \
  -H 'X-Glory-Logic-Key: TU_API_KEY' \
  -d '{"userId":12,"mensaje":"Enfócate en terminar la demo","duracion":3600}'
```

Para borrarlo:

```bash
curl -X DELETE '.../help-message?userId=12' \
  -H 'X-Glory-Logic-Key: TU_API_KEY'
```

### 6. Bloques de Contexto

**Listar contextos:**
```bash
curl -X GET 'https://tu-sitio.com/wp-json/glory-logic/v1/contexts?userId=12' \
  -H 'X-Glory-Logic-Key: TU_API_KEY'
```

Respuesta:
```json
{
  "userId": 12,
  "contexts": [
    {
      "id": 789,
      "texto": "Recordar reunión con cliente mañana",
      "creado": 1700000000,
      "editado": 1700001000,
      "creadoLabel": "14 Nov 2023 10:00",
      "editadoLabel": "14 Nov 2023 10:16"
    }
  ]
}
```

**Crear nuevo contexto:**
```bash
curl -X POST 'https://tu-sitio.com/wp-json/glory-logic/v1/contexts' \
  -H 'Content-Type: application/json' \
  -H 'X-Glory-Logic-Key: TU_API_KEY' \
  -d '{
    "userId": 12,
    "texto": "Ideas para el proyecto: usar microservicios"
  }'
```

**Actualizar contexto existente:**
```bash
curl -X PUT 'https://tu-sitio.com/wp-json/glory-logic/v1/contexts/789' \
  -H 'Content-Type: application/json' \
  -H 'X-Glory-Logic-Key: TU_API_KEY' \
  -d '{
    "userId": 12,
    "texto": "Reunión con cliente CONFIRMADA para mañana 10am"
  }'
```

**Eliminar contexto:**
```bash
curl -X DELETE 'https://tu-sitio.com/wp-json/glory-logic/v1/contexts/789?userId=12' \
  -H 'X-Glory-Logic-Key: TU_API_KEY'
```

## Errores comunes

| Código | Significado | Cómo resolver |
| --- | --- | --- |
| `logic_api_disabled` | No hay API key configurada. | Define la clave en opciones o env. |
| `logic_api_key_missing` | Falta la cabecera/parámetro de la clave. | Envía `X-Glory-Logic-Key`. |
| `logic_api_key_invalid` | La clave no coincide. | Revisa si usas la última versión configurada. |
| `logic_api_user_not_found` | `userId` no existe. | Comprueba que el usuario siga activo. |
| `logic_step_limit` | Límite de pasos activos alcanzado. | Libera alguno antes de crear otro. |

> **Tip**: si necesitas diferentes claves por entorno, usa `LOGIC_API_KEY` en `.env` para sobreescribir la opción del panel automáticamente.

