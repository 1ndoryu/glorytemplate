# Debug: Login Android — "Email/usuario y contraseña son requeridos"

> **Creado:** 15/03/2026 | **Estado:** RESUELTO — 3 fixes en C215/C215b

---

## Síntoma

El formulario de login muestra el error **"Email/usuario y contraseña son requeridos."** aunque el usuario tiene texto visible en ambos campos. El backend recibe `email` y/o `password` como strings vacíos.

---

## Diagnóstico Realizado (Cronológico)

### Paso 1 — Hipótesis inicial: Android IME Composition Buffer

Hipótesis: `useRef.current.value` leía vacío porque el teclado IME de Android no confirmaba el texto al DOM antes del submit.

**Acción:** Migrar `LoginIsland.tsx` de `useRef` a `useState` controlado.

**Resultado:** El error persistió. Además se descubrió que el componente real de login es `ModalAuth.tsx`, no `LoginIsland.tsx`. `ModalAuth.tsx` YA usaba `useState` correcto.

---

### Paso 2 — Confirmar que el estado JS captura los valores

Se añadió debug al botón: `Iniciar [{email.length}/{password.length}]`

**Resultado:** El botón mostró `[4/8]` — el estado React SÍ captura los valores correctamente. El problema NO es frontend.

---

### Paso 3 — Fetch directo a kamples.com (CORS cross-origin)

```js
await fetch('https://kamples.com/wp-json/kamples/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
});
```

**Resultado:** `status=400` — `{"ok":false,"error":"Email/usuario y contraseña son requeridos."}`

El servidor recibe el request pero devuelve 400. El body llega vacío al PHP.

---

### Paso 4 — Fetch via proxy Vite (URL relativa, sin CORS)

```js
await fetch('/wp-json/kamples/v1/auth/login', { ... });
```

**Resultado:** `status=400` — mismo error. El proxy Vite tampoco ayuda. Descarta problema CORS.

**Conclusión:** El problema es **100% server-side**. PHP no está leyendo el body del request.

---

### Paso 5 — Fix 1: Fallback `php://input` en PHP (INCORRECTO)

```php
$rawInput = file_get_contents('php://input');
```

**Resultado:** FALLÓ. Razón: WordPress REST Server lee `php://input` durante el routing REST y lo almacena en `$request->body`. Al llamar `file_get_contents('php://input')` de nuevo, el stream ya está consumido y retorna vacío.

---

### Paso 6 — Fix 2: Fallback `$request->get_body()` (CORRECTO en teoría)

```php
$body = $request->get_json_params();
if (empty($body)) {
    $rawBody = $request->get_body();
    $body = json_decode($rawBody, true);
}
```

`get_body()` lee de `$request->body` (ya en memoria, no del stream). También se añadió logging a nivel `KamplesLogger::error` cuando el 400 se dispara.

**Estado:** Desplegado — pendiente verificación con logs del servidor.

---

## Root Cause — CONFIRMADO

**Tauri Android intercepta TODOS los requests HTTP al host del dev server (`10.x.x.x:1420`) via `shouldInterceptRequest` de Android WebView.** Al interceptarlo, Android recrea el request desde un `WebResourceRequest` — y esta API de Android **no expone el body** de requests POST/PUT. El body se pierde antes de llegar a Vite proxy.

Evidencia:
- `curl` desde el host del desarrollador → Vite proxy → kamples.com → body llega OK (`rest_invalid_json` por quoting de PowerShell)
- `fetch()` desde Android WebView → Tauri intercepta → pierde body → `get_body_length=0` en PHP
- `new XHR()` desde Android WebView → mismo resultado (también pasa por `shouldInterceptRequest`)
- El `Content-Type` SÍ llega (los headers no se pierden, solo el body)

---

## Solución Implementada (C215)

**`desktop/src/services/apiDesktopAdapter.ts`** — detección de Android en tiempo de ejecución:

```ts
const esAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
```

En Android dev mode, `obtenerServidorUrl()` retorna `https://kamples.com/wp-json` (SERVIDOR_PROD), y `resolverUrlParaEntorno()` convierte URLs relativas `/wp-json/*` a absolutas `https://kamples.com/wp-json/*`.

**Por qué funciona:** Tauri solo intercepta requests al host del dev server (`10.x.x.x:1420`). Requests a `https://kamples.com` se dejan pasar al stack de red normal del WebView, donde el body POST está intacto.

**CORS funciona:** kamples.com usa CORS dinámico (echo del `Origin` header), permitiendo cualquier origen cross-origin.

