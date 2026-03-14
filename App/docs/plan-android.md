# Plan Android — Kamples Mobile (Tauri v2 Android)

> **Última actualización:** 14/03/2026 | **Prioridad:** MÁXIMA (QK12/QK37)
> **Plataforma objetivo:** Tauri v2 Android (WebView + Rust backend)
> **Reutilización:** 85-90% del código React existente (compartido con desktop)

## Estado Actual

### Lo que ya existe
- **Desktop Tauri v2:** App funcional con auth, sync, audio, offline queue, drag-to-DAW
- **React Islands:** 20+ islas compartidas entre web y desktop (App/React/)
- **API REST completa:** kamples.com/wp-json/kamples/v1/*
- **Android Studio:** Instalado en el sistema
- **Gitignore:** Ya excluye `App/React/android/`
- **Capacitor deps parciales:** `@capacitor/local-notifications` en package.json

### Lo que falta
- Proyecto Android (cargo tauri android init)
- Adaptadores de plataforma (FS, storage, audio) para Android
- Configuración de Tauri para móvil (tauri.android.conf.json, capabilities)
- Ajustes de UI responsive para pantallas pequeñas
- Configuración de Google Play (firma, distribución)

---

## Decisión Arquitectónica: Tauri v2 Android (NO Capacitor)

### Por qué Tauri v2 Android y no Capacitor

| Criterio | Tauri v2 Android | Capacitor |
|----------|-----------------|-----------|
| **Reutilización** | 100% Rust backend + 95% React | 0% Rust backend + 95% React |
| **Plugins existentes** | fs, store, dialog, shell, updater | Necesita todos nuevos |
| **Código compartido** | `desktop/src/` se reutiliza con guards `esMobile()` | Código desktop descartado |
| **Auth (plugin-store)** | Mismo código | Necesita @capacitor/secure-storage |
| **Tamaño bundle** | ~8-15 MB (Rust compilado) | ~3-5 MB (solo JS bridge) |
| **Rendimiento FS** | Rust nativo (disk I/O) | Bridge JS→Java (overhead) |
| **Sistema de sync** | Reutilizable (13 servicios, Tauri plugin-fs) | Reescritura completa |

**Decisión:** Tauri v2 Android. Reutiliza el 85-90% del código React + 70% del código Rust. El sistema de sync (la feature más compleja) se reutiliza con mínimas adaptaciones.

---

## Fases de Implementación

### Fase 0: Scaffolding (Prerequisitos)

**Objetivo:** Proyecto Tauri Android compilando y ejecutándose con pantalla blanca + "Hello World".

#### Tareas
1. **Instalar Android SDK y verificar toolchain**
   ```powershell
   # Verificar que Android Studio tiene SDK 34+, NDK, CMake
   # Variables de entorno: ANDROID_HOME, JAVA_HOME (JDK 17+)
   # Verificar ADB: adb devices
   ```
   
2. **Inicializar proyecto Android en Tauri**
   ```powershell
   cd desktop
   cargo tauri android init
   ```
   Esto crea `desktop/src-tauri/gen/android/` con el proyecto Gradle.

3. **Configurar `tauri.android.conf.json`** (override para Android)
   ```json
   {
     "app": {
       "windows": [
         {
           "label": "main",
           "title": "Kamples",
           "fullscreen": false
         }
       ]
     },
     "bundle": {
       "android": {
         "minSdkVersion": 26
       }
     }
   }
   ```
   - Solo 1 ventana (no sync-panel ni config como ventanas separadas)
   - `minSdkVersion: 26` (Android 8.0+, cubre 95%+ dispositivos)

4. **Compilar y probar en emulador**
   ```powershell
   cargo tauri android dev
   ```

5. **Verificar que los plugins actuales compilan para Android**
   - `tauri-plugin-store`: OK en Android
   - `tauri-plugin-fs`: OK (Scoped Storage en Android 10+)
   - `tauri-plugin-dialog`: OK
   - `tauri-plugin-os`: OK
   - `tauri-plugin-shell`: LIMITADO en Android (solo `open` para URLs)
   - `tauri-plugin-drag`: NO DISPONIBLE en Android → excluir con feature flag
   - `tauri-plugin-updater`: NO NECESARIO en Android (Google Play) → excluir
   - `tauri-plugin-window-state`: NO RELEVANTE en móvil → excluir

#### Criterio de éxito
- [ ] Proyecto compila sin errores para Android
- [ ] Emulador muestra la WebView
- [ ] Plugins compatibles cargan sin crash

---

### Fase 1: App Base Funcional (Core)

**Objetivo:** Navegar por las pantallas principales, login, reproducir audio desde el servidor.

#### 1.1 — Detección de plataforma

Crear guard de plataforma para bifurcar lógica:

```typescript
/* desktop/src/services/desktopService.ts */
export function esDesktop(): boolean {
    return !!window.__TAURI_INTERNALS__ && !esMobile();
}

