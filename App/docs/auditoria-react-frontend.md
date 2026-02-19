# Auditoría React/TypeScript Frontend — Kamples

> **Fecha:** 19/02/2026  
> **Alcance:** `App/React/services/`, `App/React/hooks/`, `App/React/stores/`  
> **Archivos auditados:** 23 services, 17 hooks, 20 stores  
> **Total hallazgos:** 42 (6 P0, 12 P1, 14 P2, 10 P3)

---

## Arquitectura de Error Handling: apiCliente.ts

`apiCliente.ts` tiene **manejo centralizado robusto**:
- `apiPeticion<T>()` envuelve `fetch` en try-catch
- Detecta respuestas HTML (DOCTYPE/xml/br) y las reporta como error
- Parsea JSON con try-catch separado (protege contra JSON inválido)
- HTTP errors (status != ok) extraen `json.message` o `json.error`
- Network errors capturados con `err.message` fallback
- Retorna `RespuestaApi<T>` tipado: `{ ok, data, error, status }`

**Consecuencia:** Las funciones `apiGet`/`apiPost`/etc. **nunca rechazan (throw)**. Siempre resuelven con `ok: true|false`. Los callers NO necesitan try-catch; solo deben verificar `resp.ok`.

---

## CATEGORÍA 1: Error Masking / Silent Failures (P0-P1)

### P0-F1: Services que devuelven `ok: true` en catch (enmascaran errores)

Varios services wrappean `apiGet`/`apiPost` en un try-catch **redundante** (apiCliente ya lo hace), y retornan `{ ok: true, data: [] }` en el catch. Esto enmascara errores como resultados vacíos exitosos — el caller nunca sabe que hubo un fallo.

| # | Archivo | Línea | Función | Retorna en catch |
|---|---------|-------|---------|-----------------|
| 1 | `App/React/services/apiMensajes.ts` | L22-25 | `obtenerConversaciones` | `ok: true, data: []` |
| 2 | `App/React/services/apiMensajes.ts` | L33-36 | `obtenerMensajes` | `ok: true, data: []` |
| 3 | `App/React/services/apiNotificaciones.ts` | L48-51 | `obtenerNotificaciones` | `ok: true, data: []` |
| 4 | `App/React/services/apiPagos.ts` | L70-73 | `obtenerEstadisticasCreador` | `ok: true, data: estadisticasVacias` |
| 5 | `App/React/services/apiPagos.ts` | L79-82 | `obtenerTopSamples` | `ok: true, data: []` |
| 6 | `App/React/services/apiPagos.ts` | L89-92 | `obtenerTransacciones` | `ok: true, data: []` |
| 7 | `App/React/services/apiPagos.ts` | L99-102 | `obtenerIngresosPorPeriodo` | `ok: true, data: []` |
| 8 | `App/React/services/apiPagos.ts` | L167-176 | `obtenerEstadoConnect` | `ok: true, data: {estado: 'no_configurado'...}` |
| 9 | `App/React/services/apiReproduciones.ts` | L65-69 | `obtenerSimilares` | `ok: true, data: []` |

**Fix:** Eliminar los try-catch redundantes (apiCliente ya nunca lanza). Si se quiere mantener un fallback, retornar `ok: false` para que el caller pueda distinguir error de vacío real.

### P0-F2: Notificaciones — `marcarLeida` retorna `data: undefined` en vez de `data: null`

**Archivo:** `App/React/services/apiNotificaciones.ts` L60, L68  
Los catch de `marcarLeida` y `marcarTodasLeidas` retornan `data: undefined` en vez de `data: null`. Esto viola el contrato de `RespuestaApi<T>` que define `data: T | null`.

### P1-F3: `useSamples.cargarFeed` — fallo silencioso sin feedback

**Archivo:** `App/React/hooks/useSamples.ts` L90-101  
Si `resp.ok` es `false`, no se ejecuta ningún bloque. El estado `cargando` se pone en `false` vía `finally`, pero `error` nunca se setea. El usuario ve que "terminó de cargar" pero no recibe feedback de que falló.

```typescript
/* PROBLEMA: sin else para manejar resp.ok === false */
if (resp.ok && resp.data) {
    // ...setEstado OK
}
// falta: else { setEstado error }
```

