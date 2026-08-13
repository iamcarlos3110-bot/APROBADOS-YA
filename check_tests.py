import json

with open('data/ay-questions-B.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

with open('data/dgt-tests.json', 'r', encoding='utf-8') as f:
    tests = json.load(f)

normas_theme_id = None
with open('data/themes.json', 'r', encoding='utf-8') as f:
    themes = json.load(f)
    for t in themes:
        if t['permit_id'] == 'b' and 'Normas' in t['title']:
            normas_theme_id = t['id']
            print(f"Theme ID for Normas: {normas_theme_id}")
            break

# Count tests in dgt-tests.json
ui_tests = [t for t in tests if t.get('theme_id') == normas_theme_id]
print(f"Tests in dgt-tests.json for this theme: {len(ui_tests)}")
for idx, t in enumerate(ui_tests):
    if idx >= 88:
        print(t)

# Check questions per test
tests_with_questions = set()
for q in questions:
    if q.get('theme_id') == normas_theme_id:
        tests_with_questions.add(q.get('test_id'))

print(f"Number of tests with questions: {len(tests_with_questions)}")
print(f"Max test ID with questions: {max(tests_with_questions) if tests_with_questions else 'None'}")
