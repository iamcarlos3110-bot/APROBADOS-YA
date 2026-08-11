import requests
import re
from bs4 import BeautifulSoup

def count_tests(url):
    html = requests.get(url).text
    soup = BeautifulSoup(html, 'html.parser')
    links = [a.get('href') for a in soup.find_all('a', href=True)]
    tests = [l for l in links if 'test.asp' in l or 'test_preg.asp' in l]
    return len(set(tests))

topics = {
    "Básico (Obtención)": 'https://www.todotest.com/tests/test_adr_prueba_basica.asp?t=17',
    "Básico (Renovación)": 'https://www.todotest.com/tests/test_adr_prueba_basica.asp?t=35',
    "Cisternas (Obtención)": 'https://www.todotest.com/tests/test_adr_cisternas.asp?t=18',
    "Cisternas (Renovación)": 'https://www.todotest.com/tests/test_adr_cisternas.asp?t=36',
    "Explosivos (Obtención)": 'https://www.todotest.com/tests/test_adr_explosivos.asp?t=19',
    "Explosivos (Renovación)": 'https://www.todotest.com/tests/test_adr_explosivos.asp?t=37',
    "Radiactivos (Obtención)": 'https://www.todotest.com/tests/test_adr_radiactivos.asp?t=20',
    "Radiactivos (Renovación)": 'https://www.todotest.com/tests/test_adr_radiactivos.asp?t=38',
    "Etiquetas": 'https://www.todotest.com/tests/test_adr_etiquetas.asp?t=47'
}

for name, url in topics.items():
    print(f"{name}: {count_tests(url)} tests")
