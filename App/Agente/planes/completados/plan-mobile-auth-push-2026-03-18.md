# Plan — Auth Google + Push Android Capacitor — 2026-03-18

## Tarea
- ID: 173A-8
- Tema: login Google móvil, push nativo con app cerrada y branding Android

## Fases
1. Auditar backend OAuth, hooks React y shell Android
2. Implementar callback/status móvil y cliente OAuth Capacitor
3. Integrar persistencia JWT nativa y registro PushNotifications
4. Ajustar manifest, deep link e iconos Android
5. Validar con type-check, lint PHP, sync Capacitor y build Gradle

## Estado final
- Completado el 2026-03-18
- Validaciones ejecutadas: npm run type-check, php -l, npm run android:sync, gradlew assembleDebug

## Gotchas
- El navegador externo no comparte cookies con el WebView: la app necesita JWT persistido en localStorage nativo.
- La devolución a la app se resolvió con página puente HTML que abre el deep link, evitando falsos positivos de open redirect.
- Push con app cerrada depende de FCM nativo y del recurso Android ic_notification.
