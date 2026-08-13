import json

with open('data/ay-questions-B.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

themes = {}
for q in questions:
    tid = q.get('theme_id')
    if tid not in themes:
        themes[tid] = set()
    themes[tid].add(q.get('test_id'))

for tid, tests in themes.items():
    print(f"Theme: {tid} - Num tests: {len(tests)} - Max test ID: {max(tests) if tests else 'None'}")
