#!/usr/bin/env python3
"""
Complete workflow script that:
1. Crawls new images from the website
2. Processes them and updates operators_1.json
3. Provides status reporting
"""

import os
import sys
import time
from datetime import datetime

# Add the scripts directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from update_crawl import ImageCrawler
from process_images import ImageProcessor
from crawl_status import check_crawl_status

def run_complete_workflow():
    """Run the complete workflow: crawl + process"""
    print("=" * 60)
    print("🚀 ARK PALETTE UPDATE WORKFLOW")
    print("=" * 60)
    
    start_time = datetime.now()
    
    # Step 1: Crawl new images
    print("\n📥 STEP 1: Crawling new images...")
    print("-" * 40)
    
    try:
        crawler = ImageCrawler()
        crawler.crawl_new_images()
        print("✅ Crawling completed successfully")
    except Exception as e:
        print(f"❌ Error during crawling: {e}")
        return False
    
    # Step 2: Process images and update JSON
    print("\n🔄 STEP 2: Processing images and updating JSON...")
    print("-" * 40)
    
    try:
        processor = ImageProcessor()
        processor.process_all(cleanup=True)
        print("✅ Processing completed successfully")
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        return False
    
    # Step 3: Show final status
    print("\n📊 STEP 3: Final status report...")
    print("-" * 40)
    
    try:
        check_crawl_status()
    except Exception as e:
        print(f"❌ Error getting status: {e}")
    
    end_time = datetime.now()
    duration = end_time - start_time
    
    print("\n" + "=" * 60)
    print(f"🎉 WORKFLOW COMPLETED SUCCESSFULLY!")
    print(f"⏱️  Total time: {duration}")
    print("=" * 60)
    
    return True

def show_help():
    """Show help information"""
    print("ARK Palette Update Workflow")
    print("=" * 40)
    print("Usage:")
    print("  python update_workflow.py run     - Run complete workflow")
    print("  python update_workflow.py status  - Check current status")
    print("  python update_workflow.py crawl   - Only crawl new images")
    print("  python update_workflow.py process - Only process images")
    print("  python update_workflow.py help    - Show this help")

def run_crawl_only():
    """Run only the crawling step"""
    print("📥 Crawling new images only...")
    crawler = ImageCrawler()
    crawler.crawl_new_images()

def run_process_only():
    """Run only the processing step"""
    print("🔄 Processing images only...")
    processor = ImageProcessor()
    processor.process_all(cleanup=True)

def main():
    """Main function"""
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "run":
        success = run_complete_workflow()
        if not success:
            sys.exit(1)
    elif command == "status":
        check_crawl_status()
    elif command == "crawl":
        run_crawl_only()
    elif command == "process":
        run_process_only()
    elif command == "help":
        show_help()
    else:
        print(f"Unknown command: {command}")
        show_help()

if __name__ == "__main__":
    main()
