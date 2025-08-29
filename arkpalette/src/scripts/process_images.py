import os
import json
import shutil
import cv2
import numpy as np
from PIL import Image, ImageChops
from datetime import datetime

class ImageProcessor:
    def __init__(self, 
                 input_folder="txz_imgs", 
                 output_json="data/operators_1.json",
                 temp_folders=["txz_imgs_1", "txz_imgs_crop", "txz_pixelated", "txz"]):
        self.input_folder = input_folder
        self.output_json = output_json
        self.temp_folders = temp_folders
        
        # Load existing data if available
        self.existing_data = {}
        if os.path.exists(output_json):
            try:
                with open(output_json, 'r', encoding='utf-8') as f:
                    self.existing_data = json.load(f)
                print(f"Loaded existing data with {len(self.existing_data)} operators")
            except Exception as e:
                print(f"Error loading existing data: {e}")
    
    def chinese_to_unicode_key(self, name: str) -> str:
        """Convert Chinese name to Unicode key"""
        return ''.join(f'u{ord(char):04x}' for char in name)
    
    def sanitize_filename(self, name):
        """Sanitize filename for safe saving"""
        return "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).rstrip()
    
    def step1_rename_and_filter(self):
        """Step 1: Rename files and filter out unwanted ones"""
        print("Step 1: Renaming and filtering images...")
        
        src_folder = self.input_folder
        dst_folder = self.temp_folders[0]
        os.makedirs(dst_folder, exist_ok=True)
        
        processed_count = 0
        for filename in os.listdir(src_folder):
            if not filename.lower().endswith(".jpg"):
                continue
            
            name = filename[:-4]  # Strip ".jpg"
            parts = name.split("-")
            
            if len(parts) < 2:
                continue  # Doesn't match expected pattern
            
            a = "-".join(parts[:-1])
            b = parts[-1]
            
            # Filter out unwanted images - check entire filename
            if any(term in filename for term in ["精英二", "精二", "sp", "SP", "演职认证"]):
                continue
            
            # Extract numeric part from the last segment
            numeric_part = ''.join(filter(str.isdigit, b))
            if numeric_part:
                a = f"{a}_{numeric_part}"
            
            # Save as "a.jpg" in destination
            src_path = os.path.join(src_folder, filename)
            dst_path = os.path.join(dst_folder, f"{a}.jpg")
            
            try:
                shutil.copyfile(src_path, dst_path)
                processed_count += 1
                print(f"Processed: {filename} → {a}.jpg")
            except Exception as e:
                print(f"Error copying {filename}: {e}")
        
        print(f"Step 1 completed: {processed_count} images processed")
        return processed_count
    
    def step2_crop_images(self):
        """Step 2: Crop images to specific dimensions based on their index"""
        print("Step 2: Cropping images...")
        
        src_folder = self.temp_folders[0]
        dst_folder = self.temp_folders[1]
        os.makedirs(dst_folder, exist_ok=True)
        
        target_size = (200, 400)
        processed_count = 0
        
        def crop_with_xywh(image, x, y, w, h):
            return image.crop((x, y, x + w, y + h))
        
        for filename in os.listdir(src_folder):
            if not filename.lower().endswith(".jpg"):
                continue
            
            src_path = os.path.join(src_folder, filename)
            dst_path = os.path.join(dst_folder, filename)
            
            try:
                with Image.open(src_path) as img:
                    # Crop the image according to filenames
                    name = filename[:-4]
                    if name.endswith("_70"):
                        img = crop_with_xywh(img, 128, 208, 109, 218)
                    elif name.endswith("_20"):
                        img = crop_with_xywh(img, 127, 211, 105, 210)
                    elif name.endswith("_360"):
                        img = crop_with_xywh(img, 118, 205, 126, 252)
                    elif name.endswith("_410"):
                        img = crop_with_xywh(img, 117, 204, 126, 252)
                    elif name.endswith("_440") or name.endswith("_450"):
                        img = crop_with_xywh(img, 113, 207, 130, 250)
                    else:
                        img = crop_with_xywh(img, 113, 207, 132, 264)
                    
                    # Resize the image
                    img = img.resize(target_size, Image.LANCZOS)
                    
                    # Save the processed image
                    img.save(dst_path, "JPEG")
                    processed_count += 1
                    print(f"Cropped: {filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
        
        print(f"Step 2 completed: {processed_count} images cropped")
        return processed_count
    
    def step3_pixelate_images(self):
        """Step 3: Pixelate images"""
        print("Step 3: Pixelating images...")
        
        src_folder = self.temp_folders[1]
        dst_folder = self.temp_folders[2]
        os.makedirs(dst_folder, exist_ok=True)
        
        pixelation_factor = 20
        processed_count = 0
        
        for filename in os.listdir(src_folder):
            if not filename.lower().endswith(".jpg"):
                continue
            
            src_path = os.path.join(src_folder, filename)
            dst_path = os.path.join(dst_folder, filename)
            
            try:
                with Image.open(src_path) as img:
                    img = img.convert("RGB")
                    original_size = img.size
                    
                    # Resize to smaller size
                    small_size = (original_size[0] // pixelation_factor, original_size[1] // pixelation_factor)
                    img_small = img.resize(small_size, Image.NEAREST)
                    
                    # Create a new image with the same size as the original
                    pixelated_img = Image.new("RGB", original_size)
                    
                    # Scale up each pixel block to the original size
                    for y in range(small_size[1]):
                        for x in range(small_size[0]):
                            color = img_small.getpixel((x, y))
                            x_start = x * pixelation_factor
                            y_start = y * pixelation_factor
                            x_end = min(x_start + pixelation_factor, original_size[0])
                            y_end = min(y_start + pixelation_factor, original_size[1])
                            
                            for yy in range(y_start, y_end):
                                for xx in range(x_start, x_end):
                                    pixelated_img.putpixel((xx, yy), color)
                    
                    pixelated_img.save(dst_path, "JPEG")
                    processed_count += 1
                    print(f"Pixelated: {filename}")
            except Exception as e:
                print(f"Error pixelating {filename}: {e}")
        
        print(f"Step 3 completed: {processed_count} images pixelated")
        return processed_count
    
    def step4_convert_to_unicode_names(self):
        """Step 4: Convert filenames to Unicode format"""
        print("Step 4: Converting to Unicode names...")
        
        src_folder = self.temp_folders[2]
        dst_folder = self.temp_folders[3]
        os.makedirs(dst_folder, exist_ok=True)
        
        processed_count = 0
        
        for filename in os.listdir(src_folder):
            if not filename.lower().endswith(".jpg"):
                continue
            
            # Handle filenames that may or may not have an index
            if "_" in filename[:-4]:
                name, index = filename[:-4].rsplit("_", 1)
            else:
                name = filename[:-4]
                index = "0"  # Default index for files without underscore
            unicode_name = self.chinese_to_unicode_key(name)
            
            src_path = os.path.join(src_folder, filename)
            dst_path = os.path.join(dst_folder, f"{unicode_name}.jpg")
            
            try:
                shutil.copyfile(src_path, dst_path)
                processed_count += 1
                print(f"Converted: {filename} → {unicode_name}.jpg")
            except Exception as e:
                print(f"Error converting {filename}: {e}")
        
        print(f"Step 4 completed: {processed_count} images converted")
        return processed_count
    
    def step5_calculate_average_colors(self):
        """Step 5: Calculate average colors for each image"""
        print("Step 5: Calculating average colors...")
        
        src_folder = self.temp_folders[1]  # Use cropped images for color calculation
        crop_area = (40, 240, 160, 160)
        processed_count = 0
        
        for filename in os.listdir(src_folder):
            if not filename.lower().endswith(".jpg"):
                continue
            
            # Handle filenames that may or may not have an index
            if "_" in filename[:-4]:
                name, index = filename[:-4].rsplit("_", 1)
            else:
                name = filename[:-4]
                index = "0"  # Default index for files without underscore
            unicode_name = self.chinese_to_unicode_key(name)
            
            src_path = os.path.join(src_folder, filename)
            
            try:
                with Image.open(src_path) as img:
                    img = img.convert("RGB")
                    
                    # Crop the specified area
                    cropped = img.crop((crop_area[0], crop_area[1], 
                                      crop_area[0] + crop_area[2], 
                                      crop_area[1] + crop_area[3]))
                    
                    # Calculate the average color
                    pixels = list(cropped.getdata())
                    avg_color = tuple(sum(c[i] for c in pixels) // len(pixels) for i in range(3))
                    hex_color = "#{:02x}{:02x}{:02x}".format(*avg_color)
                    
                    # Update or create operator data
                    if unicode_name not in self.existing_data:
                        self.existing_data[unicode_name] = {}
                    
                    self.existing_data[unicode_name].update({
                        "name": name,
                        "unicode": unicode_name,
                        "index": int(index),
                        "hex": hex_color
                    })
                    
                    processed_count += 1
                    print(f"Color calculated: {name} → {hex_color}")
            except Exception as e:
                print(f"Error calculating color for {filename}: {e}")
        
        print(f"Step 5 completed: {processed_count} colors calculated")
        return processed_count
    
    def step6_generate_palette_and_pixels(self):
        """Step 6: Generate palette and pixel grid for each image"""
        print("Step 6: Generating palette and pixel grids...")
        
        src_folder = self.temp_folders[3]  # Use Unicode-named images
        grid_width, grid_height = 10, 20
        tolerance = 20
        processed_count = 0
        
        def colors_are_similar(c1, c2, tolerance):
            return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5 <= tolerance
        
        def image_to_json_grid(image_path, grid_width, grid_height, tolerance, operator_data):
            img = Image.open(image_path).convert('RGB')
            img_width, img_height = img.size
            
            cell_w = img_width // grid_width
            cell_h = img_height // grid_height
            
            palette = []
            pixel_grid = []
            
            for y in range(grid_height):
                row = []
                for x in range(grid_width):
                    left = x * cell_w
                    top = y * cell_h
                    right = left + cell_w
                    bottom = top + cell_h
                    cell = img.crop((left, top, right, bottom))
                    
                    colors = cell.getdata()
                    avg = tuple(sum(c[i] for c in colors) // len(colors) for i in range(3))
                    
                    matched_index = None
                    for i, pc in enumerate(palette):
                        if colors_are_similar(avg, pc, tolerance):
                            matched_index = i
                            break
                    
                    if matched_index is None:
                        matched_index = len(palette)
                        palette.append(avg)
                    
                    row.append(matched_index)
                pixel_grid.append(row)
            
            # Convert palette to hex strings
            palette = ['#{:02x}{:02x}{:02x}'.format(*c) for c in palette]
            
            operator_data.update({
                "palette": palette,
                "pixels": pixel_grid
            })
        
        for filename in os.listdir(src_folder):
            if not filename.lower().endswith(".jpg"):
                continue
            
            unicode_name = filename[:-4]  # Remove .jpg extension
            src_path = os.path.join(src_folder, filename)
            
            try:
                if unicode_name in self.existing_data:
                    image_to_json_grid(src_path, grid_width, grid_height, tolerance, self.existing_data[unicode_name])
                    processed_count += 1
                    print(f"Palette generated: {unicode_name}")
                else:
                    print(f"Warning: {unicode_name} not found in existing data")
            except Exception as e:
                print(f"Error generating palette for {filename}: {e}")
        
        print(f"Step 6 completed: {processed_count} palettes generated")
        return processed_count
    
    def save_json(self):
        """Save the updated JSON data"""
        print("Saving updated JSON data...")
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(self.output_json), exist_ok=True)
        
        try:
            with open(self.output_json, 'w', encoding='utf-8') as f:
                json.dump(self.existing_data, f, indent=None, ensure_ascii=False)
            print(f"JSON data saved to {self.output_json}")
            print(f"Total operators: {len(self.existing_data)}")
        except Exception as e:
            print(f"Error saving JSON: {e}")
    
    def cleanup_temp_folders(self):
        """Clean up temporary folders"""
        print("Cleaning up temporary folders...")
        
        for folder in self.temp_folders:
            if os.path.exists(folder):
                try:
                    shutil.rmtree(folder)
                    print(f"Removed: {folder}")
                except Exception as e:
                    print(f"Error removing {folder}: {e}")
    
    def process_all(self, cleanup=True):
        """Run the complete processing pipeline"""
        print("Starting image processing pipeline...")
        print(f"Input folder: {self.input_folder}")
        print(f"Output JSON: {self.output_json}")
        
        start_time = datetime.now()
        
        try:
            # Run all processing steps
            self.step1_rename_and_filter()
            self.step2_crop_images()
            self.step3_pixelate_images()
            self.step4_convert_to_unicode_names()
            self.step5_calculate_average_colors()
            self.step6_generate_palette_and_pixels()
            
            # Save the final result
            self.save_json()
            
            # Cleanup if requested
            if cleanup:
                self.cleanup_temp_folders()
            
            end_time = datetime.now()
            duration = end_time - start_time
            print(f"Processing completed in {duration}")
            
        except Exception as e:
            print(f"Error during processing: {e}")
            raise

def main():
    """Main function to run the processor"""
    processor = ImageProcessor()
    processor.process_all(cleanup=True)

if __name__ == "__main__":
    main()
