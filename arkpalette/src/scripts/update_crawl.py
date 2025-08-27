import os
import time
import json
import requests
from PIL import Image
from io import BytesIO
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime

class ImageCrawler:
    def __init__(self, output_folder="txz_imgs", position_file="crawl_position.json"):
        self.output_folder = output_folder
        self.position_file = position_file
        self.url = "https://qiandao.com/island/catalog?id=300569&navigationName=%E5%9B%BE%E9%89%B4&tabName=%E8%B0%B7%E5%AD%90%E7%B3%BB%E5%88%97&title=%E8%B0%B7%E5%AD%90"
        
        # Setup Chrome
        options = Options()
        # options.add_argument("--headless")  # Uncomment for headless mode
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920x1080")
        
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 15)
        
        # Create output folder
        os.makedirs(self.output_folder, exist_ok=True)
        
    def load_position(self):
        """Load the last crawled position from file"""
        if os.path.exists(self.position_file):
            try:
                with open(self.position_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('last_image_src', None), data.get('last_crawl_time', None)
            except Exception as e:
                print(f"Error loading position file: {e}")
        return None, None
    
    def save_position(self, last_image_src):
        """Save the current position to file"""
        data = {
            'last_image_src': last_image_src,
            'last_crawl_time': datetime.now().isoformat(),
            'total_images_crawled': len([f for f in os.listdir(self.output_folder) if f.endswith('.jpg')])
        }
        try:
            with open(self.position_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Position saved: {last_image_src}")
        except Exception as e:
            print(f"Error saving position: {e}")
    
    def sanitize_filename(self, name):
        """Sanitize filename for safe saving"""
        return "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).rstrip()
    
    def click_latest_sort(self):
        """Click on the '最新' button to sort by latest date"""
        try:
            print("Looking for '最新' sort button...")
            # Try to find the sort button by text content
            sort_button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//div[contains(text(), '最新')]"))
            )
            print("Found '最新' button, clicking...")
            self.driver.execute_script("arguments[0].click();", sort_button)
            time.sleep(3)
            print("Sorting by latest completed")
            return True
        except Exception as e:
            print(f"Could not find or click '最新' button: {e}")
            return False
    
    def navigate_to_target_tab(self):
        """Navigate to the target tab (通行认证)"""
        print("Looking for tabs...")
        tab_elements = self.driver.find_elements(By.CSS_SELECTOR, ".du-tab-item")
        print(f"Found {len(tab_elements)} tab elements.")
        
        target_tab = None
        for i, tab in enumerate(tab_elements):
            print(f"Tab {i}: {tab.text.strip()}")
            if "通行认证" in tab.text:
                target_tab = tab
                print(f"Found target tab: {tab.text.strip()}")
                break
        
        if not target_tab:
            raise Exception("❌ Tab with text '通行认证' not found.")
        
        print("Clicking on '通行认证' tab...")
        self.driver.execute_script("arguments[0].click();", target_tab)
        time.sleep(3)
    
    def scroll_and_load_images(self):
        """Scroll to load all images"""
        print("Scrolling to load all images...")
        scroll_pause = 2
        last_height = self.driver.execute_script("return document.body.scrollHeight")
        
        while True:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(scroll_pause)
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        print("Finished scrolling.")
    
    def extract_images(self):
        """Extract all image elements from the page"""
        print("Extracting image elements...")
        image_elements = self.driver.execute_script("""
        return Array.from(document.querySelectorAll('img')).map(img => {
          return {
            src: img.getAttribute('src') || img.getAttribute('data-src'),
            alt: img.getAttribute('alt') || 'no_alt'
          };
        });
        """)
        print(f"✅ Found {len(image_elements)} images.")
        return image_elements
    
    def download_image(self, img_info):
        """Download a single image"""
        src = img_info['src']
        alt = img_info['alt']
        filename = self.sanitize_filename(alt)[:100]
        
        if not src or not src.startswith("http"):
            return False
        
        try:
            response = requests.get(src, timeout=10)
            image = Image.open(BytesIO(response.content)).convert("RGB")
            path = os.path.join(self.output_folder, f"{filename}.jpg")
            image.save(path, "JPEG")
            print(f"Saved: {path}")
            return True
        except Exception as e:
            print(f"Failed to save {filename}: {e}")
            return False
    
    def crawl_new_images(self):
        """Main crawling function that only downloads new images"""
        try:
            # Load previous position
            last_image_src, last_crawl_time = self.load_position()
            if last_crawl_time:
                print(f"Last crawl time: {last_crawl_time}")
            
            # Load page
            print("Loading page...")
            self.driver.get(self.url)
            
            # Wait for tab container
            print("Waiting for tab container to load...")
            self.wait.until(EC.presence_of_element_located((By.CLASS_NAME, "du-tabs__content")))
            print("Tab container loaded.")
            
            # Navigate to target tab first
            self.navigate_to_target_tab()
            
            # Then click on '最新' to sort by date
            self.click_latest_sort()
            
            # Scroll to load images
            self.scroll_and_load_images()
            
            # Extract all images
            image_elements = self.extract_images()
            
            if not image_elements:
                print("No images found!")
                return
            
            # Download new images until we reach the last known position
            new_images_count = 0
            last_downloaded_src = None
            
            for i, img in enumerate(image_elements):
                src = img['src']
                
                # If we've reached the last known image, stop
                if last_image_src and src == last_image_src:
                    print(f"Reached last known image at position {i}, stopping...")
                    break
                
                # Download the image
                if self.download_image(img):
                    new_images_count += 1
                    last_downloaded_src = src
                
                # Add a small delay to be respectful to the server
                time.sleep(0.5)
            
            # Save the new position (the first image we saw this time)
            if image_elements:
                new_position = image_elements[0]['src']
                self.save_position(new_position)
            
            print(f"✅ Crawling completed! Downloaded {new_images_count} new images.")
            
        except Exception as e:
            print(f"❌ Error during crawling: {e}")
        
        finally:
            self.driver.quit()
            print("Browser closed.")

def main():
    """Main function to run the crawler"""
    crawler = ImageCrawler()
    crawler.crawl_new_images()

if __name__ == "__main__":
    main()
