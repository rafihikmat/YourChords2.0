
import json
import sys

file_path = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("VALID_JSON")
except json.JSONDecodeError as e:
    print(f"INVALID_JSON: {e.msg}")
    print(f"Line: {e.lineno}")
    print(f"Column: {e.colno}")
    print(f"Pos: {e.pos}")
    
    # Print context
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        if e.lineno <= len(lines):
            print(f"Content at line {e.lineno}:")
            print(repr(lines[e.lineno - 1]))
except Exception as e:
    print(f"ERROR: {e}")
