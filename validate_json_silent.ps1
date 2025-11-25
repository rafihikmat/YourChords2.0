
try {
    $content = Get-Content "D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json" -Raw -Encoding UTF8
    $json = $content | ConvertFrom-Json | Out-Null
    Write-Host "VALID_JSON"
}
catch {
    Write-Host "INVALID_JSON"
    Write-Host $_.Exception.Message
}
