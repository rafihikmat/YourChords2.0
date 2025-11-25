
import re

file_path = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to find the block.
# We look for fingers array with specific values, followed by baseFret, barres, midi.
# We allow for flexible whitespace.

pattern = re.compile(
    r'("fingers":\s*\[\s*0,\s*2,\s*1,\s*0,\s*0,\s*3\s*\]\s*,\s*)'  # Group 1: fingers array
    r'("baseFret":\s*11\s*,\s*)'                                   # Group 2: baseFret
    r'("barres":\s*\[\]\s*,\s*)'                                   # Group 3: barres
    r'("midi":\s*\[)'                                              # Group 4: midi start
, re.DOTALL)

# We want to replace this with a clean version.
# We will keep Group 1, and rewrite the rest.
# Actually, we can just replace the whole match with the clean string.

def replacement(match):
    print("Found match!")
    # We'll reconstruct it with standard indentation (20 spaces)
    indent = ' ' * 20
    fingers_part = match.group(1) # We keep the fingers part as is to preserve its indentation if possible, or just rewrite it too?
    # Let's rewrite the whole thing to be safe.
    
    clean_block = (
        f'"fingers": [\n'
        f'{indent}    0,\n'
        f'{indent}    2,\n'
        f'{indent}    1,\n'
        f'{indent}    0,\n'
        f'{indent}    0,\n'
        f'{indent}    3\n'
        f'{indent}],\n'
        f'{indent}"baseFret": 11,\n'
        # We REMOVE barres as it might be problematic or just keep it clean
        # f'{indent}"barres": [],\n' 
        # Let's keep it but clean
        f'{indent}"barres": [],\n'
        f'{indent}"midi": ['
    )
    return clean_block

new_content, count = pattern.subn(replacement, content)

if count > 0:
    print(f"Replaced {count} occurrences.")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
else:
    print("No matches found.")
    # Debug: try to find just the fingers part
    fingers_pattern = re.compile(r'"fingers":\s*\[\s*0,\s*2,\s*1,\s*0,\s*0,\s*3\s*\]', re.DOTALL)
    if fingers_pattern.search(content):
        print("Found fingers part, but not the rest.")
    else:
        print("Did not find fingers part.")

