import json

with open('data/dgt-questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

if questions:
    print(json.dumps(questions[0], indent=2))
