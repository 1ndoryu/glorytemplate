# Cola IA Groq — 2026-03-20

## Objetivo
Mantener el reproceso IA de samples, publicaciones y comentarios cuando Groq devuelve 429, evitando ráfagas que consuman varias keys en el mismo minuto.

## Cadencia actual
- Hook WP Cron: `kamples_cola_ia_cron`
- Intervalo: 60 segundos
- Audio: máximo 1 sample por ejecución
- Rotación Groq: una key por item, con avance del índice después de cada item procesado
- Moderación: sigue pudiendo procesarse en la misma ejecución si no rompe el límite de audio

## Razón del cambio 193A-72
- El diseño anterior seguía programado cada 15 minutos.
- Aunque la key ya rotaba por item, el cron procesaba varios items seguidos en la misma ejecución y generaba ráfagas con timestamps casi idénticos.
- El usuario pidió explícitamente `1 sample por 1 cada minuto`, así que la corrección real fue mover el ritmo al scheduler y limitar los audios por run.

## Puntos críticos
- Cambiar solo el gap interno no basta: si el cron legado sigue programado a 15 minutos, WordPress seguirá disparando lotes.
- `registrarCron()` reprograma automáticamente el evento viejo si detecta un schedule distinto al esperado.
- `TRANSIENT_ULTIMO_AUDIO` se mantiene para evitar doble procesamiento cuando hay ejecución manual o solapada.

## Validación ejecutada
- php -l App/Kamples/Services/ProcesadorColaIA.php
- npm run type-check