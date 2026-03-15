# Debug: Login Android — "Email/usuario y contraseña son requeridos"

> **Creado:** 15/03/2026 | **Estado:** RESUELTO (migración a estado controlado)

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
