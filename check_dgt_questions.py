import json

with open('data/dgt-questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

with open('data/themes.json', 'r', encoding='utf-8') as f:
    themes = json.load(f)

# Find permit_id 'B' themes
b_themes = {t['id']: t['name'] for t in themes['B']}

# Count tests per theme
theme_tests = {tid: set() for tid in b_themes.keys()}

for q in questions:
    tid = q.get('theme_id')
    if tid in theme_tests:
        theme_tests[tid].add(q.get('test_id'))

for tid, tests in theme_tests.items():
    print(f"Theme: {tid} ({b_themes[tid]}) - Num tests: {len(tests)} - Max test ID: {max(tests) if tests else 'None'}")
