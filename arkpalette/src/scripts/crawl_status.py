import os
import json
from datetime import datetime

def check_crawl_status():
    """Check the current crawling status"""
    position_file = "crawl_position.json"
    output_folder = "txz_imgs"
    
    print("=== Crawl Status Report ===")
    
    # Check position file
    if os.path.exists(position_file):
        try:
            with open(position_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"📁 Position file: {position_file}")
            print(f"🕒 Last crawl time: {data.get('last_crawl_time', 'Unknown')}")
            print(f"📊 Total images crawled: {data.get('total_images_crawled', 0)}")
            print(f"🔗 Last image URL: {data.get('last_image_src', 'Unknown')[:100]}...")
        except Exception as e:
            print(f"❌ Error reading position file: {e}")
    else:
        print("📁 Position file: Not found (first run)")
    
    # Check output folder
    if os.path.exists(output_folder):
        image_count = len([f for f in os.listdir(output_folder) if f.endswith('.jpg')])
        print(f"📂 Output folder: {output_folder}")
        print(f"🖼️  Images in folder: {image_count}")
    else:
        print(f"📂 Output folder: {output_folder} (not found)")

def reset_position():
    """Reset the crawling position (delete position file)"""
    position_file = "crawl_position.json"
    
    if os.path.exists(position_file):
        try:
            os.remove(position_file)
            print(f"✅ Position file {position_file} deleted")
            print("🔄 Next run will start from the beginning")
        except Exception as e:
            print(f"❌ Error deleting position file: {e}")
    else:
        print("📁 Position file not found, nothing to reset")

def show_help():
    """Show help information"""
    print("=== Crawl Status Utility ===")
    print("Usage:")
    print("  python crawl_status.py status  - Check current crawling status")
    print("  python crawl_status.py reset   - Reset crawling position")
    print("  python crawl_status.py help    - Show this help")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        show_help()
    elif sys.argv[1] == "status":
        check_crawl_status()
    elif sys.argv[1] == "reset":
        reset_position()
    elif sys.argv[1] == "help":
        show_help()
    else:
        print(f"Unknown command: {sys.argv[1]}")
        show_help()
