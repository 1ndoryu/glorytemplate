# Guia de Integracion FCM (Firebase Cloud Messaging) — Kamples Android

## Estado Actual

El sistema de notificaciones nativas usa `tauri-plugin-notification` (v2.3.3) para mostrar
notificaciones locales cuando la app recibe eventos via WebSocket (`wss://ws.kamples.com`).

**Limitacion actual:** Las notificaciones solo funcionan cuando la app esta abierta (foreground/background)
con la conexion WebSocket activa. Si el usuario cierra la app, no recibe nada.

**Objetivo de FCM:** Enviar notificaciones push remotas incluso cuando la app esta completamente cerrada
(proceso terminado, dispositivo en reposo).

---

## Infraestructura Existente

| Componente | Archivo | Estado |
|---|---|---|
| Plugin notificaciones Tauri | `Cargo.toml` / `package.json` | Instalado (v2.3.3) |
| Permiso POST_NOTIFICATIONS | `AndroidManifest.xml` | Configurado |
| Canales Android | `App/React/services/notificacionNativa.ts` | 2 canales: notificaciones, mensajes |
| Hook wiring a WS | `App/React/hooks/useNotificacionesNativas.ts` | Escucha eventos WS |
| Capabilities Tauri | `desktop/src-tauri/capabilities/principal.json` | Todas las perms de notificacion |
| Backend WS | `websocket-server/server.ts` | Bun standalone, envia eventos |

---

## Plan de Integracion FCM (4 fases)

### Fase 1: Firebase Project + Configuracion Android

