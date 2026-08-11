import re
with open('debug_adr_17.html', 'r', encoding='utf-8') as f:
    text = f.read()

# find lines with "test" and "t="
lines = [line.strip() for line in text.split('\n') if 'test_preg.asp' in line or 'test_' in line]
for i, line in enumerate(lines[:30]):
    print(line)
