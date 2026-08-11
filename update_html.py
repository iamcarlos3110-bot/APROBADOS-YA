import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Navigation
html = html.replace('Inicio</a>', 'Tests</a>')
html = html.replace('Progreso</a>', 'Mi preparación</a>')

# 2. Extract #homeTopCards from home screen
top_cards_html = """      <!-- TARJETAS DE INICIO (FASE 1) -->
      <div class="home-top-cards" id="homeTopCards">
        <!-- Rellenado por JS -->
      </div>"""
html = html.replace(top_cards_html, "")

# 3. Modify Progress Screen to become Prep Screen
old_progress_screen = """  <!-- ░░░░ PANTALLA 7: PROGRESO ░░░░ -->
  <section id="screen-progress" class="screen">
    <div class="inner-wrap">
      <h2>Tu Progreso</h2>
      <p class="subtitle">Sigue tu evolución y mantén la racha diaria.</p>
      
      <div class="progress-grid" id="progressStatsGrid">
        <!-- Rellenado por JS -->
      </div>
    </div>
  </section>"""

new_prep_screen = """  <!-- ░░░░ PANTALLA 7: MI PREPARACIÓN ░░░░ -->
  <section id="screen-prep" class="screen">
    <div class="inner-wrap">
      <h2>Mi Preparación</h2>
      <p class="subtitle">Continúa estudiando y revisa tus estadísticas.</p>
      
      <div class="home-top-cards" id="homeTopCards">
        <!-- Rellenado por JS -->
      </div>

      <div class="progress-grid" id="progressStatsGrid" style="margin-top:30px;">
        <!-- Rellenado por JS -->
      </div>
    </div>
  </section>"""

if old_progress_screen in html:
    html = html.replace(old_progress_screen, new_prep_screen)
else:
    print('Could not find old progress screen!')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('index.html updated successfully.')
