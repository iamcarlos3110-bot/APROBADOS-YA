import requests
import re

html = requests.get('https://www.todotest.com/tests/test_adr_prueba_basica.asp?t=17').text
links = re.findall(r'<a.*?href="(.*?)".*?>', html)
tests = [l for l in links if 'test_preg.asp' in l]
print("t=17 tests count:", len(tests))

html2 = requests.get('https://www.todotest.com/tests/test_adr_prueba_basica.asp?t=35').text
links2 = re.findall(r'<a.*?href="(.*?)".*?>', html2)
tests2 = [l for l in links2 if 'test_preg.asp' in l]
print("t=35 tests count:", len(tests2))
