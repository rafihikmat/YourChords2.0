
import os

file_path = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json'

try:
    with open(file_path, 'rb') as f:
        content = f.read()

    # Pattern to find: fingers array ending
    # "fingers": [ ... 0, 0, 3 ]
    # We'll look for the sequence of bytes corresponding to the end of that array
    # 0, 0, 3 ]
    # In ASCII: 48, 44, 32, 48, 44, 32, 51, 13, 10 (or similar whitespace)
    
    # Let's search for a larger unique string
    # "fingers": [\r\n                        0,\r\n                        2,\r\n                        1,\r\n                        0,\r\n                        0,\r\n                        3\r\n                    ]
    
    # Since we don't know exact whitespace (CRLF vs LF), we'll search for the numbers
    # 0, 2, 1, 0, 0, 3
    
    # Actually, let's look for the "baseFret": 11 part directly, but maybe it's corrupted.
    # Let's look for the previous part which is likely correct.
    
    search_bytes = b'"fingers": [\r\n                        0,\r\n                        2,\r\n                        1,\r\n                        0,\r\n                        0,\r\n                        3\r\n                    ],'
    
    # Try to find it. Note: indentation is 20 spaces.
    # 20 spaces = ' ' * 20
    indent = b' ' * 20
    search_bytes = b'"fingers": [\r\n' + (indent + b'    0,\r\n') + (indent + b'    2,\r\n') + (indent + b'    1,\r\n') + (indent + b'    0,\r\n') + (indent + b'    0,\r\n') + (indent + b'    3\r\n') + indent + b'],'
    
    # This is risky because of whitespace.
    # Let's use a simpler marker.
    # "baseFret": 11
    
    marker = b'"baseFret": 11,'
    
    # Find all occurrences
    import re
    # We want the one that is followed by "barres": [], "midi": [
    # But that part might be corrupted.
    
    # Let's find the offset of the error.
    # The error was around 1833757.
    
    offset = 1833757
    print(f"Content around {offset}:")
    start = max(0, offset - 50)
    end = min(len(content), offset + 50)
    print(content[start:end])
    
    # We will just rewrite the bytes around there.
    # We expect to see "baseFret": 11, ...
    
    # Let's look for the "baseFret": 11 near that offset.
    sub_content = content[start:end]
    if b'"baseFret": 11' in sub_content:
        print("Found baseFret: 11")
        
        # We want to replace:
        # "baseFret": 11,\r\n                    "barres": [],\r\n                    "midi": [
        # with clean version.
        
        # We'll construct a regex to match this block loosely (ignoring exact whitespace chars)
        # and replace it.
        
        # Actually, if we can see the bytes, we can just replace them.
        pass
    else:
        print("Did not find baseFret: 11 in the expected range")
        
except Exception as e:
    print(e)
