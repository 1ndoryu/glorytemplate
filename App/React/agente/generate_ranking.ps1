$basePath = "c:\Users\1u\Local Sites\glorybuilder\app\public\wp-content\themes\glory\App"
$targetFile = "$basePath\React\agente\TOP-10-ARCHIVOS.md"

Write-Host "Scanning $basePath..."
$allFiles = Get-ChildItem -Path $basePath -Recurse -File

$Extensions = @('.tsx', '.ts', '.js', '.jsx', '.css', '.php')

# Filter using strict regex to avoid partial name matching
$files = $allFiles | Where-Object { 
    ($Extensions -contains $_.Extension) -and 
    ($_.FullName -notmatch '[\\/]node_modules[\\/]') -and
    ($_.FullName -notmatch '[\\/]vendor[\\/]') -and
    ($_.FullName -notmatch '[\\/]dist[\\/]') -and
    ($_.FullName -notmatch '[\\/]build[\\/]') -and
    ($_.FullName -notmatch '[\\/]\.git[\\/]')
}

Write-Host "Files found: $($files.Count)"

$results = @()
$basePathRegex = [regex]::Escape($basePath + '\')

foreach ($f in $files) {
    try {
        $lines = 0
        switch -File $f.FullName { default { $lines++ } }
    }
    catch {
        $lines = 0 
    }
    
    # Case-insensitive replacement for relative path
    $relPath = $f.FullName -replace $basePathRegex, ""
    $relPath = $relPath.Replace('\', '/')
    
    $results += [pscustomobject]@{
        Lines = $lines
        File  = $relPath
        Type  = $f.Extension.ToUpper().TrimStart('.')
        Ext   = $f.Extension
    }
}

# Categorize
$cssFiles = $results | Where-Object { $_.Ext -eq '.css' } | Sort-Object Lines -Descending | Select-Object -First 10
$tsFiles = $results | Where-Object { @('.ts', '.tsx', '.js', '.jsx') -contains $_.Ext } | Sort-Object Lines -Descending | Select-Object -First 10
$phpFiles = $results | Where-Object { $_.Ext -eq '.php' } | Sort-Object Lines -Descending | Select-Object -First 10

# Helper
function Get-MDTable($t, $d) {
    $out = "`r`n### $t`r`n`r`n| # | Líneas | Archivo | Tipo |`r`n|---|---|---|---|`r`n"
    $k = 1
    $bt = "``" # Backtick literal
    foreach ($r in $d) { 
        $out += "| $k | $($r.Lines) | $bt$($r.File)$bt | $($r.Type) |`r`n"
        $k++ 
    }
    if ($d.Count -eq 0) { $out += "| - | - | Sin resultados | - |`r`n" }
    return $out
}

$date = Get-Date -Format "yyyy-MM-dd HH:mm"
$md = "# Top Archivos por Tipo - App`r`n`r`n> Generado: $date`r`n`r`nEste documento lista los archivos más grandes por tecnología en la carpeta `App`.`r`n"
$md += Get-MDTable "Top 10 CSS (Estilos)" $cssFiles
$md += Get-MDTable "Top 10 TS/TSX (React)" $tsFiles
$md += Get-MDTable "Top 10 PHP (Backend)" $phpFiles
$md += "`r`n---`r`n`r`n*Generado automáticamente via script PowerShell.*`r`n"

[System.IO.File]::WriteAllText($targetFile, $md, [System.Text.Encoding]::UTF8)
Write-Host "Done. Written to $targetFile"
