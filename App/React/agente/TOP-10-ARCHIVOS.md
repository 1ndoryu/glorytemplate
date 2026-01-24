# Top 10 Archivos con Más Líneas - Carpeta App

> Generado: 2026-01-24

Este documento lista los 10 archivos con mayor cantidad de líneas en la carpeta `App`, excluyendo `node_modules`, `.git`, `vendor`, `dist` y `build`.

## Ranking

| #   | Líneas | Archivo                                      | Tipo |
| --- | ------ | -------------------------------------------- | ---- |
| 1   | 636    | `React/styles/layouts/panel/servicios.css`   | CSS  |
| 2   | 529    | `React/styles/layouts/panel/layout.css`      | CSS  |
| 3   | 404    | `React/styles/layouts/panel/facturas.css`    | CSS  |
| 4   | 367    | `React/styles/layouts/panel/resumen.css`     | CSS  |
| 5   | 336    | `React/agente/PLAN-FACTURACION.md`           | MD   |
| 6   | 269    | `React/styles/servicios.css`                 | CSS  |
| 7   | 269    | `React/styles/layouts/ejemplos-visuales.css` | CSS  |
| 8   | 266    | `React/components/ui/ImagenGlory.tsx`        | TSX  |
| 9   | 241    | `React/hooks/useGloryImages.ts`              | TS   |
| 10  | 237    | `React/styles/layouts/panel/dominios.css`    | CSS  |

## Observaciones

- **8 de 10 archivos son CSS**: Esto indica que los estilos son los que más líneas acumulan en el proyecto.
- **Solo 1 componente React** aparece en el top (`ImagenGlory.tsx` con 266 líneas), lo cual sugiere buena adherencia al principio de componentes pequeños.
- **Solo 1 hook** aparece (`useGloryImages.ts` con 241 líneas) - supera el límite recomendado de 120 líneas para hooks.

### Archivos que podrían requerir refactorización:

| Archivo             | Líneas | Límite Recomendado | Acción Sugerida               |
| ------------------- | ------ | ------------------ | ----------------------------- |
| `useGloryImages.ts` | 241    | 120                | Dividir en hooks más pequeños |

---

## Comando Utilizado

```powershell
$files = Get-ChildItem -Recurse -File -Include *.tsx,*.ts,*.js,*.jsx,*.css,*.php,*.md | Where-Object { $_.FullName -notlike '*node_modules*' -and $_.FullName -notlike '*\.git*' }

$results = @()
foreach($f in $files) { 
    $count = (Get-Content $f.FullName -ErrorAction SilentlyContinue).Count
    $results += [pscustomobject]@{
        Lineas=$count
        Archivo=$f.FullName.Replace('c:\Users\1u\Local Sites\glorybuilder\app\public\wp-content\themes\glory\App\','')
    } 
}

$results | Sort-Object Lineas -Descending | Select-Object -First 10
```

---

*Documento generado automáticamente para análisis de código.*
