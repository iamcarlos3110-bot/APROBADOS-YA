import os
from PIL import Image

def generate_icons():
    logo_path = 'logo.jpg'
    if not os.path.exists(logo_path):
        print("Error: logo.jpg not found.")
        return

    os.makedirs('images', exist_ok=True)
    
    img = Image.open(logo_path)
    
    # Make it square if it's not
    width, height = img.size
    min_dim = min(width, height)
    left = (width - min_dim) / 2
    top = (height - min_dim) / 2
    right = (width + min_dim) / 2
    bottom = (height + min_dim) / 2
    img_square = img.crop((left, top, right, bottom))
    
    sizes = {
        'icon-192.png': 192,
        'icon-512.png': 512,
        'apple-touch-icon.png': 180
    }
    
    for name, size in sizes.items():
        resized = img_square.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join('images', name)
        resized.save(out_path, format='PNG')
        print(f"Generated {out_path}")

if __name__ == '__main__':
    generate_icons()
