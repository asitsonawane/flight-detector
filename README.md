# Flight Detector Chrome Extension

A Chrome extension that automatically detects and displays aircraft manufacturer information (Boeing or Airbus) when booking flights on Cleartrip.

## Features

- **Automatic Detection**: Scans Cleartrip flight booking pages for aircraft information
- **Visual Badges**: Displays colored badges showing Boeing (blue) or Airbus (red) aircraft
- **Real-time Updates**: Works with dynamic content loading on Cleartrip
- **Customizable Settings**: Toggle extension on/off and customize display options
- **Comprehensive Database**: Supports major Boeing and Airbus aircraft models

## Supported Aircraft

### Boeing
- 737 series (B737, B738, B739, etc.)
- 747 series (B747)
- 757 series (B757)
- 767 series (B767)
- 777 series (B777)
- 787 series (B787, B788, B789, B78X)

### Airbus
- A220 series (A220, A221, A223)
- A320 series (A318, A319, A320, A321, A32A-Z)
- A330 series (A330, A332, A333)
- A340 series (A340, A342, A343, A345, A346)
- A350 series (A350, A351, A359)
- A380 series (A380, A388)

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your extensions list

### Method 2: Pack Extension (Distribution)

1. Follow steps 1-3 from Method 1
2. Click "Pack extension" in the extensions page
3. This will create a `.crx` file that can be distributed

## Usage

1. **Enable the Extension**: The extension is enabled by default. You can toggle it on/off using the extension popup.

2. **Visit Cleartrip**: Navigate to [cleartrip.com](https://www.cleartrip.com) and search for flights.

3. **View Aircraft Information**: The extension will automatically scan the page and display aircraft manufacturer badges next to flight information.

4. **Customize Settings**: Click the extension icon to access settings:
   - Enable/Disable the extension
   - Show/Hide manufacturer information
   - Show/Hide aircraft model details

## How It Works

The extension uses a content script that:

1. **Scans the Page**: Monitors Cleartrip pages for flight information
2. **Detects Aircraft Codes**: Looks for standard aircraft codes (e.g., B737, A320)
3. **Displays Badges**: Adds visual indicators showing Boeing or Airbus aircraft
4. **Updates Dynamically**: Responds to page changes and dynamic content loading

## File Structure

```
flight-detector/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── background.js         # Background service worker
├── popup.html           # Extension popup interface
├── popup.css            # Popup styles
├── popup.js             # Popup functionality
├── styles.css           # Badge styles
├── icons/               # Extension icons
└── README.md           # This file
```

## Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of JavaScript and Chrome Extension APIs

### Making Changes

1. **Modify Content Script**: Edit `content.js` to change detection logic
2. **Update Aircraft Database**: Add new aircraft codes in the `aircraftDatabase` object
3. **Customize Styles**: Modify `styles.css` for badge appearance
4. **Test Changes**: Reload the extension in `chrome://extensions/`

### Adding Support for Other Websites

To add support for other flight booking websites:

1. Update `manifest.json` to include new host permissions
2. Modify `content.js` to handle different page structures
3. Test thoroughly on the new website

## Troubleshooting

### Extension Not Working
1. Check if the extension is enabled in `chrome://extensions/`
2. Ensure you're on a Cleartrip page
3. Refresh the page and try again
4. Check browser console for any error messages

### Badges Not Appearing
1. Verify that the page contains aircraft information
2. Check if the aircraft codes are in our database
3. Try refreshing the page
4. Disable and re-enable the extension

### Performance Issues
- The extension is lightweight and shouldn't impact page performance
- If issues occur, try disabling the extension temporarily

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Version History

- **v1.0.0**: Initial release with Cleartrip support

## Future Enhancements

- Support for additional flight booking websites
- More detailed aircraft information
- Flight tracking integration
- User preferences for badge positioning
- Export flight data functionality

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository. 