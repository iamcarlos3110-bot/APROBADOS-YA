import json

def fix_adr():
    # Load questions
    with open('data/dgt-questions.json', 'r', encoding='utf-8') as f:
        q_data = json.load(f)
        
    # Gather question texts by test
    test_texts = {}
    for q in q_data:
        if q['permit_id'] == 'ADR':
            tid = q['test_id']
            if tid not in test_texts:
                test_texts[tid] = ''
            test_texts[tid] += q['pregunta'].lower() + ' '
            
    # Heuristic categorization
    test_theme_map = {}
    theme_counts = {'basico': 0, 'cisternas': 0, 'explosivos': 0, 'radiactivos': 0}
    
    for tid, text in test_texts.items():
        if 'explosiv' in text or 'clase 1' in text or 'pólvora' in text:
            theme = 'explosivos'
        elif 'radiactiv' in text or 'clase 7' in text or 'bulto tipo a' in text:
            theme = 'radiactivos'
        elif 'cisterna' in text or 'batería' in text or 'panel naranja' in text:
            theme = 'cisternas'
        else:
            theme = 'basico'
            
        test_theme_map[tid] = theme
        theme_counts[theme] += 1
        
    # Update questions
    for q in q_data:
        if q['permit_id'] == 'ADR':
            q['theme_id'] = test_theme_map[q['test_id']]
            q['tema_aprobados_ya'] = test_theme_map[q['test_id']].capitalize()
            
    with open('data/dgt-questions.json', 'w', encoding='utf-8') as f:
        json.dump(q_data, f, ensure_ascii=False, indent=2)
        
    # Update tests
    with open('data/dgt-tests.json', 'r', encoding='utf-8') as f:
        t_data = json.load(f)
        
    for t in t_data:
        if t['permit_id'] == 'ADR':
            theme = test_theme_map.get(t['id'], 'basico')
            t['tema_aprobados_ya'] = theme.capitalize()
            
    with open('data/dgt-tests.json', 'w', encoding='utf-8') as f:
        json.dump(t_data, f, ensure_ascii=False, indent=2)
        
    # Update themes.json
    with open('data/themes.json', 'r', encoding='utf-8') as f:
        themes = json.load(f)
        
    themes['ADR'] = [
        {"id": "oficiales", "name": "Tests Oficiales DGT", "numTests": 0},
        {"id": "basico", "name": "Básico (Obtención y Renov.)", "numTests": theme_counts['basico']},
        {"id": "cisternas", "name": "Cisternas", "numTests": theme_counts['cisternas']},
        {"id": "explosivos", "name": "Explosivos (Clase 1)", "numTests": theme_counts['explosivos']},
        {"id": "radiactivos", "name": "Radiactivos (Clase 7)", "numTests": theme_counts['radiactivos']}
    ]
    
    with open('data/themes.json', 'w', encoding='utf-8') as f:
        json.dump(themes, f, ensure_ascii=False, indent=2)
        
    print("Fixed ADR categories. Counts:", theme_counts)

if __name__ == "__main__":
    fix_adr()