export function esMobile(): boolean {
    /* Tauri v2: platform() retorna 'android' o 'ios' */
    return /android|ios/i.test(navigator.userAgent) 
        || (window.__TAURI_INTERNALS__ && window.innerWidth < 768);
}

export function esAndroid(): boolean {
    return /android/i.test(navigator.userAgent);
}
```

Los servicios existentes usan `esDesktop()` → sigue funcionando. Los servicios Android usan `esMobile()` o `esAndroid()`.

#### 1.2 — Entry point Android

Crear `desktop/src/mainMobile.tsx` (punto de entrada para Android):

```
desktop/
├── src/
│   ├── main.tsx           ← Desktop (existente, no tocar)
│   ├── mainMobile.tsx     ← Android (nuevo)
│   └── services/
│       ├── ...existentes...
│       ├── mobileService.ts    ← Init Android-específico
│       └── mobileAdapters.ts   ← Feature flags para móvil
```

`mainMobile.tsx`:
- Las mismas rutas que `main.tsx` (RUTAS_DESKTOP → RUTAS_MOBILE)
- Omite: `__KAMPLES_DRAG__`, `__KAMPLES_UPLOAD__` (features desktop-only)
- Simplifica: `__KAMPLES_SYNC__` (sin file watcher, solo descarga manual)
- Agrega: Back button handling (Android hardware back)
- Agrega: Status bar config
- Agrega: Deep linking (kamples://sample/{id})

#### 1.3 — Auth en Android

El `authDesktopService.ts` ya funciona en Android (Tauri plugin-store es cross-platform). Solo necesita:
- Verificar que `localStorage` persiste en Android WebView (generalmente sí)
- Verificar que Google Sign-In funciona en WebView Android (requiere Chrome Custom Tabs)

**Google Sign-In en Android:**
- La implementación actual usa GSI (Google Sign-In for Web)
- En WebView Android, GSI puede no funcionar directamente
- Alternativa: usar Chrome Custom Tabs para OAuth flow, o Tauri deep link
- **Plan:** Implementar OAuth redirect flow como fallback:
  1. User toca "Login con Google"
  2. App abre Chrome Custom Tab con URL de Google OAuth
  3. Redirect callback a `kamples://auth/callback?token=...`
  4. Tauri captura el deep link y extrae el token

#### 1.4 — Reproducción de Audio

El reproductor (`reproductorStore.ts`, componentes de reproductor) funciona 100% con HTML5 Audio. En Android WebView, HTML5 Audio funciona nativamente.

**Consideraciones Android:**
- Audio focus: cuando otra app reproduce audio, pausar Kamples
  - Solución: listener `visibilitychange` + `blur/focus` events
- Reproducción en background: WebView pausa audio cuando la app va a background
  - Solución Fase 2+: Foreground Service con MediaSession API (requiere Rust/Java/Kotlin)
- Lock screen controls: requiere MediaSession API
  - Solución Fase 2+: plugin Tauri custom o contribución a `tauri-plugin-media-session`

**Para Fase 1:** Reproducción en foreground funciona sin cambios. Background playback es Fase 2.

#### 1.5 — UI Adaptación Móvil

**Componentes que necesitan adaptación responsive:**
- `PanelLateral.tsx` → Bottom Navigation o Drawer
- `ReproductorFlotante.tsx` → Mini player en bottom (ya responsive probablemente)
- `TarjetaSample.tsx` → Full width en móvil
- `BarraBusqueda.tsx` → Expandible/colapsable

**Strategy:** CSS media queries + `esMobile()` guard para layout:
```css
@media (max-width: 768px) {
    .panelLateral { display: none; }
    .navegacionMobile { display: flex; }
}
```

#### Criterio de éxito
- [ ] Login (email + Google) funciona en Android
- [ ] Feed de samples carga y muestra
- [ ] Reproducción de audio funciona (foreground)
- [ ] Navegación entre pantallas funciona
- [ ] Back button de Android funciona

