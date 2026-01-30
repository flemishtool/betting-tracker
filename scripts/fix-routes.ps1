$apiRoutes = Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts"

foreach ($file in $apiRoutes) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -notmatch "export const dynamic") {
        $newContent = "export const dynamic = 'force-dynamic';`n`n" + $content
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Updated: $($file.FullName)"
    } else {
        Write-Host "Already has dynamic: $($file.FullName)"
    }
}