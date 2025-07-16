# Flight Detector Chrome Extension

A Chrome extension that automatically identifies aircraft makes (Boeing, Airbus, and others) on flight booking websites.

## Features

- **Real-time aircraft detection** on Cleartrip.com
- **Color-coded banners** for different aircraft types
- **Smart caching** to minimize API calls
- **Missing flight tracking** for database improvement (only tracks flights explicitly not found by Vercel API)
- **Data export** functionality
- **Privacy-focused** - no personal data collected

## Installation

### From Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "Flight Detector"
3. Click "Add to Chrome"
4. Grant permissions when prompted

### Manual Installation (Development)
1. Download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## Usage

1. Install the extension
2. Visit [Cleartrip.com](https://www.cleartrip.com)
3. Search for flights
4. Watch as aircraft banners appear on flight cards

## Aircraft Banner Colors

- 🔴 **Red**: Boeing aircraft
- 🟢 **Green**: Airbus aircraft  
- 🟡 **Yellow**: Other aircraft types
- 🟠 **Orange**: Unknown aircraft

## Privacy

This extension:
- ✅ Does not collect personal information
- ✅ Processes all data locally
- ✅ Only shares flight numbers with aircraft databases
- ✅ Complies with GDPR and CCPA

## Technical Details

- **Platform Support**: Cleartrip.com (primary)
- **APIs Used**: Vercel aircraft database, Cleartrip flight API
- **Storage**: Local Chrome storage only
- **Permissions**: Active tab, storage, host permissions

## Project Structure

```
flight-detector/
├── manifest.json          # Extension manifest
├── content.js            # Main content script
├── background.js         # Background script
├── popup.html           # Extension popup
├── popup.js             # Popup functionality
├── popup.css            # Popup styling
├── aircraft-manager.js  # Aircraft data management
├── platforms/           # Platform-specific code
│   └── cleartrip.js    # Cleartrip integration
├── icons/              # Extension icons
├── styles.css          # Global styles
├── extension.zip       # Chrome Web Store package
├── docs/               # Documentation
│   ├── PUBLISHING_GUIDE.md
│   ├── privacy-policy.html
│   ├── store-description.md
│   └── ...
└── README.md           # This file
```

## Key Components

- **AircraftManager**: Handles aircraft data fetching and caching
- **CleartripPlatform**: Platform-specific flight extraction
- **FlightDetectorContent**: Main content script with dynamic loading
- **Popup Interface**: User interface for data management

## Development

### Building for Chrome Web Store

1. Ensure all files are in the root directory
2. Create a ZIP file excluding documentation:
   ```bash
   zip -r extension.zip . -x "docs/*" "*.md" "*.git*"
   ```
3. Upload `extension.zip` to Chrome Web Store

### Testing

1. Load the extension in Chrome
2. Visit Cleartrip.com and search for flights
3. Verify aircraft banners appear correctly
4. Test popup functionality and data export

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact us through the Chrome Web Store developer contact information.

---

**Note**: This extension is designed for educational and informational purposes. Aircraft information is sourced from public databases and may not be 100% accurate for all flights. 