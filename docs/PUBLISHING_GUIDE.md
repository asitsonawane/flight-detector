# Chrome Web Store Publishing Guide

This guide will walk you through publishing the Flight Detector extension to the Chrome Web Store.

## Prerequisites

1. **Google Developer Account**: You'll need a Google account and pay a one-time $5 registration fee
2. **Extension Files**: All files are ready in the `flight-detector-extension.zip`
3. **Privacy Policy**: Available at `privacy-policy.html`
4. **Store Assets**: Screenshots and promotional images

## Step 1: Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with your Google account
3. Pay the $5 one-time registration fee
4. Complete your developer profile

## Step 2: Prepare Store Assets

### Required Images

You'll need to create these images:

1. **Icon (128x128 PNG)**: ✅ Already created
2. **Screenshot 1 (1280x800 PNG)**: Screenshot of extension working on Cleartrip
3. **Screenshot 2 (1280x800 PNG)**: Screenshot of popup interface
4. **Screenshot 3 (1280x800 PNG)**: Screenshot showing aircraft banners
5. **Promotional Image (440x280 PNG)**: Promotional banner

### How to Create Screenshots

1. **Install the extension** in Chrome
2. **Visit Cleartrip.com** and search for flights
3. **Take screenshots** showing:
   - Flight cards with aircraft banners
   - Extension popup with statistics
   - Different aircraft types (Boeing, Airbus, etc.)

## Step 3: Upload Extension

1. **Go to Developer Dashboard**
2. **Click "Add new item"**
3. **Upload the ZIP file**: `flight-detector-extension.zip`
4. **Fill in store listing information**

## Step 4: Store Listing Information

### Basic Information

- **Item name**: Flight Detector
- **Short description**: Automatically identifies aircraft makes on flight booking websites
- **Detailed description**: Use content from `store-description.md`

### Category & Type

- **Category**: Productivity
- **Type**: Extension

### Language

- **Primary language**: English (US)

### Images

- **Icon**: Use `icons/icon128.png`
- **Screenshots**: Upload your created screenshots
- **Promotional image**: Upload promotional banner

### Privacy Practices

- **Privacy policy URL**: Host your privacy policy and provide the URL
- **Data usage**: Select "This extension does not collect user data"

## Step 5: Permissions & Privacy

### Permissions Explanation

Add this explanation for each permission:

- **Active Tab**: "Required to read flight information from web pages"
- **Storage**: "Required to store missing flight data locally"
- **Host Permissions**: "Required to access Cleartrip.com and aircraft database APIs"

### Privacy Policy

1. **Host your privacy policy** on a web server (GitHub Pages, etc.)
2. **Provide the URL** in the store listing
3. **Ensure it covers** all data practices

## Step 6: Content Rating

- **Content rating**: General audience
- **Violence**: None
- **Sexual content**: None
- **Language**: None

## Step 7: Review Process

### Before Submitting

1. **Test thoroughly** on different Cleartrip pages
2. **Verify all features** work correctly
3. **Check for console errors**
4. **Test on different browsers** (Chrome, Edge)

### Submission Checklist

- [ ] Extension ZIP file uploaded
- [ ] All required images uploaded
- [ ] Privacy policy URL provided
- [ ] Permissions explained
- [ ] Description completed
- [ ] Screenshots added
- [ ] Content rating completed

## Step 8: Submit for Review

1. **Click "Submit for review"**
2. **Wait for review** (typically 1-3 business days)
3. **Address any feedback** from Google reviewers
4. **Resubmit if needed**

## Step 9: After Publication

### Monitor Performance

- **Track installs** in the developer dashboard
- **Monitor user reviews** and ratings
- **Respond to user feedback**

### Update Process

1. **Make changes** to your extension
2. **Update version** in `manifest.json`
3. **Create new ZIP** file
4. **Upload new version** to developer dashboard
5. **Submit for review**

## Common Issues & Solutions

### Rejection Reasons

1. **Privacy Policy Missing**: Ensure you have a hosted privacy policy
2. **Permissions Not Explained**: Add clear explanations for each permission
3. **Poor Screenshots**: Use high-quality, clear screenshots
4. **Incomplete Description**: Provide detailed, accurate descriptions

### Best Practices

1. **Test thoroughly** before submission
2. **Provide clear documentation**
3. **Respond quickly** to reviewer feedback
4. **Keep privacy policy updated**
5. **Monitor user feedback**

## Hosting Privacy Policy

### Option 1: GitHub Pages

1. **Create a GitHub repository**
2. **Upload `privacy-policy.html`**
3. **Enable GitHub Pages**
4. **Use the provided URL**

### Option 2: Netlify

1. **Upload files to Netlify**
2. **Get a free subdomain**
3. **Use the provided URL**

### Option 3: Your Own Domain

1. **Host on your web server**
2. **Use your domain URL**

## Final Checklist

Before submitting, ensure:

- [ ] Extension works correctly
- [ ] All files included in ZIP
- [ ] Privacy policy hosted and accessible
- [ ] Screenshots show key features
- [ ] Description is accurate and complete
- [ ] Permissions are explained
- [ ] Content rating is appropriate
- [ ] No console errors
- [ ] Tested on multiple pages

## Support Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store Policies](https://developer.chrome.com/docs/webstore/program_policies/)

---

**Good luck with your submission!** The Flight Detector extension is well-built and should pass review successfully. 