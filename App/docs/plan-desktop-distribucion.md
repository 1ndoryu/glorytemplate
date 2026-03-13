# Plan de Distribución y Auto-Update — Kamples Desktop

> Documento de referencia para configurar la distribución de la app desktop (Tauri 2) con sistema de actualización automática.

## Estado Actual

- **Dependencia instalada:** `tauri-plugin-updater = "2"` en `Cargo.toml` ✅
- **Plugin registrado:** `.plugin(tauri_plugin_updater::Builder::new().build())` en `lib.rs` ✅
- **Capabilities configuradas:** `updater:default`, `updater:allow-check`, `updater:allow-download-and-install` en `principal.json` ✅
- **Config updater en tauri.conf.json:** endpoint + installMode configurados ✅ (falta pubkey real)
- **Endpoint backend:** `DesktopUpdateController.php` — GET `/desktop/update/{target}/{arch}/{current_version}` ✅
- **CI/CD:** `.github/workflows/release-desktop.yml` — build multiplataforma + firma + GitHub Releases ✅
- **Claves de firma:** ⚠️ PENDIENTE — Ejecutar `npx @tauri-apps/cli signer generate -w ~/.tauri/kamples.key` manualmente
- **Pubkey en tauri.conf.json:** ⚠️ PLACEHOLDER — Reemplazar `PENDIENTE_GENERAR_CON_TAURI_SIGNER` con la clave pública generada
- **Secrets en GitHub:** ⚠️ PENDIENTE — Configurar `TAURI_SIGNING_PRIVATE_KEY` y `TAURI_KEY_PASSWORD` en Settings > Secrets
- **Repo de releases:** ⚠️ PENDIENTE — Crear repo `AKamples/kamples-desktop-releases` en GitHub (o ajustar constante en `DesktopUpdateController.php`)

---

## 1. Generación de Claves de Firma

Tauri requiere firmar los instaladores para que el updater verifique integridad.

```bash
# Genera par de claves (pública + privada)
# La clave privada se almacena en un archivo protegido, NUNCA en el repo
npx @tauri-apps/cli signer generate -w ~/.tauri/kamples.key
```

- **Clave pública:** se incluye en `tauri.conf.json` → `plugins.updater.pubkey`
- **Clave privada:** se almacena como secret de CI (`TAURI_SIGNING_PRIVATE_KEY`) + passphrase (`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`)

---

## 2. Configuración en `tauri.conf.json`

Agregar dentro de `"plugins"`:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "dyn_CLAVE_PUBLICA_AQUI",
      "endpoints": [
        "https://kamples.com/api/desktop/update/{{target}}/{{arch}}/{{current_version}}"
      ],
      "dialog": true
    }
  }
}
```

### Variables de template en endpoints

| Variable            | Ejemplo               | Descripción                     |
|---------------------|-----------------------|---------------------------------|
| `{{target}}`        | `windows`, `darwin`, `linux` | SO del cliente           |
| `{{arch}}`          | `x86_64`, `aarch64`   | Arquitectura del procesador    |
| `{{current_version}}`| `0.1.0`              | Versión actual instalada       |

### Opciones del updater

| Opción      | Tipo    | Descripción                                                     |
|-------------|---------|------------------------------------------------------------------|
| `pubkey`    | string  | Clave pública para verificar firma del instalador               |
| `endpoints` | array   | URLs del servidor de actualizaciones (se prueban en orden)      |
| `dialog`    | boolean | `true` = muestra diálogo nativo preguntando al usuario          |
| `windows.installMode` | string | `"passive"`, `"quiet"` o `"basicUi"` (solo Windows) |

---

## 3. Endpoint del Servidor de Actualizaciones

El servidor debe responder con JSON cuando hay actualización disponible, o `204 No Content` si está al día.

### Respuesta cuando hay actualización (HTTP 200):

```json
{
  "version": "0.2.0",
  "notes": "Mejoras de rendimiento y correcciones de sincronización.",
  "pub_date": "2025-07-15T12:00:00Z",
  "url": "https://cdn.kamples.com/desktop/releases/v0.2.0/kamples-desktop_0.2.0_x64-setup.nsis.zip",
  "signature": "dyn_FIRMA_DEL_ARCHIVO_AQUI"
}
```

### Campos requeridos

| Campo       | Descripción                                                       |
|-------------|-------------------------------------------------------------------|
| `version`   | Semver de la nueva versión                                        |
| `url`       | URL directa al instalador firmado (.zip que contiene .msi o .nsis)|
| `signature` | Firma generada con la clave privada durante el build              |
| `notes`     | Changelog visible al usuario en el diálogo de actualización       |
| `pub_date`  | Fecha ISO 8601 de publicación                                     |

### Cuando no hay actualización: responder `204 No Content`

---

## 4. Opciones de Hosting para Artefactos

### Opción A: GitHub Releases (recomendado para MVP)

- Tauri tiene soporte nativo para GitHub Releases
- Endpoint simplificado: `https://github.com/USUARIO/REPO/releases/latest/download/latest.json`
- El CI genera el `latest.json` + instaladores automáticamente con `tauri-action`
- Gratuito para repos públicos, incluido en GitHub Pro para privados

