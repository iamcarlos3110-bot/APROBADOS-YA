import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

new_root = """
:root {
  /* ── Fondos Clarisimos (Modo Claro) ── */
  --bg:       #F8F9F5;
  --bg-card:  rgba(255, 255, 255, 0.75);
  --bg-warm:  #F0F2EB;
  --bg-muted: #E6E9DF;
  --bg-header: rgba(248, 249, 245, 0.85);

  /* ── Verde oliva (principal) ── */
  --olive:       #5C6B1A;
  --olive-hover: #4A5514;
  --olive-light: #728021;
  --olive-pale:  #F4F6EB;
  --olive-soft:  #DCE3B3;
  --olive-border:#C8D38B;

  /* ── Texto ── */
  --text:     #1C1E15;
  --text2:    #585C4D;
  --text3:    #8C927A;
  --text-inv: #FFFFFF;

  /* ── Bordes ── */
  --border:   rgba(0, 0, 0, 0.08);
  --border2:  rgba(0, 0, 0, 0.12);

  /* ── Estado Correcto ── */
  --green:    #3B7A3F;
  --green-bg: #EAF5EB;
  --green-brd:#A8D4AA;

  /* ── Estado Incorrecto ── */
  --red:      #C0392B;
  --red-bg:   #FDECEA;
  --red-brd:  #F0B4AE;

  /* ── Neutro ── */
  --grey:    #8A8A8A;
  --grey-bg: #F4F4F4;

  /* ── Tipografía ── */
  --font: 'Inter', system-ui, -apple-system, sans-serif;

  /* ── Espaciado, Sombras Premium y Efectos ── */
  --header-h: 68px;
  --radius:   18px;
  --radius-sm: 10px;
  --radius-lg: 24px;
  
  --shadow:      0 8px 32px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02);
  --shadow-md:   0 16px 48px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03);
  --shadow-glow: 0 8px 24px rgba(92,107,26,0.25);
  
  --glass-blur: blur(16px);
  --t: 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

[data-theme="dark"] {
  --bg:       #0F110A;
  --bg-card:  rgba(24, 26, 20, 0.75);
  --bg-warm:  #181A14;
  --bg-muted: #22251D;
  --bg-header: rgba(15, 17, 10, 0.85);

  --olive:       #869C25;
  --olive-hover: #9EBA2B;
  --olive-light: #72851F;
  --olive-pale:  rgba(134, 156, 37, 0.12);
  --olive-soft:  rgba(134, 156, 37, 0.25);
  --olive-border:rgba(134, 156, 37, 0.35);

  --text:     #F2F4EB;
  --text2:    #A3A992;
  --text3:    #6C7359;
  --text-inv: #0F110A;

  --border:   rgba(255, 255, 255, 0.08);
  --border2:  rgba(255, 255, 255, 0.12);

  --green-bg: rgba(59, 122, 63, 0.15);
  --green-brd:rgba(59, 122, 63, 0.4);
  --red-bg:   rgba(192, 57, 43, 0.15);
  --red-brd:  rgba(192, 57, 43, 0.4);
  --grey-bg:  rgba(255,255,255, 0.05);

  --shadow:      0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2);
  --shadow-md:   0 16px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3);
  --shadow-glow: 0 8px 24px rgba(134, 156, 37, 0.15);
}
"""

css = re.sub(r':root\s*\{.*?(?=\nhtml \{)', new_root, css, flags=re.DOTALL)

css = css.replace('background: var(--bg-card);', 'background: var(--bg-card);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);')
css = css.replace('background: var(--bg-card);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  border-bottom', 'background: var(--bg-header);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  border-bottom')

# Adding styles for the theme toggle button
theme_btn_css = """
/* Theme Toggle Button */
.theme-toggle-btn {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--t);
  font-size: 16px;
  box-shadow: var(--shadow);
}
.theme-toggle-btn:hover {
  border-color: var(--olive);
  color: var(--olive);
  background: var(--olive-pale);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}
"""

if '.theme-toggle-btn' not in css:
    css = css.replace('/* ══════════════════════════════\n   PANTALLA SISTEMA', theme_btn_css + '\n/* ══════════════════════════════\n   PANTALLA SISTEMA')


with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)
