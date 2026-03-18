# Auth Google y Push Android Capacitor — 2026-03-18

## Objetivo
Dejar la APK Android de Kamples con login Google funcional dentro de WebView/Capacitor, registro de push nativo para recibir notificaciones con la app cerrada, y branding propio en launcher y notificaciones.

## Arquitectura
- Backend WordPress:
  - Endpoint callback: /wp-json/kamples/v1/auth/google/mobile-callback
  - Endpoint polling: /wp-json/kamples/v1/auth/google/mobile-status
  - Controladores: GoogleAuthController y GoogleAuthMobileController
- Frontend React compartido:
  - Hook central: App/React/hooks/useAuth.ts
  - Cliente OAuth móvil: App/React/services/googleAuthMobileCapacitor.ts
  - Push nativo: App/React/services/fcmToken.ts
  - Navegación post-push: App/React/services/navegacionFcm.ts
- Shell Android:
  - Intent filter deep link en AndroidManifest.xml
  - Plugins Capacitor: App, Browser, PushNotifications
  - Recursos: ic_launcher_foreground.xml e ic_notification.xml

## Flujo de login Google móvil
1. La UI detecta contexto nativo con esGoogleNativo.
2. En Android Capacitor, useAuth dispara iniciarGoogleOAuthCapacitor().
3. El cliente genera PKCE y requestId, abre Google en Browser y usa state codificado.
4. Google vuelve al backend en mobile-callback.
5. El backend intercambia el code por id_token, verifica claims, crea o recupera usuario y genera JWT.
6. El resultado se guarda en un transient por requestId y el backend devuelve una página puente que intenta abrir el deep link nativo.
7. La app recupera el resultado por deep link o, si no llega, por polling a mobile-status.
8. useAuth persiste token y usuario en localStorage nativo para que apiCliente mande Authorization Bearer en siguientes requests.

## Por qué se usa JWT y no cookie
El navegador externo de Google y el WebView de Capacitor no comparten la cookie de WordPress. Si el backend solo iniciara sesión vía cookie, la app volvería “autenticada” en el navegador pero anónima en el WebView. Por eso el backend devuelve JWT y el cliente nativo lo persiste localmente.

## Flujo de push Android
1. useNotificacionesNativas inicializa registro cuando el usuario autenticado está en Android.
2. En Capacitor, fcmToken solicita permisos y llama PushNotifications.register().
3. El token nativo se envía al backend con /fcm/registrar.
4. Cuando el usuario toca una push, PushNotifications.addListener('pushNotificationActionPerformed') guarda la ruta pendiente en sessionStorage.
5. navegacionFcm recupera esa ruta y navega dentro de la app al abrirse.

## Recursos Android requeridos
- POST_NOTIFICATIONS en AndroidManifest.xml
- Intent filter con custom_url_scheme + host auth
- ic_notification.xml para el icono monocromo de notificaciones FCM
- ic_launcher_foreground.xml + fondo oscuro para el launcher adaptativo de Kamples

## Validación ejecutada
- npm run type-check
- php -l App/Kamples/Api/Controladores/GoogleAuthController.php
- php -l App/Kamples/Api/Controladores/GoogleAuthMobileController.php
- npm run android:sync
- gradlew assembleDebug

## Limitaciones conocidas
- La recepción real de push con app cerrada requiere device/emulador Android con Firebase configurado y credenciales válidas.
- Si falta google-services.json en el entorno local, el build puede seguir funcionando por la condición actual del Gradle, pero FCM real depende de esa configuración.
- El callback móvil usa una página puente HTML para abrir el deep link porque los validadores de seguridad internos marcan como riesgo las redirecciones directas a esquemas nativos.

## Regla Sentinel
- No se necesitó una regla nueva de Glory Sentinel.
