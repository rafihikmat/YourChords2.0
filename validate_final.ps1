
try {
    $content = Get-Content "D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json" -Raw -Encoding UTF8
    $json = $content | ConvertFrom-Json
    "VALID_JSON" | Out-File "D:/WebsiteBaru/YourChords2.0/validation_result.txt" -Encoding UTF8
}
catch {
    "INVALID_JSON" | Out-File "D:/WebsiteBaru/YourChords2.0/validation_result.txt" -Encoding UTF8
    $_.Exception.Message | Out-File "D:/WebsiteBaru/YourChords2.0/validation_error.txt" -Encoding UTF8
}
