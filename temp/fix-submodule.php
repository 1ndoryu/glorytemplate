<?php
$base = '/var/www/html/wp-content/themes/glorytemplate';
echo "=== Stash Glory local changes ===\n";
echo shell_exec("cd $base/Glory && git stash 2>&1") . "\n";
echo "=== Fetch + Checkout 3fd3fd1 ===\n";
echo shell_exec("cd $base/Glory && git fetch origin && git checkout 3fd3fd1 2>&1") . "\n";
echo "=== Verificar commit ===\n";
echo shell_exec("cd $base/Glory && git log --oneline -1 2>&1") . "\n";
$vite = file_get_contents("$base/Glory/assets/react/vite.config.ts");
echo (strpos($vite, 'glorytemplate') !== false) ? "OK: vite tiene glorytemplate\n" : "ERROR: vite no tiene glorytemplate\n";
echo "\n=== npm install (por si cambio lock) ===\n";
exec("cd $base/Glory/assets/react && npm install --no-audit --no-fund 2>&1", $npmOut, $npmCode);
echo "npm install exit: $npmCode\n";
echo "\n=== Clean rebuild ===\n";
exec("rm -rf $base/Glory/assets/react/dist", $out, $code);
$output = [];
exec("cd $base/Glory/assets/react && npm run build 2>&1", $output, $exitCode);
echo implode("\n", array_slice($output, -8)) . "\n";
echo "Build exit: $exitCode\n";
echo "\n=== Verificacion CSS ===\n";
$cssFiles = glob("$base/Glory/assets/react/dist/assets/main*.css");
foreach ($cssFiles as $f) {
    echo basename($f) . "\n";
    $content = file_get_contents($f);
    preg_match_all('/themes\/[a-z]+/', $content, $matches);
    echo "  Theme refs: " . implode(', ', array_unique($matches[0])) . "\n";
}
echo "\n=== OPcache reset ===\n";
echo shell_exec("curl -s http://localhost/_oc_deploy.php 2>&1") . "\n";
echo "\nDONE\n";