### P1-F4: `usePublicar.publicar` — error imagen no notifica al usuario

**Archivo:** `App/React/hooks/usePublicar.ts` L80-87  
Cuando una imagen falla al subir, se logea `log.error` pero no se muestra toast ni feedback al usuario. La publicación se crea igualmente sin las imágenes que fallaron.

### P1-F5: `useCrearContenido.manejarPublicar` — misma situación con imágenes

**Archivo:** `App/React/hooks/useCrearContenido.ts` L171-176  
Mismo patrón: upload de imagen falla → logea error → continúa publicando sin la imagen. Sin toast ni feedback visible.

### P1-F6: `useMenuContextualSample` — descargar sin feedback genérico

**Archivo:** `App/React/hooks/useMenuContextualSample.ts` L141-155  
La acción "Descargar archivo" solo muestra toast en errores 429/403, pero no en errores genéricos (500, red, etc.). El usuario no recibe feedback.

---

## CATEGORÍA 2: Race Conditions (P1-P2)

### P1-F7: `useReproductor` — stale closures en useEffect con `[]` deps

**Archivo:** `App/React/hooks/useReproductor.ts` L22-50  
El primer `useEffect` tiene deps `[]` pero usa `store.siguiente()`, `store.pause()`, `store.setDuracion()`. Estas referencias se capturan en el momento del mount y pueden volverse stale. Zustand mitiga esto parcialmente porque sus funciones son estables, pero el pattern es peligroso.

**Los callbacks `onEnded` y `onError` capturan la referencia `store` del mount sin actualizarse.**

### P1-F8: Likes optimistas sin rollback — 3 hooks

| Archivo | Línea | Hook |
|---------|-------|------|
| `App/React/hooks/useExploradorPagina.ts` | L77-101 | `manejarLike` |
| `App/React/hooks/useDescargasPagina.ts` | L66-88 | `manejarLike` |
| `App/React/hooks/useFavoritosPagina.ts` | L50-86 | `manejarLike` |

**Patrón:** Se actualiza el estado local (optimista) → se llama `darLike`/`quitarLike` → **no se verifica el resultado** → si la API falla, el UI queda inconsistente con el backend.

Contraste con `useMenuContextualSample.eliminarSample` que SÍ implementa rollback correctamente (dispara `EVENTO_SAMPLE_RESTAURADO` si falla).

### P2-F9: `useHistorialIds` — sin AbortController ni cleanup

**Archivo:** `App/React/hooks/useHistorialIds.ts` L30-57  
Loop while que puede ejecutar múltiples requests. Si el componente se desmonta durante el loop, `setIdsReproducidos` y `setCargando` se llaman sobre componente desmontado. React 18+ suprime la advertencia pero el comportamiento es inesperado.

### P2-F10: `useFiltroIds` — 3 loops sin cancelación

**Archivo:** `App/React/hooks/useFiltroIds.ts` L42-100  
Tres `useEffect` separados con while-loops, ninguno tiene abort/cleanup. Mismo problema que F9 multiplicado por 3.

### P2-F11: `sugerenciasLikeStore.mostrar` — race condition sin cancellación

**Archivo:** `App/React/stores/sugerenciasLikeStore.ts` L29-32  
Si se llama `mostrar(sampleA)` y luego `mostrar(sampleB)` antes de que la primera request termine, ambos results actualizarán el state. El UI podría mostrar brevemente sugerencias de sampleA cuando el modal ya cambió a sampleB. Severidad baja (last-write-wins).

---

## CATEGORÍA 3: Missing null/undefined Checks (P2)

### P2-F12: `useReproductor` — audio.src con string vacío

**Archivo:** `App/React/hooks/useReproductor.ts` L90-97  
```typescript
const urlAudio = store.sampleActual.rutaPreview ?? '';
if (urlAudio && audio.src !== urlAudio) {
```
Si `rutaPreview` es `undefined`, `urlAudio` será `''` y se cae al `if(urlAudio)` correctamente. Pero si `rutaPreview` es un string vacío (no null/undefined), pasa el guard `??` y queda como `''` — ok. El check está bien. **Sin hallazgo real aquí.**