Cambios concretos:
- `obtenerServidorUrl()`: Android → `SERVIDOR_PROD`; Desktop dev → `SERVIDOR_DEV` (sin cambio)
- `resolverUrlParaEntorno()`: función nueva que reemplaza el mapeo de URLs por plataforma
- `configurarProxyFetch()`: usa `resolverUrlParaEntorno`, salta reescritura de respuestas en Android
- `inyectarAuthHeader()`: usa `resolverUrlParaEntorno`, salta reescritura de respuestas en Android

**Requiere rebuild APK:** NO — el fix es pure JS/TS, se despliega via Vite HMR.

---

## Pasos de Debug Realizados (Cronológico)

---

## Guía: Arrancar la App en el Emulador Android

### Requisitos Previos

1. **Android Studio** con SDK API 34+, AVD (Medium_Phone_API_36 o similar), `ANDROID_HOME`, `JAVA_HOME` (JDK 17+)

2. **Vite dev server corriendo** — el emulador usa `10.8.0.2:1420`:
   ```powershell
   cd desktop
   npm run dev
   # Verificar: Network: http://10.8.0.2:1420/
   ```

### Flujo de Desarrollo Normal (APK ya instalada)

```powershell
# 1. Iniciar servidor Vite (OBLIGATORIO antes de abrir la app)
cd "c:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\desktop"
npm run dev

# 2. Abrir la app Kamples en el emulador
```

### Ver Logs del Servidor (Para Diagnóstico)

```powershell
ssh root@66.94.100.241 "docker exec wordpress-mo4so4440c488g8woow4cow0 tail -100 /var/www/html/wp-content/themes/glorytemplate/App/logs/kamples.log"
```

### Deploy a Producción

```powershell
cd ".agent\coolify-manager-rs"
.\target\release\coolify-manager.exe deploy --name kamples --update
```

### Si la App Muestra "Failed to request http://10.8.0.2:1420"

El servidor Vite no está corriendo. Ejecutar `npm run dev` en `desktop/`.

### Diagrama de Conexión

```
Emulador Android
  └── App Kamples (WebView)
        ├── [DEV APK]  → http://10.8.0.2:1420  → npm run dev (host)
        └── [PROD APK] → https://kamples.com   → VPS (deploy requerido)
```

---

## Historial de Intentos

| Intento | Resultado | Descartado porque |
|---------|-----------|-------------------|
| `useRef` → `useState` en LoginIsland | No cambió nada | LoginIsland no es el componente real de login |
| Subir rate limit a 100 | No era el problema | El error es pre-auth (body vacío) |
| Fallback `php://input` | Falló | Stream ya consumido por WP REST antes de llegar al controller |
| Fallback `$request->get_body()` | Pendiente verificación | — |


---

## Síntoma

El formulario de login muestra el error **"Email/usuario y contraseña son requeridos."** aunque el usuario tiene texto visible en ambos campos. El backend recibe `email` y/o `password` como strings vacíos.

---

## Causa Raíz: Android IME Composition Buffer

El problema ocurre en **Android WebView + Tauri** (y también en WebView puro).

En Android, el teclado virtual (IME — Input Method Engine) mantiene un **composition buffer** interno donde acumula el texto mientras el usuario escribe. El texto se "confirma" al DOM (`input.value`) solo cuando:

- El usuario toca otro elemento
- El usuario presiona el botón de confirmación del teclado (Enter/check)
- El software IME decide confirmar (comportamiento varía por teclado: Gboard, Samsung, etc.)

Si el usuario toca directamente el botón Submit sin cerrar el teclado primero, el texto en el composition buffer **no ha sido escrito al `input.value`** todavía. Un `ref.current.value` lee el DOM, que en ese momento puede estar vacío o incompleto.

### Por qué `useRef` falla aquí

```tsx
// PROBLEMÁTICO en Android — lee el DOM, que puede tener el buffer sin confirmar
const email = emailRef.current?.value ?? '';
const password = passwordRef.current?.value ?? '';
```

### Por qué `useState` + `value`/`onChange` funciona

```tsx
// CORRECTO — onChange se dispara con cada keystroke incluyendo los del IME
// React sincroniza el estado en cada cambio, independientemente del composition state
const [email, setEmail] = useState('');
<input value={email} onChange={e => setEmail(e.target.value)} />
```

El evento `input` (que dispara `onChange` de React) se emite cuando el IME confirma cada carácter, manteniendo el estado de React siempre sincronizado.

---

## Fix Aplicado

Migración del `LoginIsland.tsx` de `useRef` a `useState` controlado.

