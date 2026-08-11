import json
with open('data/dgt-tests.json', 'r', encoding='utf-8') as f:
    t_data = json.load(f)
adr_tests = [t for t in t_data if t['permit_id'] == 'ADR']
for t in adr_tests[:40]:
    print(f"{t['id']} - {t['numero']} - {t['tema_aprobados_ya']}")
