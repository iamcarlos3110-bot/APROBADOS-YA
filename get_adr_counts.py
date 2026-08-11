from playwright.sync_api import sync_playwright
import time
import json

def get_counts():
    with sync_playwright() as p:
        b = p.chromium.launch()
        c = b.new_context()
        page = c.new_page()
        
        # Login
        page.goto('https://www.todotest.com/personal/personal.asp?op=ini')
        page.fill('#e_ini', 'iamcarlos3110@gmail.com')
        page.fill('#contra', 'Weedporsiempre31')
        try: page.click('#didomi-notice-agree-button', timeout=3000)
        except: pass
        page.click('#bot_ini', force=True)
        time.sleep(3)
        
        topics = [
            ("Básico (Obtención)", 'https://www.todotest.com/tests/test_adr_prueba_basica.asp?t=17'),
            ("Básico (Renovación)", 'https://www.todotest.com/tests/test_adr_prueba_basica.asp?t=35'),
            ("Cisternas (Obtención)", 'https://www.todotest.com/tests/test_adr_cisternas.asp?t=18'),
            ("Cisternas (Renovación)", 'https://www.todotest.com/tests/test_adr_cisternas.asp?t=36'),
            ("Explosivos (Obtención)", 'https://www.todotest.com/tests/test_adr_explosivos.asp?t=19'),
            ("Explosivos (Renovación)", 'https://www.todotest.com/tests/test_adr_explosivos.asp?t=37'),
            ("Radiactivos (Obtención)", 'https://www.todotest.com/tests/test_adr_radiactivos.asp?t=20'),
            ("Radiactivos (Renovación)", 'https://www.todotest.com/tests/test_adr_radiactivos.asp?t=38'),
            ("Etiquetas", 'https://www.todotest.com/tests/test_adr_etiquetas.asp?t=47')
        ]
        
        results = []
        for name, url in topics:
            page.goto(url)
            time.sleep(2)
            links = page.evaluate('Array.from(document.querySelectorAll("a[href]")).map(a => a.getAttribute("href"))')
            tests = [l for l in links if l and 'test_preg.asp' in l]
            # eliminate duplicates maintaining order
            seen = set()
            unique_tests = []
            for t in tests:
                if t not in seen:
                    unique_tests.append(t)
                    seen.add(t)
            
            print(f"{name}: {len(unique_tests)} tests")
            results.append({"name": name, "count": len(unique_tests)})
            
        b.close()
        
        with open('adr_counts.json', 'w', encoding='utf-8') as f:
            json.dump(results, f)

if __name__ == "__main__":
    get_counts()
