// Background service worker for Flight Detector extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Flight Detector extension installed');
    
    // Set default settings
    chrome.storage.local.set({
      enabled: true,
      showModel: true,
      showManufacturer: true
    });
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getStatus':
      chrome.storage.local.get(['enabled'], (result) => {
        sendResponse({ enabled: result.enabled !== false });
      });
      return true; // Keep message channel open for async response
      
    case 'toggleExtension':
      chrome.storage.local.get(['enabled'], (result) => {
        const newState = !(result.enabled !== false);
        chrome.storage.local.set({ enabled: newState });
        
        // Notify content script of state change
        chrome.tabs.query({ url: 'https://www.cleartrip.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'toggleExtension', enabled: newState });
          });
        });
        
        sendResponse({ enabled: newState });
      });
      return true;
      
    case 'getSettings':
      chrome.storage.local.get(['enabled', 'showModel', 'showManufacturer'], (result) => {
        sendResponse({
          enabled: result.enabled !== false,
          showModel: result.showModel !== false,
          showManufacturer: result.showManufacturer !== false
        });
      });
      return true;
      
    case 'updateSettings':
      chrome.storage.local.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;
  }
});

// Handle tab updates to inject content script when needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('cleartrip.com')) {
    // Check if extension is enabled
    chrome.storage.local.get(['enabled'], (result) => {
      if (result.enabled !== false) {
        // Content script will be automatically injected via manifest
        console.log('Flight Detector: Tab updated, content script ready');
      }
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('cleartrip.com')) {
    // Toggle extension state
    chrome.storage.local.get(['enabled'], (result) => {
      const newState = !(result.enabled !== false);
      chrome.storage.local.set({ enabled: newState });
      
      // Update icon and notify content script
      chrome.action.setBadgeText({ 
        text: newState ? 'ON' : 'OFF',
        tabId: tab.id 
      });
      
      chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleExtension', 
        enabled: newState 
      });
    });
  } else {
    // Open popup for non-Cleartrip pages
    chrome.action.setPopup({ popup: 'popup.html' });
  }
});

// Set initial badge text
chrome.storage.local.get(['enabled'], (result) => {
  const enabled = result.enabled !== false;
  chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? '#4CAF50' : '#F44336' });
}); 