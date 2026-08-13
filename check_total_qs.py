import json

with open('data/ay-questions-B.json', 'r', encoding='utf-8') as f:
    ay = json.load(f)

print(f"ay-questions-B.json count: {len(ay)}")

with open('data/dgt-questions.json', 'r', encoding='utf-8') as f:
    dgt = json.load(f)

dgt_b = [q for q in dgt if q.get('permit_id') == 'B' or q.get('permit_id') == 'b']
print(f"dgt-questions.json B count: {len(dgt_b)}")
