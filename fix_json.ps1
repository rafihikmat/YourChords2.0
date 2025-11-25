
$file = "D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json"
$content = Get-Content $file
$content[60261] = '                    "baseFret": 11,'
$content[60262] = '                    "barres": [],'
$content[60263] = '                    "midi": ['
$content | Set-Content $file -Encoding UTF8
Write-Host "Fixed lines 60262-60264"
