
import json
import sys

file_path = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json'
output_path = 'D:/WebsiteBaru/YourChords2.0/validation_result_py.txt'

with open(output_path, 'w', encoding='utf-8') as out:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        out.write("VALID_JSON\n")
    except json.JSONDecodeError as e:
        out.write(f"INVALID_JSON: {e.msg}\n")
        out.write(f"Line: {e.lineno}\n")
        out.write(f"Column: {e.colno}\n")
        out.write(f"Pos: {e.pos}\n")
        
        # Print context
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            if e.lineno <= len(lines):
                out.write(f"Content at line {e.lineno}:\n")
                out.write(repr(lines[e.lineno - 1]) + "\n")
                # Also print previous few lines
                start = max(0, e.lineno - 5)
                out.write("Context:\n")
                for i in range(start, e.lineno):
                    out.write(f"{i+1}: {lines[i]}")
    except Exception as e:
        out.write(f"ERROR: {e}\n")
