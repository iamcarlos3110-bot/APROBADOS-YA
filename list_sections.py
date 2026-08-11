import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
for match in re.findall(r'<section id="[^"]+"', html):
    print(match)