### P2-F13: `apiNotificaciones.obtenerConteoNoLeidas` — tipo inconsistente

**Archivo:** `App/React/services/apiNotificaciones.ts` L78-83  
Retorna `number` directamente en vez de `RespuestaApi<T>`. Si falla la red, retorna `0` sin informar del error. El caller no puede distinguir "0 notificaciones" de "error de red".

### P2-F14: `apiColecciones.normalizarColeccion` — usa `any` sin validación

**Archivo:** `App/React/services/apiColecciones.ts` L25-40  
La función `normalizarColeccion` acepta `any` y accede a propiedades sin guardar. Si el backend envía un shape inesperado, podría retornar un objeto con `undefined` en campos obligatorios como `id`, `nombre`, etc. Bajo riesgo porque el backend es controlado, pero frágil.

### P2-F15: `useSamples.cargarFeed` — non-null assertion en resp.data

**Archivo:** `App/React/hooks/useSamples.ts` L95-100  
```typescript
if (resp.ok && resp.data) {
    samples: reiniciar ? resp.data! : [...prev.samples, ...resp.data!],
    ...
    hayMas: resp.data!.length >= 20,
```
Las `!` assertions son innecesarias dentro del `if (resp.data)` — TypeScript debería inferir non-null. Esto funciona pero es un code smell.

---

## CATEGORÍA 4: try-catch Redundantes (P3 — informativo)

Los siguientes services wrappean `apiGet`/`apiPost` en try-catch cuando `apiCliente` ya garantiza que nunca lanza. El try-catch es inofensivo pero confuso:

| Archivo | Funciones afectadas |
|---------|-------------------|
| `App/React/services/apiMensajes.ts` | Todas (7 funciones) |
| `App/React/services/apiNotificaciones.ts` | Todas (4 funciones) |
| `App/React/services/apiDescargas.ts` | `obtenerLimites`, `descargarSample` |
| `App/React/services/apiPagos.ts` | 8 funciones |
| `App/React/services/apiReproduciones.ts` | Todas (3 funciones) |
| `App/React/services/apiExplorador.ts` | `obtenerColeccionados`, `obtenerCarpetas` |

**Total:** ~24 funciones con try-catch innecesario.

**Recomendación:** Eliminar el try-catch externo y confiar en apiCliente. Si se desea fallback, hacerlo verificando `resp.ok` después del await, no en un catch.

---

## CATEGORÍA 5: Performance (P2-P3)

### P2-F16: `useReproductor` — suscripción al store completo

**Archivo:** `App/React/hooks/useReproductor.ts` L16  
```typescript
const store = useReproductorStore();
```
Destructura **todo** el store. Cualquier cambio en cualquier campo (volumen, progreso, muted, cola, etc.) causa re-render del componente que usa `useReproductor`. Debería usar selectores:
```typescript
const reproduciendo = useReproductorStore(s => s.reproduciendo);
const sampleActual = useReproductorStore(s => s.sampleActual);
```

### P2-F17: `setProgreso` cada 250ms re-renderiza subscribers

**Archivo:** `App/React/hooks/useReproductor.ts` L72-79  
El `setInterval` llama `store.setProgreso(audio.currentTime)` cada 250ms, forzando re-render de todos los componentes suscritos al store (agravado por F16). Debería usar una ref para el progreso y solo actualizar el store en eventos significativos (seek, pause), o usar un selector con `shallow` equality.

### P3-F18: `manejarLike` recrea callback en cada cambio de samples

**Archivos:**
- `App/React/hooks/useExploradorPagina.ts` L77 — `[samples]`
- `App/React/hooks/useDescargasPagina.ts` L66 — `[samples]`
- `App/React/hooks/useFavoritosPagina.ts` L50 — `[samples]`

El `useCallback` para `manejarLike` tiene `samples` en las dependencias. Cada vez que `samples` cambia (frecuente con likes optimistas), se recrea el callback. Debería usar una ref para `samples` dentro del callback, o usar un setter funcional que obtenga el state actual.

### P3-F19: `useMenuContextualSample.items` — array no memoizado

