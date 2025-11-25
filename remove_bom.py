
import os

file_path = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json'

try:
    # Read with utf-8-sig to handle BOM
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        content = f.read()
    
    # Write with utf-8 (no BOM)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Removed BOM and saved as UTF-8")
except Exception as e:
    print(f"Error: {e}")
