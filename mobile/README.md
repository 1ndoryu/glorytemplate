# Kamples Mobile

Proyecto nativo separado para Android con Capacitor. Permite abrir/correr la app desde Android Studio sin volver a meter Android dentro de Tauri.

## Scripts

- `npm run prepare:web`: genera el `www/` mínimo de respaldo para Capacitor
- `npm run android:sync`: prepara `www/` y sincroniza `android/`
- `npm run android:open`: abre Android Studio sin resincronizar
- `npm run android:open:sync`: sincroniza y luego abre Android Studio
- `npm run android:run`: sincroniza y ejecuta en dispositivo/emulador con Capacitor CLI

## Live reload en Android Studio

1. Arranca la URL que quieras cargar dentro del WebView móvil.
   - Producción ya funciona por defecto: `https://kamples.com`
   - Para local, usa una URL completa accesible desde Android.
2. En PowerShell exporta la URL accesible desde el emulador o dispositivo:
   - `$env:KAMPLES_CAP_SERVER_URL = 'http://10.0.2.2:5173'`
3. Sincroniza y abre Android Studio:
   - `npm run android:sync`
   - `npm run android:open`

Si usas dispositivo físico, cambia `10.0.2.2` por la IP LAN real de tu máquina.

## Flujo normal

1. `npm install --prefix mobile`
2. `npm run android:sync --prefix mobile`
3. `npm run android:open --prefix mobile`
4. En Android Studio espera el primer sync Gradle y ejecuta la configuración `app`

## Rendimiento de Gradle

- El wrapper usa `gradle-8.2.1-bin.zip`, no `all.zip`, para bajar bastante la descarga inicial.
- La descarga grande solo debe ocurrir una vez por caché local de Gradle en `%USERPROFILE%/.gradle`.
- Si Android Studio ya quedó abierto y no cambiaste plugins nativos, usa `npm run android:open` y evita resincronizar.
- Si el wrapper vuelve a descargarse desde cero con frecuencia, revisar que `%USERPROFILE%/.gradle` no esté siendo limpiado por OneDrive, antivirus o herramientas de limpieza.

## Nota arquitectónica

La base web actual es WordPress + React Islands, no una SPA standalone con `index.html` propio. Por eso este proyecto móvil usa un shell nativo de Capacitor que carga una URL web real en el WebView y deja `www/` solo como respaldo mínimo del runtime.