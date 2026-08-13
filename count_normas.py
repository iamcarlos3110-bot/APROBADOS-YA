import json

with open('data/ay-questions-B.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Count max test_id for theme_id 'normas'
tests_with_questions = set()
for q in questions:
    if q.get('theme_id') == 'normas':
        tests_with_questions.add(q.get('test_id'))

print(f"Number of tests for 'normas': {len(tests_with_questions)}")
print(f"Max test ID for 'normas': {max(tests_with_questions) if tests_with_questions else 'None'}")
