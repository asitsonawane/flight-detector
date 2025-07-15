# Quick Installation Guide

## Install Flight Detector Chrome Extension

### Step 1: Download the Extension
1. Download or clone this repository to your computer
2. Make sure all files are in a single folder

### Step 2: Load in Chrome
1. Open Google Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked"
5. Select the folder containing the extension files
6. The extension should now appear in your extensions list

### Step 3: Test the Extension
1. Go to [cleartrip.com](https://www.cleartrip.com)
2. Search for flights
3. Look for aircraft manufacturer badges (Boeing/Airbus) next to flight information

### Step 4: Customize (Optional)
1. Click the extension icon in your browser toolbar
2. Adjust settings as needed:
   - Enable/Disable the extension
   - Show/Hide manufacturer information
   - Show/Hide aircraft model details

## Troubleshooting

**Extension not working?**
- Make sure you're on a Cleartrip page
- Refresh the page
- Check if the extension is enabled in `chrome://extensions/`

**No badges appearing?**
- The page might not contain aircraft information
- Try searching for different flights
- Check browser console for errors

**Need to update the extension?**
- Go to `chrome://extensions/`
- Click the refresh icon on the Flight Detector extension
- Or reload the unpacked extension

## Note about Icons
The current version uses placeholder icon files. For a complete installation, you should replace the placeholder files in the `icons/` folder with actual PNG images:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

You can create simple icons with a plane symbol and "FD" text using any image editor. 