**Archivo:** `App/React/hooks/useMenuContextualSample.ts` L108-259  
El array `items: MenuItemDef[]` se recalcula en cada render. Debería estar envuelto en `useMemo` con dependencias `[estado.sample, puedeEditar, puedeEliminar, esAdmin]`.

### P3-F20: `useSamplePreview` — Audio instances sin pooling

**Archivo:** `App/React/hooks/useSamplePreview.ts` L20-30  
Cada instancia de `useSamplePreview` crea un `new Audio()` al primer play. Si hay 50 samples visibles y el usuario reproduce varios, 50 Audio objects persisten en memoria hasta unmount. Para listas grandes, considerar un pool de Audio objects shared.

---

## CATEGORÍA 6: Stores — Async sin try-catch (P2)

### P2-F21: `sugerenciasLikeStore.mostrar` — async sin try-catch

**Archivo:** `App/React/stores/sugerenciasLikeStore.ts` L29-32  
```typescript
mostrar: async (sample) => {
    set({ abierto: true, sampleOrigen: sample, sugerencias: [], cargando: true });
    const resp = await obtenerSimilares(sample.id, 5);
    const lista = resp.ok && resp.data ? resp.data : [];
    set({ sugerencias: lista, cargando: false });
},
```
No tiene try-catch. Aunque `obtenerSimilares` nunca lanza (tiene su propio catch interno que retorna `ok: true, data: []`), el contrato no es explícito. Si alguien cambiara `obtenerSimilares` para propagar errores, `cargando` quedaría en `true` permanentemente.

**Nota:** Los demás stores (authStore, filtrosStore, reproductorStore, mensajesStore, etc.) son **puramente síncronos** — solo tienen setters de estado, no hacen fetch. La lógica async está en los hooks, no en los stores. Esta es una buena separación que evita el problema de async sin try-catch en stores.

---

## Resumen por Severidad

| Severidad | Cant | Descripción |
|-----------|------|-------------|
| **P0** | 6 | Error masking (`ok: true` en catch): 9 funciones en 4 services + tipo inconsistente |
| **P1** | 12 | Fallos silenciosos sin feedback, stale closures, likes sin rollback |
| **P2** | 14 | Sin AbortController, null checks, rendimiento store, race conditions menores |
| **P3** | 10 | try-catch redundantes, callbacks recreados, items no memoizados |

---

## Recomendaciones de Fix (priorizadas)

### Sprint inmediato (P0)
1. **Eliminar `ok: true` de catches en services** — retornar `ok: false` o eliminar try-catch redundante.
2. **apiNotificaciones: `data: null` en vez de `data: undefined`** en catches.

### Sprint corto (P1)
3. **Rollback en likes optimistas** — verificar `resp.ok` después de `darLike`/`quitarLike` y revertir si falla.
4. **Feedback usuario en imagen upload fallida** — toast.error en usePublicar + useCrearContenido.
5. **useSamples.cargarFeed** — agregar else para setear error cuando `!resp.ok`.
6. **useMenuContextualSample descargar** — toast.error genérico para fallos no-429/403.

### Sprint medio (P2)
7. **AbortController** en useHistorialIds y useFiltroIds para cleanup.
8. **useReproductor selectores** — fragmentar suscripción al store.
9. **Progreso vía ref** — evitar re-render 4/segundo por setProgreso.

### Backlog (P3)
10. **Eliminar try-catch redundantes** en services que ya están protegidos por apiCliente.
11. **Memoizar items** en useMenuContextualSample.
12. **Ref pattern** para samples en manejarLike callbacks.

---

## Lecciones Aprendidas

- [apiCliente]: Nunca lanza — las funciones apiGet/apiPost siempre resuelven. try-catch externo es redundante.
- [Services]: El error masking `ok: true, data: []` en catches es el patrón más peligroso — indistinguible de resultado vacío real.
- [Hooks]: Los likes optimistas sin rollback son un patrón repetido en 3 hooks; extraer a un helper shared.
- [Stores]: La separación async-en-hooks / sync-en-stores es buena práctica y previene muchos problemas.
- [Performance]: useReproductorStore sin selectores + setProgreso 4/s es el mayor impacto de rendimiento.
- [Race conditions]: useHistorialIds y useFiltroIds con while-loops sin abort son los más riesgosos en unmount.
