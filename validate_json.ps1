
try {
    $content = Get-Content "D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json" -Raw -Encoding UTF8
    $json = $content | ConvertFrom-Json
    Write-Host "JSON is valid"
}
catch {
    Write-Host "JSON is invalid"
    Write-Host $_.Exception.Message
}
