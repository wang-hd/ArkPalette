# Image Crawler Update Scripts

This directory contains scripts for incrementally crawling images from the website, processing them, and updating the operators data file.

## Files

- `update_crawl.py` - Main update script that crawls only new images
- `process_images.py` - Image processing script that updates operators_1.json
- `update_workflow.py` - Complete workflow script (crawl + process)
- `crawl_status.py` - Utility script to check status and manage crawling position
- `crawl_position.json` - Position tracking file (created automatically)

## How It Works

### Crawling Process
The update script works by:

1. **Sorting by Date**: Clicks on the "最新" (latest) button to sort images by date
2. **Position Tracking**: Remembers the first image URL from the previous crawl
3. **Incremental Download**: Downloads images until it reaches the previously seen image
4. **Position Saving**: Saves the new first image URL for the next update

### Processing Pipeline
The processing script follows these steps:

1. **Rename & Filter**: Renames files and filters out unwanted images (精英二, sp variants)
2. **Crop Images**: Crops images to specific dimensions based on their index
3. **Pixelate**: Applies pixelation effect to create the final look
4. **Convert Names**: Converts Chinese names to Unicode format
5. **Calculate Colors**: Extracts average colors from specific areas
6. **Generate Palette**: Creates color palettes and pixel grids for the JSON data

## Usage

### Complete Workflow (Recommended)

Run the complete workflow that crawls new images and processes them:

```bash
python update_workflow.py run
```

### Individual Steps

#### Crawling Only
```bash
python update_crawl.py
```

#### Processing Only
```bash
python process_images.py
```

#### Check Status
```bash
python update_workflow.py status
```

#### Reset Position
```bash
python crawl_status.py reset
```

### First Time Setup

If you're running this for the first time:
- The crawler will download all available images
- The processor will create the complete operators_1.json file
- Position tracking will be set up for future updates

### Regular Updates

For subsequent runs:
- Only new images will be downloaded
- The JSON file will be updated with new operators
- Processing will be incremental

## Configuration

### Crawler Configuration (`update_crawl.py`)
- `output_folder`: Where to save downloaded images (default: "txz_imgs")
- `position_file`: Position tracking file name (default: "crawl_position.json")
- `url`: The website URL to crawl

### Processor Configuration (`process_images.py`)
- `input_folder`: Source folder for images (default: "txz_imgs")
- `output_json`: Output JSON file path (default: "data/operators_1.json")
- `temp_folders`: Temporary processing folders (automatically cleaned up)

## Requirements

Make sure you have the required dependencies installed:

```bash
pip install selenium pillow requests opencv-python numpy
```

You also need Chrome and ChromeDriver installed for Selenium to work.

## Notes

- The crawler includes delays between downloads to be respectful to the server
- Images are sorted by date (latest first) before crawling
- The script automatically handles the "通行认证" tab navigation
- All images are saved as JPG files with sanitized filenames
- The position tracking file contains metadata about the last crawl
- The processor automatically cleans up temporary folders after processing
- The final JSON file is saved to `data/operators_1.json` for use in the application

## Troubleshooting

If the script fails to find the "最新" button:
- The website layout may have changed
- Check if the button text or selector needs updating

If you get Chrome/ChromeDriver errors:
- Make sure Chrome is installed and up to date
- Install the appropriate ChromeDriver version for your Chrome version
