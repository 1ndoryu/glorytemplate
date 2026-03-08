# Sistema de Notificaciones Kamples

## Objetivo
Definir una revisión profunda del sistema de notificaciones para convertirlo en una capa de producto consistente, inmediata, escalable y reutilizable. El objetivo no es solo listar eventos, sino construir un sistema que:

- informe al usuario sin fricción;
- priorice eventos realmente importantes;
- aumente retención y recurrencia;
- sirva como base para gamificación, toasts, badges y futuros canales en tiempo real.

## Estado actual verificado

### Frontend actual
- El acceso principal a notificaciones vive en el dropdown del TopBar.
- La página dedicada de notificaciones ya fue eliminada del flujo principal.
- Existe un store global [App/React/stores/notificacionesStore.ts](App/React/stores/notificacionesStore.ts) con cache temporal y TTL de 2 minutos.
- El hook [App/React/hooks/useDropdownNotificaciones.ts](App/React/hooks/useDropdownNotificaciones.ts) usa stale-while-revalidate simple: si el cache está vigente, abre instantáneamente; si no, refresca.
- La precarga se dispara desde TopBar junto con mensajes para evitar loaders al abrir el dropdown.

### Backend actual
- El servicio frontend consume [App/React/services/apiNotificaciones.ts](App/React/services/apiNotificaciones.ts).
- El contrato actual expone una lista plana de notificaciones con campos base: `id`, `tipo`, `titulo`, `mensaje`, `datos`, `leida`, `enlace`, `creadaAt`, `actor`.
- El repositorio y controlador ya existen del lado PHP, por lo que no partimos desde cero.

### Qué ya mejoró
- Se eliminó la fricción de tener que esperar fetch cada vez que se abre el dropdown.
- Se simplificó la experiencia: el centro de gravedad ahora es el dropdown, no una página secundaria.
- El store global ya permite pensar en polling, reconciliación y toasts sin volver a duplicar fetches por componente.

## Problemas reales del sistema actual

### 1. Modelo demasiado plano
Hoy una notificación es casi solo texto renderizado. Eso limita:

- priorización visual;
- agrupación por categoría;
- renderizado rico;
- gamificación basada en metadata;
- comportamiento contextual por tipo.

El campo `datos` existe, pero todavía funciona como bolsa genérica en lugar de un contrato de UI explícito.

### 2. No existe un orquestador de notificaciones
El store actual cachea datos, pero todavía no resuelve responsabilidades más altas:

- detectar nuevas notificaciones vs ya vistas;
- disparar toast solo una vez;
- sincronizar badge rojo con eventos entrantes;
- separar refresh silencioso de refresh visible;
- soportar polling o WebSocket sin acoplarlo al dropdown.

### 3. Falta jerarquía de importancia
No todas las notificaciones merecen el mismo tratamiento. Hoy un pago, un follow o una alerta del sistema comparten el mismo canal visual. Eso reduce señal y fatiga al usuario.

### 4. Gamificación aún no es sistema, solo idea
Hay potencial claro para transformar logros y actividad en loops de retorno, pero faltan:

- taxonomía de hitos;
- reglas de prioridad;
- payload estructurado para recompensas;
- canal de toast diferenciado;
- persistencia de eventos ya celebrados.

### 5. Falta observabilidad de producto
No hay un plan explícito para medir:

- ratio de apertura de dropdown;
- CTR por tipo de notificación;
- conversión posterior al clic;
- impacto de toasts en retorno;
- saturación o fatiga por frecuencia.

Sin esto, cualquier rediseño visual queda incompleto.

## Principios de diseño

### 1. Un solo origen de verdad
Toda notificación activa en cliente debe pasar por un store orquestador. Ningún componente visual debe hacer fetch por cuenta propia como fuente principal.

### 2. Separar transporte de presentación
El backend entrega eventos estructurados. El frontend decide cómo representarlos:

