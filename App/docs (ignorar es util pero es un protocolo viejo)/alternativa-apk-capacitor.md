# Alternativa APK — Capacitor sobre la app React existente

## Decisión

Se descarta la vía Android con Tauri para Kamples. La alternativa recomendada es Capacitor usando la UI React ya existente como base móvil, sin reutilizar el bridge Rust/Tauri móvil.

## Estado actual

Ya existe un proyecto separado en `mobile/` con Capacitor y plataforma Android generada en `mobile/android/`.

Este scaffold está preparado para abrirse desde Android Studio ahora mismo. La base web actual del proyecto sigue siendo WordPress + React Islands, así que el shell móvil carga una URL web real dentro del WebView nativo en lugar de empaquetar una SPA standalone.

## Por qué Capacitor aquí

- Reutiliza la mayor parte de la UI web/React sin forzar Android a pasar por Rust, Gradle generado por Tauri y deep-links híbridos frágiles.
- Permite aislar móvil como proyecto propio, separado del empaquetado desktop actual.
- Tiene mejor encaje para notificaciones push, autenticación con navegador del sistema y plugins Android convencionales.

## Arquitectura propuesta

1. Crear un proyecto móvil independiente, por ejemplo `mobile/`, con Capacitor y la misma base React/Vite.
2. Mantener la lógica compartida de dominio en módulos TypeScript puros y separar los adaptadores por plataforma.
3. Reemplazar cada dependencia móvil de Tauri por un adaptador de Capacitor:
   - Auth Google: navegador del sistema + callback HTTPS o plugin de autenticación.
   - Push: Firebase Messaging nativo de Android.
   - Descargas/archivos: Filesystem de Capacitor o plugin Android dedicado.
   - Apertura de enlaces externos: Browser/App launcher de Capacitor.
4. Mantener desktop como línea separada para no volver a acoplar Android al runtime actual.

## Fases sugeridas

1. Extraer servicios compartidos que hoy mezclan UI con checks de plataforma.
2. Crear `mobile/` con Capacitor y un shell Android limpio.
3. Implementar primero login Google y push cerrada en nativo antes de portar descargas y extras.
4. Desplegar una beta Android mínima: login, feed, reproducción, push.

## Cómo correrlo en Android Studio

1. Instalar dependencias del shell móvil:
   - `npm install --prefix mobile`
2. Sincronizar Android:
   - `npm run android:sync --prefix mobile`
3. Abrir Android Studio:
   - `npm run android:open --prefix mobile`

### URL por defecto

Si no defines ninguna variable extra, el WebView móvil abre `https://kamples.com`.

### Cargar otra URL

Puedes apuntar el WebView a otra URL accesible desde Android exportando antes:

- PowerShell emulador: `$env:KAMPLES_CAP_SERVER_URL = 'http://10.0.2.2:5173'`
- Dispositivo físico: usar la IP LAN real de tu máquina, por ejemplo `http://192.168.0.25:5173`

Luego vuelve a ejecutar:

- `npm run android:sync --prefix mobile`
- `npm run android:open --prefix mobile`

## Limitación actual importante

`Glory/assets/react` compila assets para WordPress/islas, no un `index.html` standalone tipo SPA. Por eso este primer scaffold móvil usa una URL web real como fuente de contenido. El siguiente paso grande, si se quiere una APK completamente desacoplada de una URL remota, es extraer una entrada móvil propia dentro de la Fase 10.

## Criterio de éxito

La APK debe depender solo de un proyecto Android/Capacitor dedicado. Desktop no debe necesitar ni compilar nada de Android para seguir funcionando.