---

### Fase 2: Sincronización y Almacenamiento

**Objetivo:** Descargar y almacenar samples para reproducción offline.

#### 2.1 — Scoped Storage en Android

Android 10+ usa Scoped Storage. El `tauri-plugin-fs` maneja esto internamente.

**Directorio de datos de la app:**
- Privado (sin permiso): `{app_data}/kamples/samples/`
- Los archivos .wav/.mp3 se almacenan aquí
- No visibles en galería/explorador (privados de la app)
- Se eliminan si el usuario desinstala la app

**Alternativa (archivos compartidos):**
- Si el usuario quiere acceder a los samples desde un DAW Android, usar `MediaStore`
- Requiere permiso `READ_MEDIA_AUDIO` (Android 13+)
- Los archivos se guardan en `Music/Kamples/`
- **Decisión para más adelante**: por defecto privado, opción de "exportar a Music"

#### 2.2 — Adaptación del sistema de sync

Los 13 servicios de sync se reutilizan con estas adaptaciones:

| Servicio | Desktop | Android | Cambio |
|----------|---------|---------|--------|
| `syncService.ts` | Funciona | Funciona | Guard `esMobile()` para simplificar |
| `syncInitService.ts` | Config de carpeta local | Dir fijo (`app_data/samples`) | Eliminar diálogo de carpeta |
| `syncOrchestratorService.ts` | Full sync | Solo descarga | Desactivar upload automático |
| `syncWatcherSetup.ts` | File watcher activo | **Desactivar** | No aplica en móvil |
| `fileWatcherService.ts` | Monitorea carpeta | **Desactivar** | No aplica (no hay carpeta externa) |
| `uploadQueueService.ts` | Auto-upload | **Desactivar** | No hay archivos locales para subir |
| `audioLocalService.ts` | `convertFileSrc()` | `convertFileSrc()` | Funciona igual |
| `syncState.ts` | Persiste en Tauri Store | Igual | Sin cambios |

**Cambio clave:** En Android, sync = solo descarga (pull). No hay push (upload desde carpeta local). El usuario no produce samples en el teléfono.

```typescript
/* syncOrchestratorService.ts */
export async function sincronizarConServidor(onProgreso) {
    if (esMobile()) {
        /* Solo descargar samples que faltan localmente */
        return await descargarSamplesFaltantes(onProgreso);
    }
    /* Desktop: sync completo bidireccional */
    return await syncBidireccional(onProgreso);
}
```

#### 2.3 — Gestión de espacio

Android tiene almacenamiento limitado. El sistema de sync debe:
- Mostrar espacio usado vs disponible
- Permitir eliminar samples descargados individualmente
- Auto-limpiar cache de samples menos usados cuando se acerca el límite
- Configuración: máximo de almacenamiento offline (ej: 1GB, 5GB, ilimitado)

#### Criterio de éxito
- [ ] Samples se descargan y almacenan en app_data
- [ ] Reproducción offline funciona
- [ ] Gestión de espacio muestra stats
- [ ] Eliminación de samples descargados funciona

---

### Fase 3: Experiencia Nativa Android

**Objetivo:** Features que hacen que la app se sienta nativa, no un wrapper de WebView.

#### 3.1 — Notificaciones Push (FCM)

**Implementación:**
1. Registrar app en Firebase Console
2. Agregar `google-services.json` al proyecto Android
3. Usar `tauri-plugin-notification` o wrapper custom de FCM
4. Backend: endpoint `/kamples/v1/fcm/register` para registrar device token
5. Server-side: enviar push via Firebase Admin SDK (PHP) para:
   - Nuevos mensajes en chat
   - Respuesta a comentarios
   - Nuevo sample en colección seguida
   - Estado de extracción/IA completado

#### 3.2 — Background Audio (Foreground Service)

**Requiere código nativo (Kotlin/Java):**
1. Crear Foreground Service para reproducción continua
2. Implementar `MediaSession` para controles en lock screen y notificación
3. Manejar audio focus (pausar cuando llega llamada, etc.)
4. Plugin Tauri custom: `tauri-plugin-media-session`

**Alternativa simplificada:** Usar `cordova-plugin-media` adaptado, o NativeScript MediaPlayer. Evaluar esfuerzo vs beneficio.

#### 3.3 — Deep Linking

