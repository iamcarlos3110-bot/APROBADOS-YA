import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Strip all backdrop filters
css = re.sub(r'\s*backdrop-filter:\s*var\(--glass-blur\);\s*-webkit-backdrop-filter:\s*var\(--glass-blur\);', '', css)

# Re-add to site-header
css = css.replace('.site-header {\n  position: sticky; top: 0; z-index: 100;\n  background: var(--bg-header);\n  border-bottom',
                  '.site-header {\n  position: sticky; top: 0; z-index: 100;\n  background: var(--bg-header);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  border-bottom')

# Re-add to test-topbar
css = css.replace('.test-topbar {\n  background: var(--bg-card);\n  border-bottom',
                  '.test-topbar {\n  background: var(--bg-header);\n  backdrop-filter: var(--glass-blur);\n  -webkit-backdrop-filter: var(--glass-blur);\n  border-bottom')


# Also, let's make sure the Dark Mode colors are truly premium. 
# We can refine the dark mode variables.
new_dark = """[data-theme="dark"] {
  --bg:       #121212;
  --bg-card:  #1E1E1E;
  --bg-warm:  #252525;
  --bg-muted: #2C2C2C;
  --bg-header: rgba(18, 18, 18, 0.85);

  --olive:       #7F9A38;
  --olive-hover: #96B543;
  --olive-light: #6A822D;
  --olive-pale:  rgba(127, 154, 56, 0.15);
  --olive-soft:  rgba(127, 154, 56, 0.25);
  --olive-border:rgba(127, 154, 56, 0.4);

  --text:     #F5F5F5;
  --text2:    #B0B0B0;
  --text3:    #808080;
  --text-inv: #121212;

  --border:   rgba(255, 255, 255, 0.08);
  --border2:  rgba(255, 255, 255, 0.12);

  --green-bg: rgba(59, 122, 63, 0.2);
  --green-brd:rgba(59, 122, 63, 0.5);
  --red-bg:   rgba(192, 57, 43, 0.2);
  --red-brd:  rgba(192, 57, 43, 0.5);
  --grey-bg:  rgba(255,255,255, 0.05);

  --shadow:      0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4);
  --shadow-md:   0 16px 48px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5);
  --shadow-glow: 0 8px 24px rgba(127, 154, 56, 0.2);
}"""

css = re.sub(r'\[data-theme="dark"\]\s*\{.*?(?=\nhtml \{)', new_dark + '\n', css, flags=re.DOTALL)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)
