
$file = "D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json"
$content = Get-Content $file
# Line 60263 is index 60262. It contains "barres": [],
# We want to remove it.
$newContent = $content[0..60261] + $content[60263..($content.Length - 1)]
$newContent | Set-Content $file -Encoding UTF8
"Removed line 60263" | Out-File "D:/WebsiteBaru/YourChords2.0/fix_log.txt"
