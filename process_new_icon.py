import os
from PIL import Image, ImageDraw

def create_rounded_mask(size, radius):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius, fill=255)
    return mask

def process_image():
    input_path = r"C:\Users\iamca\.gemini\antigravity\brain\b5e5e481-5996-4cb1-b428-702c4cb89c8b\.user_uploaded\media_1786474183972.jpg"
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    os.makedirs('images', exist_ok=True)
    
    img = Image.open(input_path).convert("RGBA")
    
    # The image is 1024x1024 (or similar). Let's apply a rounded corner mask to make corners transparent.
    # The corners are white. The actual rounded shape seems to have a radius of around 15-20% of the width.
    width, height = img.size
    radius = int(width * 0.20) # 20% radius usually fits iOS style icons well
    
    mask = create_rounded_mask((width, height), radius)
    
    # Apply mask
    img.putalpha(mask)

    # Save the main transparent logo
    img.save(os.path.join('images', 'logo.png'), format='PNG')
    
    sizes = {
        'icon-192.png': 192,
        'icon-512.png': 512,
        'apple-touch-icon.png': 180
    }
    
    for name, size in sizes.items():
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join('images', name)
        resized.save(out_path, format='PNG')
        print(f"Generated {out_path} with transparent corners")

if __name__ == '__main__':
    process_image()
