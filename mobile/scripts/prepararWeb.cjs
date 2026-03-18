const fs = require('fs');
const path = require('path');

const directorioSalida = path.resolve(__dirname, '..', 'www');
const targetUrl = process.env.KAMPLES_CAP_TARGET_URL?.trim() || 'https://kamples.com';

fs.mkdirSync(directorioSalida, { recursive: true });

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Kamples</title>
  <style>
    html, body {
      margin: 0;
      min-height: 100%;
      background: #070707;
      color: #f5f1e8;
      font-family: system-ui, sans-serif;
    }

    body {
      display: grid;
      place-items: center;
      padding: 24px;
      text-align: center;
    }

    .contenedor {
      max-width: 420px;
    }

    .textoSecundario {
      opacity: 0.72;
      line-height: 1.5;
    }

    .enlaceFallback {
      color: #d6c39a;
    }
  </style>
</head>
<body>
  <main class="contenedor">
    <h1>Kamples</h1>
    <p class="textoSecundario">Abriendo la app móvil…</p>
    <p class="textoSecundario">Si no redirige automáticamente, abre <a class="enlaceFallback" href="${targetUrl}">${targetUrl}</a>.</p>
  </main>
  <script>
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(directorioSalida, 'index.html'), html, 'utf8');