Registrar scheme `kamples://` y dominio `kamples.com`:
- `kamples://sample/{id}` → abre detalle de sample
- `kamples://perfil/{username}` → abre perfil
- `kamples://coleccion/{slug}` → abre colección
- `https://kamples.com/sample/{slug}` → Android App Links (verificado)

Configurar en `AndroidManifest.xml`:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="https" android:host="kamples.com"/>
</intent-filter>
```

Y servir `/.well-known/assetlinks.json` desde kamples.com.

#### 3.4 — Splash Screen y App Icon

1. Iconos adaptativos (foreground + background layers)
2. Splash screen con `SplashScreenTheme` (Android 12+ nativo)
3. Colores de status bar y navigation bar matching el tema de la app

#### 3.5 — In-App Purchases (reemplaza Stripe en móvil)

Google Play requiere Google Play Billing para compras in-app:
- **No se puede usar Stripe directamente** en apps distribuidas por Play Store
- Necesita: `com.android.vending.BILLING` permission
- Plugin: custom Tauri plugin wrapping Google Play Billing Library
- Tipos de producto: suscripciones (plan Pro mensual/anual)
- El backend verifica la compra con Google Play Developer API

**Alternativa:** Distribuir fuera de Play Store (APK directo). Permite usar Stripe. Pero pierde visibilidad en la tienda.

**Decisión recomendada:** Play Store con Google Play Billing. El 30% de comisión de Google es el costo de distribución.

#### Criterio de éxito
- [ ] Notificaciones push recibidas en background
- [ ] Audio continúa con app minimizada  
- [ ] Deep links abren la pantalla correcta
- [ ] Splash screen y iconos nativos
- [ ] Compras in-app funcionan

---

### Fase 4: Optimización y Distribución

#### 4.1 — Performance

- **ProGuard/R8:** Minificar código Android nativo
- **Bundle splitting:** Lazy load de islas pesadas (Mezclador → no cargar en móvil)
- **Image optimization:** WebP + lazy load + tamaños responsive
- **Cache API responses:** Service Worker o cache manual para offline
- **Reducir RAM:** Limitar historial de reproducciones en memoria

#### 4.2 — Testing

- Android Emulator (API 26, 30, 34 — cobertura mínima)
- Dispositivo físico real (performance de audio)
- Network throttling (3G, offline)
- Monitoreo de ANR (Application Not Responding)
- Crash reporting (Firebase Crashlytics o Sentry)

#### 4.3 — Google Play Store

1. **Crear cuenta de desarrollador** (Google Play Console, $25 one-time)
2. **Generar keystore de firma** (debug y release separados)
3. **Configurar app en Play Console:**
   - Categoría: Música y Audio
   - Clasificación de contenido: IARC
   - Política de privacidad (URL en kamples.com)
   - Screenshots (teléfono + tablet)
4. **Internal testing track → Closed beta → Open beta → Production**
5. **Play App Signing:** Dejar que Google gestione la clave de firma

#### 4.4 — CI/CD

Pipeline de build automatizado:
```
git push → GitHub Actions → 
  1. npm run build (React)
  2. cargo tauri android build --target aab
  3. Firmar AAB
  4. Upload a Play Console (internal track)
```

---

## Plugins Tauri: Compatibilidad Android

| Plugin | Desktop | Android | Notas |
|--------|---------|---------|-------|
| `plugin-store` | ✅ | ✅ | Funciona igual (SharedPreferences backend) |
| `plugin-fs` | ✅ | ✅ | Scoped Storage, rutas diferentes |
| `plugin-dialog` | ✅ | ✅ | Intent picker en Android |
| `plugin-os` | ✅ | ✅ | Retorna 'android' |
| `plugin-shell` | ✅ | ⚠️ | Solo `open` (URLs), no exec |
| `plugin-drag` | ✅ | ❌ | No existe concepto en móvil |
| `plugin-updater` | ✅ | ❌ | Google Play maneja updates |
| `plugin-window-state` | ✅ | ❌ | No relevante en móvil |
| `plugin-process` | ✅ | ❌ | No disponible en Android |
| `plugin-notification` | ❌ | ✅ | Agregar para push notifications |

### Exclusión condicional en Cargo.toml

```toml
[target.'cfg(not(target_os = "android"))'.dependencies]
tauri-plugin-drag = "2.1.0"
tauri-plugin-updater = "2"
tauri-plugin-window-state = "2"
tauri-plugin-process = "2"