### Opción B: Servidor propio (para producción)

- Endpoint REST en el backend de Kamples (`/api/desktop/update/...`)
- Artefactos en CDN propio o S3/R2 (Cloudflare)
- Control total sobre rollbacks, staged rollouts, y métricas de adopción
- Requiere implementar la lógica de comparación de versiones

### Opción C: Híbrido

- GitHub Releases para builds + almacenamiento
- Endpoint propio que consulta GitHub API y decide si servir la actualización
- Permite control de rollout sin mantener storage propio

---

## 5. Build de Instaladores por Plataforma

```bash
# Build de producción con firma
# La clave privada debe estar en TAURI_SIGNING_PRIVATE_KEY
npx tauri build
```

### Artefactos generados

| Plataforma | Formato                    | Ruta en `target/release/bundle/`         |
|------------|----------------------------|------------------------------------------|
| Windows    | `.msi` + `.nsis` (instalador)| `msi/`, `nsis/`                          |
| macOS      | `.dmg` + `.app.tar.gz`     | `dmg/`, `macos/`                         |
| Linux      | `.AppImage` + `.deb`       | `appimage/`, `deb/`                      |

> El updater usa los archivos `.zip` / `.tar.gz` firmados, no los instaladores directos.

---

## 6. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/release-desktop.yml
name: Release Desktop
on:
  push:
    tags:
      - 'desktop-v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: windows-latest
            target: x86_64-pc-windows-msvc
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
        with:
          tagName: desktop-v__VERSION__
          releaseName: 'Kamples Desktop v__VERSION__'
          releaseBody: 'Ver CHANGELOG para detalles.'
          releaseDraft: true
          prerelease: false
          projectPath: desktop
```

---

## 7. Integración en Rust (lib.rs)

El plugin ya está como dependencia. Para activarlo, agregar en el builder de Tauri:

```rust
// En desktop/src-tauri/src/lib.rs, dentro de tauri::Builder::default()
.plugin(tauri_plugin_updater::Builder::new().build())
```

Esto habilita el check automático al iniciar la app (si `dialog: true`).

Para control manual desde el frontend:

```typescript
import { check } from '@tauri-apps/plugin-updater';

const update = await check();
if (update) {
    await update.downloadAndInstall();
    // La app se reinicia automáticamente
}
```

---

## 8. Checklist de Implementación

- [ ] Generar par de claves con `signer generate` (requiere terminal interactiva)
- [ ] Agregar clave pública real a `tauri.conf.json` `plugins.updater.pubkey` (reemplazar placeholder)
- [x] Configurar endpoints en `tauri.conf.json`
- [x] Registrar plugin en `lib.rs` (`.plugin(tauri_plugin_updater::Builder::new().build())`)
- [x] Implementar endpoint de actualización en backend (`DesktopUpdateController.php`)
- [x] Configurar CI/CD pipeline para builds multiplataforma (`.github/workflows/release-desktop.yml`)
- [ ] Almacenar clave privada + passphrase como secrets del CI (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_KEY_PASSWORD`)
- [ ] Crear repo de releases en GitHub (`AKamples/kamples-desktop-releases`) o ajustar constante
- [ ] Crear página `/descargar` en el frontend con links a los instaladores
- [ ] Testear flujo completo: instalar v1 → publicar v2 → verificar diálogo de update

---

## 9. Consideraciones de Seguridad

- La clave privada **NUNCA** debe estar en el repositorio
- Los artefactos deben servirse por HTTPS
- El `signature` en la respuesta del endpoint previene instaladores manipulados
- Considerar rate-limiting en el endpoint de update para evitar abuso
- Implementar staged rollouts (% de usuarios) antes de promover a todos

---

## Notas y Decisiones

- [Tauri updater v2]: Requiere plugin explícito, no viene por defecto como en Tauri v1
- [Signing]: Sin firma, el updater rechaza el artefacto — es requisito obligatorio
- [Dialog mode]: `dialog: true` muestra prompt nativo; `false` requiere implementar UI custom
- [Windows NSIS vs MSI]: NSIS es más flexible y soporta `installMode` custom; MSI es más estándar en empresas