- badge silencioso;
- item en dropdown;
- toast efímero;
- modal de logro;
- animación especial.

### 3. Prioridad antes que volumen
El sistema debe impedir que eventos triviales opaquen eventos valiosos.

### 4. Idempotencia visual
Un mismo evento no debe disparar infinitamente el mismo toast si el usuario reabre la app o si el polling vuelve a traerlo.

### 5. Evolución por contratos
No se deben hardcodear ramas infinitas del estilo `if tipo === ...` por toda la UI. Hace falta una capa de definición por tipo con capacidades y reglas.

## Arquitectura propuesta

### Capa 1: Store orquestador
Crear una evolución del store actual para convertirlo en un centro de eventos de notificaciones.

Responsabilidades:

- almacenar lista normalizada;
- exponer conteo no leído;
- registrar `ultimaCarga` y `ultimoEventoVisible`;
- distinguir `inicializado`, `cargandoSilencioso`, `cargandoVisible`;
- detectar nuevas notificaciones respecto al snapshot anterior;
- encolar toasts pendientes;
- marcar notificaciones celebradas para no repetir animaciones.

Estado mínimo propuesto:

```ts
interface EstadoNotificacionesExtendido {
    items: NotificacionUI[];
    inicializado: boolean;
    cargandoVisible: boolean;
    cargandoSilencioso: boolean;
    ultimaCarga: number;
    ultimoIdVisto: number | null;
    colaToasts: string[];
    idsToastMostrados: Record<string, true>;
    filtroActivo: FiltroNotificaciones;
}
```

### Capa 2: Definición por tipo
Agregar un mapa central que describa el comportamiento de cada tipo.

Ejemplo conceptual:

```ts
interface DefinicionTipoNotificacion {
    categoria: 'social' | 'mensajes' | 'sistema' | 'monetizacion' | 'logro';
    prioridad: 'baja' | 'media' | 'alta' | 'critica';
    icono: string;
    permiteToast: boolean;
    requiereAccionInmediata: boolean;
    plantilla: 'textoPlano' | 'actorObjetivo' | 'hito' | 'recompensa';
}
```

Esto evita lógica dispersa en componentes y habilita crecimiento sin reescribir UI base.

### Capa 3: Presentadores
El mismo evento debe poder aterrizar en distintos presentadores:

- DropdownTopBar
- BadgeContador
- ToastNotificacion
- Centro de actividad futuro
- Modal de logro futuro

Cada presentador consume el store y decide solo la visualización.

### Capa 4: Transporte de eventos
Plan por etapas:

1. Polling inteligente.
2. Polling adaptativo según visibilidad de pestaña.
3. WebSocket o canal push si el producto lo justifica.

No conviene saltar a tiempo real completo sin antes tener contrato, prioridad y deduplicación resueltos.

## Contrato de datos recomendado

El modelo actual debe evolucionar desde una notificación textual a un evento de producto más explícito.

### Contrato objetivo

```json
{
  "id": 1928,
  "tipo": "milestone_descargas",
  "categoria": "logro",
  "prioridad": "alta",
  "titulo": "Nuevo hito desbloqueado",
  "mensaje": "Tu sample Drum Vault alcanzó 100 descargas",
  "leida": false,
  "creadaAt": "2026-03-08T13:22:11Z",
  "enlace": "/sample/drum-vault/",
  "actor": {
    "username": "sistema",
    "nombreVisible": "Kamples",
    "avatarUrl": null
  },
  "objetivo": {
    "tipo": "sample",
    "id": 77,
    "slug": "drum-vault",
    "nombre": "Drum Vault"
  },
  "gamificacion": {
    "xp": 250,
    "insignia": "productorRitmico",
    "animacion": "confetti",
    "sonido": "rewardSoft"
  },
  "ui": {
    "toast": true,
    "badge": true,
    "grupo": "hitos_descargas"
  },
  "meta": {
    "version": 2
  }
}
```