[target.'cfg(target_os = "android")'.dependencies]
# tauri-plugin-notification = "2"  # Cuando se implementen push
```

---

## Comandos Rust: Adaptación Android

| Comando | Desktop | Android | Cambio |
|---------|---------|---------|--------|
| `obtener_version()` | ✅ | ✅ | Sin cambios |
| `obtener_plataforma()` | ✅ | ✅ | Retorna "android" |
| `archivo_existe()` | ✅ | ✅ | Rutas Scoped Storage |
| `obtener_tamano_archivo()` | ✅ | ✅ | Sin cambios |
| `obtener_espacio_disponible()` | ✅ | ✅ | Mide app_data |
| `abrir_carpeta()` | ✅ | ❌ | No aplica (no hay explorador) |
| `seleccionar_archivo()` | ✅ | ⚠️ | Intent ACTION_OPEN_DOCUMENT |
| `toggle_ventana_sync()` | ✅ | ❌ | Reemplazar con bottom sheet |
| `mostrar_ventana_config()` | ✅ | ❌ | Reemplazar con screen/modal |
| Tray icon commands | ✅ | ❌ | Reemplazar con notificaciones |

---

## Estimación de Reutilización de Código

| Capa | Archivos | Reutilizable | Adaptación |
|------|----------|-------------|------------|
| **React components** (App/React) | 80+ | 90% | Media queries + guards |
| **Stores Zustand** | 15+ | 98% | Sin cambios |
| **API services** | 20+ | 100% | Sin cambios |
| **Hooks** | 25+ | 95% | Guard `esDesktop()` en hooks de sync |
| **Desktop services** | 15+ | 60% | Guards + adaptaciones FS |
| **Rust commands** | 10 | 70% | Config features Android |
| **CSS** | 30+ | 85% | Responsive breakpoints |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| WebView performance en gama baja | Media | Alto | Lazy load agresivo, reducir DOM |
| Audio background no funciona | Alta | Alto | Foreground Service (Fase 3) |
| Google OAuth en WebView bloqueado | Media | Alto | Chrome Custom Tabs fallback |
| Scoped Storage limita sync | Baja | Medio | Usar app_data dir (sin permisos) |
| Google Play rechaza app | Baja | Alto | Cumplir políticas desde el inicio |
| Plugin Tauri no compila Android | Media | Medio | Feature flags por plataforma |

---

## Secuencia de Ejecución Recomendada

```
Fase 0 (Scaffolding)          ← 1-2 días
  ├── Android SDK setup
  ├── cargo tauri android init
  ├── Feature flags Cargo.toml
  └── Hello World en emulador

Fase 1 (App Base)              ← 3-5 días  
  ├── mainMobile.tsx entry
  ├── Platform detection
  ├── Auth (login email + Google)
  ├── Feed + navegación
  ├── Audio foreground
  └── UI responsive basics

Fase 2 (Sync & Offline)        ← 3-5 días
  ├── Adaptación sync (pull-only)
  ├── Almacenamiento local
  ├── Reproducción offline
  └── Gestión de espacio

Fase 3 (Nativo)                ← 5-8 días
  ├── Push notifications (FCM)
  ├── Background audio
  ├── Deep linking
  ├── Splash + icons
  └── In-app purchases

Fase 4 (Distribución)          ← 2-3 días
  ├── Performance optimization
  ├── Testing (emulador + real)
  ├── Play Store setup
  └── CI/CD pipeline
```

---

## Lecciones del Desktop que aplican

- `[Auth]`: Tauri Store + localStorage dual funciona. En Android, SharedPreferences (backend de plugin-store) es más fiable que en desktop.
- `[Sync]`: El sistema de sync es overengineered para móvil. Simplificar a pull-only reduce 70% de la complejidad.
- `[Audio]`: HTML5 Audio funciona en Android WebView sin problemas para foreground. Background es otro nivel de complejidad.
- `[Multi-window]`: Android no tiene multi-window para WebView apps. Integrar sync/config como pantallas/modales.
- `[Drag-to-DAW]`: Feature exclusiva de desktop. En móvil el paradigma es "compartir" o "exportar".
- `[File watcher]`: No aplica en móvil. Los usuarios no producen samples en el teléfono.
- `[Payments]`: Stripe NO se puede usar en apps de Play Store. Google Play Billing obligatorio.
