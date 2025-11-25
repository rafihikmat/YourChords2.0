
import re

file_path = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find fingers array
fingers_pattern = re.compile(r'("fingers":\s*\[\s*0,\s*2,\s*1,\s*0,\s*0,\s*3\s*\])', re.DOTALL)
match = fingers_pattern.search(content)

if match:
    print("Found fingers array.")
    end = match.end()
    print(f"Content after match (next 100 chars):")
    next_chars = content[end:end+100]
    print(repr(next_chars))
    print("Hex:")
    print(next_chars.encode('utf-8').hex())
else:
    print("Did not find fingers array.")
