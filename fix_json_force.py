
import re

file_path = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to find fingers array and whatever follows up to midi
# We want to match:
# "fingers": [ ... ],
# (anything here, maybe baseFret, maybe barres, maybe garbage)
# "midi": [

pattern = re.compile(
    r'("fingers":\s*\[\s*0,\s*2,\s*1,\s*0,\s*0,\s*3\s*\]\s*,)'  # Group 1: fingers array and comma
    r'(.*?)'                                                       # Group 2: anything (non-greedy)
    r'("midi":\s*\[)',                                             # Group 3: midi start
    re.DOTALL
)

def replacement(match):
    print("Found match!")
    indent = ' ' * 20
    
    # Reconstruct the block
    clean_block = (
        f'{match.group(1)}\n'
        f'{indent}"baseFret": 11,\n'
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