1. **Crear proyecto Firebase:**
   - Ir a [Firebase Console](https://console.firebase.google.com)
   - Crear proyecto "Kamples" (o vincular proyecto Google existente)
   - Agregar app Android con package name: `app.kamples.desktop`

2. **Descargar `google-services.json`:**
   - Colocarlo en: `desktop/src-tauri/gen/android/app/google-services.json`
   - **NO commitearlo** si contiene API keys sensibles — usar `.gitignore` o env vars

3. **Agregar dependencias Gradle:**

   En `desktop/src-tauri/gen/android/build.gradle.kts` (project-level), agregar:
   ```kotlin
   buildscript {
       dependencies {
           classpath("com.google.gms:google-services:4.4.2")
       }
   }
   ```

   En `desktop/src-tauri/gen/android/app/build.gradle.kts` (app-level), agregar:
   ```kotlin
   plugins {
       id("com.google.gms.google-services")
   }

   dependencies {
       implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
       implementation("com.google.firebase:firebase-messaging")
   }
   ```

4. **Crear servicio FCM nativo (Kotlin):**

   Crear archivo: `desktop/src-tauri/gen/android/app/src/main/java/app/kamples/desktop/KamplesFirebaseService.kt`
   ```kotlin
   package app.kamples.desktop

   import android.app.NotificationChannel
   import android.app.NotificationManager
   import android.content.Context
   import android.os.Build
   import androidx.core.app.NotificationCompat
   import com.google.firebase.messaging.FirebaseMessagingService
   import com.google.firebase.messaging.RemoteMessage

   class KamplesFirebaseService : FirebaseMessagingService() {

       override fun onNewToken(token: String) {
           super.onNewToken(token)
           /* TO-DO: Enviar token al backend via API */
           /* POST /kamples/v1/usuarios/registrar-fcm-token { token, plataforma: "android" } */
       }

       override fun onMessageReceived(message: RemoteMessage) {
           super.onMessageReceived(message)
           val datos = message.data
           val tipo = datos["tipo"] ?: "sistema"
           val canalId = if (tipo == "mensaje_nuevo") "mensajes" else "notificaciones"

           val titulo = datos["titulo"] ?: message.notification?.title ?: "Kamples"
           val cuerpo = datos["cuerpo"] ?: message.notification?.body ?: ""

           crearCanalSiNecesario(canalId)

           val notifBuilder = NotificationCompat.Builder(this, canalId)
               .setSmallIcon(android.R.drawable.ic_dialog_info)
               .setContentTitle(titulo)
               .setContentText(cuerpo)
               .setPriority(NotificationCompat.PRIORITY_HIGH)
               .setAutoCancel(true)

           val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
           manager.notify(System.currentTimeMillis().toInt(), notifBuilder.build())
       }

       private fun crearCanalSiNecesario(canalId: String) {
           if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
               val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
               if (manager.getNotificationChannel(canalId) == null) {
                   val nombre = if (canalId == "mensajes") "Mensajes" else "Notificaciones"
                   val importancia = if (canalId == "mensajes")
                       NotificationManager.IMPORTANCE_HIGH
                   else
                       NotificationManager.IMPORTANCE_DEFAULT
                   val canal = NotificationChannel(canalId, nombre, importancia)
                   manager.createNotificationChannel(canal)
               }
           }
       }
   }
   ```

5. **Registrar servicio en AndroidManifest.xml:**
   ```xml
   <application ...>
       <!-- Servicio FCM -->
       <service
           android:name=".KamplesFirebaseService"
           android:exported="false">
           <intent-filter>
               <action android:name="com.google.firebase.MESSAGING_EVENT" />
           </intent-filter>
       </service>
   </application>
   ```

### Fase 2: Backend — Almacenar tokens + enviar push

1. **Nueva tabla `fcm_tokens`:**
   ```sql
   CREATE TABLE IF NOT EXISTS fcm_tokens (
       id BIGSERIAL PRIMARY KEY,
       usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
       token TEXT NOT NULL UNIQUE,
       plataforma VARCHAR(20) NOT NULL DEFAULT 'android',
       activo BOOLEAN NOT NULL DEFAULT true,
       creado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       actualizado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX idx_fcm_tokens_usuario ON fcm_tokens(usuario_id);
   ```

2. **Nuevo endpoint REST:**
   - `POST /kamples/v1/usuarios/registrar-fcm-token` — Registrar/actualizar token
   - `DELETE /kamples/v1/usuarios/eliminar-fcm-token` — Remover token (logout)

3. **Servicio PHP para enviar push via Firebase HTTP v1 API:**
   ```
   App/Kamples/Services/FcmService.php
   ```
   - Usar Firebase Admin SDK o HTTP directo a `https://fcm.googleapis.com/v1/projects/{project}/messages:send`
   - Autenticacion: Service account JSON (almacenar como env var, no en repo)
   - El servicio debe llamarse desde el mismo punto donde se crea la notificacion en BD

4. **Integracion con WebSocket server:**
   - El WS server (`websocket-server/server.ts`) ya emite eventos de notificacion
   - Agregar paso adicional: si el usuario NO tiene conexion WS activa, enviar via FCM
   - Logica: `usuario conectado via WS? -> notif local via WS : enviar FCM push`

### Fase 3: Frontend — Obtener y enviar token al backend

1. **Obtener FCM token desde el frontend (Kotlin bridge):**

   Opcion A (recomendada): El `KamplesFirebaseService.onNewToken()` ya captura el token.
   Crear un plugin Tauri custom que exponga `obtenerFcmToken()` al JS:

   ```kotlin
   /* Plugin Tauri para FCM token */
   @tauri.plugin.annotation.TauriPlugin
   class FcmPlugin : Plugin() {
       @Command
       fun obtenerToken(invoke: Invoke) {
           FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
               invoke.resolve(JSObject().put("token", token))
           }.addOnFailureListener {
               invoke.reject("No se pudo obtener token FCM")
           }
       }
   }
   ```

   Opcion B (mas simple): Usar SharedPreferences para guardar el token en `onNewToken()`,
   y leerlo desde el WebView via un bridge JS.

2. **Enviar token al backend al hacer login:**
   ```typescript
   /* En el flujo de autenticacion, despues de login exitoso */
   async function registrarTokenPush(): Promise<void> {
       if (!esTauri() || !esAndroid()) return;
       try {
           const { invoke } = await import('@tauri-apps/api/core');
           const { token } = await invoke<{ token: string }>('plugin:fcm|obtener_token');
           await apiCliente.post('/usuarios/registrar-fcm-token', {
               token,
               plataforma: 'android'
           });
       } catch (err) {
           console.error('Error registrando token FCM:', err);
       }
   }
   ```

### Fase 4: Testing y produccion

1. **Test local:**
   - Instalar APK en emulador (requiere Google Play Services emulator image)
   - Enviar test push desde Firebase Console > Cloud Messaging > "Send test message"
   - Verificar que llega con app cerrada

2. **Monitoring:**
   - Firebase Console muestra deliveries, opens, errors
   - Agregar logging en el backend para tokens invalidos (Firebase retorna error 404)
   - Limpiar tokens invalidos periodicamente (cron)

3. **Consideraciones produccion:**
   - Rate limits: Firebase permite ~500K mensajes/dia gratis
   - Batch: Enviar a multiples tokens con `sendEachForMulticast()`
   - Topics: Usar topics para notificaciones broadcast (ej: "nuevos-samples")
   - Data-only messages: Preferir `data` payload sobre `notification` payload para control total del formato

---

## Archivos a Crear/Modificar (resumen)

| Accion | Archivo |
|---|---|
| CREAR | `desktop/src-tauri/gen/android/app/google-services.json` |
| MODIFICAR | `desktop/src-tauri/gen/android/build.gradle.kts` (classpath) |
| MODIFICAR | `desktop/src-tauri/gen/android/app/build.gradle.kts` (plugin + deps) |
| CREAR | `.../java/app/kamples/desktop/KamplesFirebaseService.kt` |
| MODIFICAR | `AndroidManifest.xml` (servicio FCM) |
| CREAR | Migracion SQL `fcm_tokens` |
| CREAR | `App/Kamples/Api/Controladores/FcmController.php` |
| CREAR | `App/Kamples/Services/FcmService.php` |
| MODIFICAR | `websocket-server/server.ts` (fallback a FCM) |
| CREAR | Plugin Tauri Kotlin para exponer token FCM |

---

## Dependencia critica

FCM requiere **Google Play Services** en el dispositivo. Emuladores sin GMS (como AOSP images)
NO recibiran push. Para testing, usar "Google APIs" system images en Android Studio.

La alternativa sin Google Play Services es **UnifiedPush** o **ntfy.sh**, pero tiene menor
cobertura de dispositivos.

# nota del usuario, firebase me dijo esto

Para que los SDK de Firebase puedan acceder a los valores de configuración de google-services.json, necesitas el complemento Gradle de los servicios de Google.


DSL de Kotlin (build.gradle.kts)

Groovy (build.gradle)
Agrega el complemento como una dependencia a tu archivo build.gradle.kts de nivel de proyecto:

Archivo de Gradle de nivel de raíz (nivel de proyecto) (<project>/build.gradle.kts):
plugins {
  // ...

  // Add the dependency for the Google services Gradle plugin
  id("com.google.gms.google-services") version "4.4.4" apply false

}
Luego, en el archivo build.gradle.kts del módulo (nivel de la app), agrega el complemento google-services y cualquier SDK de Firebase que quieras usar en tu app:

Archivo de Gradle del módulo (nivel de app) (<project>/<app-module>/build.gradle.kts):
plugins {
  id("com.android.application")

  // Add the Google services Gradle plugin
  id("com.google.gms.google-services")

  ...
}

dependencies {
  // Import the Firebase BoM
  implementation(platform("com.google.firebase:firebase-bom:34.10.0"))


  // TODO: Add the dependencies for Firebase products you want to use
  // When using the BoM, don't specify versions in Firebase dependencies
  implementation("com.google.firebase:firebase-analytics")


  // Add the dependencies for any other desired Firebase products
  // https://firebase.google.com/docs/android/setup#available-libraries
}
Si usas la BoM de Firebase para Android, tu app siempre utilizará versiones compatibles de la biblioteca de Firebase. Más información