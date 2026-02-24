from PIL import Image, ImageDraw
import os

# Input and output paths
input_path = "assets/images/Word of Covenant Logo.png"
output_path = "assets/adaptive-icon.png"

# Open the original logo
try:
    logo = Image.open(input_path)
    print(f"Original logo size: {logo.size}")
    
    # Create a new 1024x1024 image with white background
    adaptive_icon = Image.new('RGBA', (1024, 1024), (255, 255, 255, 255))
    
    # Calculate the safe zone - using 45% for better zoom out
    safe_size = int(1024 * 0.45)  # 460 pixels - more zoomed out
    
    # Resize logo to fit within safe zone while maintaining aspect ratio
    logo.thumbnail((safe_size, safe_size), Image.Resampling.LANCZOS)
    
    # Create a circular mask for the logo
    mask = Image.new('L', (safe_size, safe_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, safe_size, safe_size], fill=255)
    
    # Create a circular background
    circle_bg = Image.new('RGBA', (safe_size, safe_size), (255, 255, 255, 255))
    circle_draw = ImageDraw.Draw(circle_bg)
    circle_draw.ellipse([0, 0, safe_size, safe_size], fill=(255, 255, 255, 255))
    
    # Resize logo to fit in circle with some padding (85% of circle size)
    logo_size = int(safe_size * 0.85)
    logo.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Center the logo on the circular background
    logo_x = (safe_size - logo.width) // 2
    logo_y = (safe_size - logo.height) // 2
    circle_bg.paste(logo, (logo_x, logo_y), logo if logo.mode == 'RGBA' else None)
    
    # Apply circular mask
    circle_bg.putalpha(mask)
    
    # Calculate position to center the circular logo on the canvas
    x = (1024 - safe_size) // 2
    y = (1024 - safe_size) // 2
    
    # Paste the circular logo in the center
    adaptive_icon.paste(circle_bg, (x, y), circle_bg)
    
    # Save the adaptive icon
    adaptive_icon.save(output_path, 'PNG')
    print(f"✓ Adaptive icon created successfully at: {output_path}")
    print(f"✓ Canvas size: {adaptive_icon.size}")
    print(f"✓ Circle size: {safe_size}x{safe_size}")
    print(f"✓ Logo size in circle: {logo.size}")
    print(f"✓ Position: ({x}, {y})")
    print(f"✓ Zoom level: 45% (zoomed out for better visibility)")
    
    # Optional: Create a preview showing the safe zones
    preview = adaptive_icon.copy()
    draw = ImageDraw.Draw(preview, 'RGBA')
    
    # Draw circle showing the safe zone (66% of 1024 = 672)
    circle_center = 512
    circle_radius = 336  # 672/2 - Android safe zone
    draw.ellipse([circle_center - circle_radius, circle_center - circle_radius, 
                  circle_center + circle_radius, circle_center + circle_radius], 
                 outline=(255, 0, 0, 128), width=3)
    
    # Draw the actual logo circle
    logo_circle_radius = safe_size // 2
    draw.ellipse([circle_center - logo_circle_radius, circle_center - logo_circle_radius, 
                  circle_center + logo_circle_radius, circle_center + logo_circle_radius], 
                 outline=(0, 255, 0, 128), width=3)
    
    preview.save("assets/adaptive-icon-preview.png", 'PNG')
    print(f"✓ Preview created at: assets/adaptive-icon-preview.png")
    print(f"  (Red circle = Android safe zone, Green circle = Logo boundary)")
    
except FileNotFoundError:
    print(f"❌ Error: Could not find logo at {input_path}")
except Exception as e:
    print(f"❌ Error: {str(e)}")
