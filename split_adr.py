import json

def split_adr():
    # Load questions
    with open('data/dgt-questions.json', 'r', encoding='utf-8') as f:
        q_data = json.load(f)
        
    test_texts = {}
    test_lengths = {}
    
    for q in q_data:
        if q['permit_id'] == 'ADR':
            tid = q['test_id']
            if tid not in test_texts:
                test_texts[tid] = ''
                test_lengths[tid] = 0
            test_texts[tid] += q['pregunta'].lower() + ' '
            test_lengths[tid] += 1
            
    test_theme_map = {}
    counts = {
        'obtencion_basico': 0, 'renovacion_basico': 0,
        'obtencion_cisternas': 0, 'renovacion_cisternas': 0,
        'obtencion_explosivos': 0, 'renovacion_explosivos': 0,
        'obtencion_radiactivos': 0, 'renovacion_radiactivos': 0
    }
    
    for tid, text in test_texts.items():
        l = test_lengths[tid]
        
        # Detect specialty
        if 'explosiv' in text or 'clase 1' in text or 'pólvora' in text:
            spec = 'explosivos'
        elif 'radiactiv' in text or 'clase 7' in text or 'bulto tipo a' in text:
            spec = 'radiactivos'
        elif 'cisterna' in text or 'batería' in text or 'panel naranja' in text:
            spec = 'cisternas'
        else:
            spec = 'basico'
            
        # Determine theme based on length and specialty
        if l >= 30: # 30 qs is always obtencion basico
            theme = 'obtencion_basico'
        elif l == 20:
            if spec == 'basico':
                theme = 'renovacion_basico'
            else:
                theme = f'obtencion_{spec}'
        elif l <= 15: # 10 qs
            if spec == 'basico':
                theme = 'renovacion_basico' # Should be very rare
            else:
                theme = f'renovacion_{spec}'
        else:
            theme = f'obtencion_{spec}'
            
        test_theme_map[tid] = theme
        counts[theme] = counts.get(theme, 0) + 1
        
    # Update questions
    for q in q_data:
        if q['permit_id'] == 'ADR':
            theme = test_theme_map[q['test_id']]
            q['theme_id'] = theme
            
    with open('data/dgt-questions.json', 'w', encoding='utf-8') as f:
        json.dump(q_data, f, ensure_ascii=False, indent=2)
        
    # Update tests
    with open('data/dgt-tests.json', 'r', encoding='utf-8') as f:
        t_data = json.load(f)
        
    for t in t_data:
        if t['permit_id'] == 'ADR':
            t['tema_aprobados_ya'] = test_theme_map.get(t['id'], 'obtencion_basico')
            
    with open('data/dgt-tests.json', 'w', encoding='utf-8') as f:
        json.dump(t_data, f, ensure_ascii=False, indent=2)
        
    # Update themes.json
    with open('data/themes.json', 'r', encoding='utf-8') as f:
        themes = json.load(f)
        
    themes['ADR'] = [
        {"id": "oficiales", "name": "Tests Oficiales DGT", "numTests": 0},
        {"id": "obtencion_basico", "name": "Obtención (Básico)", "numTests": counts['obtencion_basico']},
        {"id": "renovacion_basico", "name": "Renovación (Básico)", "numTests": counts['renovacion_basico']},
        {"id": "obtencion_cisternas", "name": "Obtención (Cisternas)", "numTests": counts['obtencion_cisternas']},
        {"id": "renovacion_cisternas", "name": "Renovación (Cisternas)", "numTests": counts['renovacion_cisternas']},
        {"id": "obtencion_explosivos", "name": "Obtención (Explosivos)", "numTests": counts['obtencion_explosivos']},
        {"id": "renovacion_explosivos", "name": "Renovación (Explosivos)", "numTests": counts['renovacion_explosivos']},
        {"id": "obtencion_radiactivos", "name": "Obtención (Radiactivos)", "numTests": counts['obtencion_radiactivos']},
        {"id": "renovacion_radiactivos", "name": "Renovación (Radiactivos)", "numTests": counts['renovacion_radiactivos']}
    ]
    
    with open('data/themes.json', 'w', encoding='utf-8') as f:
        json.dump(themes, f, ensure_ascii=False, indent=2)
        
    print("Split ADR categories. Counts:", counts)

if __name__ == "__main__":
    split_adr()