### Campos nuevos recomendados
- `categoria`: evita inferir agrupación solo desde `tipo`.
- `prioridad`: permite decidir si mostrar toast, orden, styling o persistencia visual.
- `objetivo`: elimina dependencia frágil de claves sueltas dentro de `datos`.
- `gamificacion`: concentra recompensas y presentación especial.
- `ui`: flags explícitas de comportamiento de frontend.
- `meta.version`: prepara migraciones de payload.

## Taxonomía inicial de eventos

### Sociales
- `like`
- `encanta`
- `follow`
- `comentario`

### Mensajería
- `mensaje`
- `mensaje_importante`

### Monetización
- `pago`
- `revenue_share`
- `sample_descargado`

### Sistema
- `sistema`
- `moderacion`
- `duplicado_detectado`
- `sync_error`

### Logros y gamificación
- `milestone_descargas`
- `milestone_likes`
- `racha_publicacion`
- `mision_diaria_completada`
- `insignia_desbloqueada`

## Reglas de producto por prioridad

### Prioridad baja
- Solo badge y dropdown.
- Sin toast.
- Sin animaciones.

### Prioridad media
- Badge y dropdown.
- Toast opcional si la app está visible y el usuario no interactúa en ese contexto.

### Prioridad alta
- Toast recomendado.
- Persistencia destacada en dropdown.
- CTA claro.

### Prioridad crítica
- Toast obligatorio.
- Posible modal ligero o persistencia reforzada.
- Debe quedar trazable aunque el usuario cierre el dropdown.

## Experiencia de usuario propuesta

### Dropdown
El dropdown debe dejar de ser un listado plano y convertirse en un panel resumido de actividad.

Bloques propuestos:

- resumen superior con contador y estado;
- filtros rápidos: Todo, Sociales, Mensajes, Sistema, Logros;
- lista ordenada por prioridad y fecha;
- acciones rápidas: marcar todas como leídas;
- estado vacío diferenciado por filtro.

### Toasts
Los toasts deben usarse con moderación. No todo evento merece interrupción.

Casos buenos para toast:

- una descarga relevante;
- un pago;
- una insignia;
- un mensaje importante;
- una alerta del sistema que requiere acción.

Casos malos para toast:

- likes en ráfaga;
- follows masivos;
- eventos repetitivos de bajo impacto.

### Badge rojo
El badge debe reflejar estado real, no una aproximación local. Eso obliga a:

- reconciliar al refrescar;
- decrementar al marcar leída;
- no depender solo de recalcular a partir del dropdown abierto.

## Gamificación: enfoque serio, no decorativo

La gamificación no debe ser maquillaje visual. Debe apoyar comportamientos valiosos del producto.

### Objetivos que sí tienen sentido
- aumentar publicación consistente;
- incentivar calidad y no solo volumen;
- reforzar hitos de monetización;
- celebrar interacción social significativa;
- empujar reactivación tras periodos de inactividad.

### Riesgos a evitar
- inflar la interfaz con recompensas vacías;
- premiar spam o producción de baja calidad;
- generar ruido con demasiados toasts;
- crear expectativas de recompensa sin progresión clara.

### Propuesta de mecánicas viables
- hitos de descargas por sample;
- hitos de likes por sample;
- rachas semanales de publicación;
- misiones diarias simples y verificables;
- insignias persistentes visibles en perfil.

## Roadmap técnico recomendado

### Fase 1: Consolidación del sistema actual
- mover toda la lógica de refresh a un orquestador claro;
- agregar estado `inicializado` y diferenciación entre carga visible y silenciosa;
- agregar selector de conteo no leído en store;
- añadir método de reconciliación al marcar leída;
- documentar contrato actual y faltantes.

### Fase 2: Toasts controlados
- crear `toastNotificacionesStore` o integrar cola al store actual;
- detectar nuevos ids desde polling;
- disparar toast solo para tipos con `permiteToast`;
- persistir ids ya mostrados durante la sesión.