**Archivo:** `App/React/islands/auth/LoginIsland.tsx`

**Antes:**
```tsx
const emailRef = useRef<HTMLInputElement>(null);
const passwordRef = useRef<HTMLInputElement>(null);

const manejarSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (emailRef.current?.value ?? '').trim();
    const password = passwordRef.current?.value ?? '';
    iniciarSesion(email, password);
};

// JSX:
<CampoTexto ref={emailRef} ... />
<CampoTexto ref={passwordRef} ... />
```

**Después:**
```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const manejarSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    iniciarSesion(email.trim(), password);
};

// JSX:
<CampoTexto value={email} onChange={e => setEmail(e.target.value)} ... />
<CampoTexto value={password} onChange={e => setPassword(e.target.value)} ... />
```

---

## Notas Adicionales

- El `"0"` que aparece en el UI encima del formulario puede ser un render de un boolean o número en JSX — investigar si persiste tras el fix.
- El rate limit de `AuthController.php` está en 100 (temporal para testing). **Revertir a 5 antes de producción final.**

---

## Guía: Arrancar la App en el Emulador Android

### Requisitos Previos

1. **Android Studio** instalado con:
   - Android SDK (API 34+ recomendado)
   - Android Virtual Device (AVD) configurado — Medium_Phone_API_36 o similar
   - Variables de entorno: `ANDROID_HOME`, `JAVA_HOME` (JDK 17+)

2. **Vite dev server corriendo** — el emulador Android usa la IP `10.8.0.2:1420` para llegar al host:
   ```powershell
   cd desktop
   npm run dev
   # Verificar que aparece: Network: http://10.8.0.2:1420/
   ```

3. **APK instalada en el emulador** — el Tauri APK de desarrollo ya debe estar instalado. Si no está:
   ```powershell
   cd desktop
   npm run tauri:android:build  # Genera APK
   # Luego instalar con ADB:
   adb install .\src-tauri\gen\android\app\build\outputs\apk\universal\debug\app-universal-debug.apk
   ```

### Flujo de Desarrollo Normal (APK ya instalada)

```powershell
# 1. Iniciar servidor Vite (OBLIGATORIO antes de abrir la app)
cd "c:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\desktop"
npm run dev
# Output esperado: Network: http://10.8.0.2:1420/

# 2. Abrir la app Kamples en el emulador
# (La app ya conecta a 10.8.0.2:1420 automáticamente)

# 3. Ver logs del emulador
adb logcat | Select-String "Kamples|RustDesk|tauri|chromium" # PowerShell
# o en CMD:
# adb logcat | findstr "Kamples tauri chromium"
```

### Ver Logs de la App

```powershell
# Logs generales del WebView (JavaScript console.log, errores)
adb logcat -s "chromium"

# Logs de Tauri (Rust backend)
adb logcat -s "tauri"

# Todos los logs filtrando errores
adb logcat *:E
```

### Si la App Muestra "Failed to request http://10.8.0.2:1420"

El servidor Vite no está corriendo. Solución:
```powershell
cd "c:\Users\Owner\OneDrive\Documentos\WP\app\public\wp-content\themes\glorytemplate\desktop"
npm run dev
```

El error desaparece y la app carga cuando el servidor está activo.

### Si la App Carga kamples.com en Lugar de Vite Local

El APK instalado puede ser el de **producción** (no el de dev). El APK de producción hardcodea `https://kamples.com` como punto de entrada — cambios en React no son visibles hasta hacer commit + deploy.

Para usar Vite local: instalar el APK de **debug** generado con `tauri android build --debug` o `tauri android dev`.

### Comando de Deploy a Producción

```powershell
cd ".agent\coolify-manager-rs"
.\target\release\coolify-manager.exe deploy --name kamples --update
# Con forzar rebuild React:
.\target\release\coolify-manager.exe deploy --name kamples --update --force
```

### Diagrama de Conexión

```
Emulador Android
  └── App Kamples (WebView)
        ├── [DEV APK]  → http://10.8.0.2:1420  → npm run dev (host)
        └── [PROD APK] → https://kamples.com   → VPS (deploy requerido)
```

---

## Historial de Intentos Fallidos

| Intento | Por qué no funcionó |
|---------|----------------------|
| `useRef` en formulario | Android IME no confirma el valor al DOM antes del submit |
| Subir rate limit a 100 | No era problema de rate limit, era problema de campos vacíos |
| `console.error` de debug en `iniciarSesion` | No visible en logcat si el APK carga prod |
| Reiniciar la app sin Vite server | App cargaba desde prod (kamples.com), ignoraba cambios locales |
