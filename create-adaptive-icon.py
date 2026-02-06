from PIL import Image, ImageDraw
import os

# Input and output paths
input_path = "assets/images/Word of Covenant Logo.png"
output_path = "assets/adaptive-icon.png"

# Open the original logo
try:
    logo = Image.open(input_path)
    print(f"Original logo size: {logo.size}")
    
    # Create a new 1024x1024 image with transparent background
    adaptive_icon = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    
    # Calculate the safe zone (center 66% = ~672x672 pixels)
    # We'll use 60% to add extra padding for safety
    safe_size = int(1024 * 0.60)  # 614 pixels
    
    # Resize logo to fit within safe zone while maintaining aspect ratio
    logo.thumbnail((safe_size, safe_size), Image.Resampling.LANCZOS)
    
    # Calculate position to center the logo
    x = (1024 - logo.width) // 2
    y = (1024 - logo.height) // 2
    
    # Paste the logo in the center
    adaptive_icon.paste(logo, (x, y), logo if logo.mode == 'RGBA' else None)
    
    # Save the adaptive icon
    adaptive_icon.save(output_path, 'PNG')
    print(f"✓ Adaptive icon created successfully at: {output_path}")
    print(f"✓ New size: {adaptive_icon.size}")
    print(f"✓ Logo size in icon: {logo.size}")
    print(f"✓ Position: ({x}, {y})")
    
    # Optional: Create a preview showing the safe zones
    preview = adaptive_icon.copy()
    draw = ImageDraw.Draw(preview, 'RGBA')
    
    # Draw circle showing the safe zone (66% of 1024 = 672)
    circle_center = 512
    circle_radius = 336  # 672/2
    draw.ellipse([circle_center - circle_radius, circle_center - circle_radius, 
                  circle_center + circle_radius, circle_center + circle_radius], 
                 outline=(255, 0, 0, 128), width=3)
    
    preview.save("assets/adaptive-icon-preview.png", 'PNG')
    print(f"✓ Preview created at: assets/adaptive-icon-preview.png (with red circle showing safe zone)")
    
except FileNotFoundError:
    print(f"❌ Error: Could not find logo at {input_path}")
except Exception as e:
    print(f"❌ Error: {str(e)}")