### Fase 3: Payload estructurado v2
- extender backend para emitir `categoria`, `prioridad`, `objetivo`, `gamificacion`, `ui`;
- mantener compatibilidad con payload anterior temporalmente;
- agregar adaptador frontend `mapearNotificacionApiANotificacionUI`.

### Fase 4: Dropdown avanzado
- filtros por categoría;
- agrupación opcional por día o tipo;
- acción “marcar todas como leídas”;
- paginación o cursor si el volumen crece.

### Fase 5: Tiempo real real
- polling adaptativo como paso intermedio;
- luego WebSocket o canal push solo si producto y costos lo justifican.

## Polling recomendado antes de WebSocket

Estrategia sugerida:

- cada 60s con pestaña activa;
- cada 180s con pestaña en segundo plano;
- pausa si el usuario no está autenticado;
- refresco inmediato al reenfocar la ventana;
- deduplicación por `id` y `ultimaCarga`.

Ventajas:

- menor complejidad operativa;
- suficiente para el estado actual del producto;
- reutiliza APIs existentes;
- permite validar producto antes de incorporar infraestructura persistente.

## Métricas que deben instrumentarse

- `notif_dropdown_open`
- `notif_item_click`
- `notif_mark_read`
- `notif_mark_all_read`
- `notif_toast_shown`
- `notif_toast_click`
- `notif_toast_dismiss`
- `notif_filter_change`

Métricas derivadas clave:

- CTR por tipo;
- CTR por prioridad;
- tiempo medio hasta abrir una notificación crítica;
- porcentaje de toasts ignorados;
- ratio de conversión posterior al clic.

## Riesgos técnicos

### 1. Duplicación de eventos
Si se mezcla precarga, polling y apertura manual sin deduplicación robusta, se pueden disparar toasts repetidos o badge incorrecto.

### 2. Acoplamiento UI-tipo
Si cada componente interpreta `tipo` por su cuenta, el sistema se vuelve inmantenible.

### 3. Payload ambiguo
Si `datos` sigue siendo una bolsa de claves opcionales sin contrato, el frontend acumulará ramas frágiles.

### 4. Ruido de producto
Si se manda toast para todo, el usuario aprenderá a ignorarlos.

## Testing recomendado

### Store
- calcula `totalNoLeidas` correctamente;
- no repite toasts para ids ya mostrados;
- diferencia refresh visible de silencioso;
- deduplica resultados consecutivos.

### Hooks
- refresca cuando expira TTL;
- no muestra loader visible si hay cache vigente;
- cancela efectos correctamente al desmontar.

### UI
- badge se actualiza al marcar leída;
- dropdown respeta filtros;
- toast correcto según prioridad;
- notificaciones sin enlace siguen teniendo comportamiento definido.

### Backend
- payload consistente por tipo;
- categorías válidas;
- prioridades válidas;
- compatibilidad entre payload v1 y v2 durante migración.

## Orden de implementación sugerido

1. Fortalecer store orquestador actual.
2. Introducir adaptador UI para desacoplar payload API.
3. Añadir prioridad y categoría al backend.
4. Implementar polling inteligente.
5. Activar toasts solo para alta prioridad.
6. Recién después, construir gamificación visual y misiones.

## Decisión recomendada
La mejor ruta no es hacer primero una interfaz más vistosa. La prioridad correcta es consolidar el sistema como una arquitectura de eventos con contrato explícito, store orquestador y reglas por prioridad. Cuando eso exista, dropdown, badge, toast y gamificación pasan a ser capas de presentación sobre una base estable.

## Entregables de próxima iteración
- refactor del store de notificaciones a orquestador real;
- adaptador `NotificacionUI` con tipado fuerte;
- polling inteligente con deduplicación;
- cola de toasts con idempotencia por sesión;
- filtros por categoría en dropdown.
