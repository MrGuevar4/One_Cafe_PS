with open('src/lib/db.ts', 'r') as f:
    lines = f.readlines()

out = []
in_retry = False
brace_depth_at_retry = 0
brace_depth = 0

for line in lines:
    # First, calculate how many braces are in this line
    open_b = line.count('{')
    close_b = line.count('}')
    
    if in_retry:
        # Before updating depth, check if this line closes the depth
        # If brace_depth + open_b - close_b < brace_depth_at_retry, we hit the close!
        if brace_depth + open_b - close_b < brace_depth_at_retry:
            # We are closing the method! We need to insert `});` before the closing brace of the method.
            # Usually the line is `  },` or `  }`
            # We replace `}` with `});\n  }`
            line = line.replace('}', '});\n  }', 1)
            in_retry = False
            
    if 'return runWithRetriesAsync(() => {' in line:
        in_retry = True
        brace_depth_at_retry = brace_depth + open_b - close_b
        
    brace_depth += open_b - close_b
    out.append(line)

with open('src/lib/db.ts', 'w') as f:
    f.writelines(out)
