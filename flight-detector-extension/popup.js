// Popup JavaScript for Flight Detector extension

class PopupManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.checkCurrentPage();
    this.loadLog();
    this.setupLogExport();
    this.updateMissingFlightsCount();
  }

  setupEventListeners() {
    // Enable/disable toggle
    document.getElementById('enabled-toggle').addEventListener('change', (e) => {
      this.toggleExtension(e.target.checked);
    });

    // Show manufacturer toggle
    document.getElementById('show-manufacturer').addEventListener('change', (e) => {
      this.updateSetting('showManufacturer', e.target.checked);
    });

    // Show model toggle
    document.getElementById('show-model').addEventListener('change', (e) => {
      this.updateSetting('showModel', e.target.checked);
    });

    // Export missing flights
    document.getElementById('export-missing-flights').addEventListener('click', () => {
      this.exportMissingFlights();
    });

    // Clear cache
    document.getElementById('clear-cache').addEventListener('click', () => {
      this.clearCache();
    });
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.updateUI(response);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  updateUI(settings) {
    // Update toggle states
    document.getElementById('enabled-toggle').checked = settings.enabled;
    document.getElementById('show-manufacturer').checked = settings.showManufacturer;
    document.getElementById('show-model').checked = settings.showModel;

    // Update status indicator
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    
    if (settings.enabled) {
      statusText.textContent = 'Active';
      statusDot.classList.remove('inactive');
    } else {
      statusText.textContent = 'Inactive';
      statusDot.classList.add('inactive');
    }
  }

  async toggleExtension(enabled) {
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'toggleExtension' 
      });
      this.updateUI({ enabled: response.enabled });
    } catch (error) {
      console.error('Error toggling extension:', error);
    }
  }

  async updateSetting(key, value) {
    try {
      const currentSettings = await chrome.runtime.sendMessage({ action: 'getSettings' });
      const newSettings = { ...currentSettings, [key]: value };
      
      await chrome.runtime.sendMessage({ 
        action: 'updateSettings', 
        settings: newSettings 
      });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  }

  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentPageElement = document.getElementById('current-page');
      
      if (tab.url && tab.url.includes('cleartrip.com')) {
        currentPageElement.textContent = 'Cleartrip - Supported';
        currentPageElement.className = 'cleartrip';
      } else {
        currentPageElement.textContent = 'Not on Cleartrip';
        currentPageElement.className = 'unsupported';
      }
    } catch (error) {
      console.error('Error checking current page:', error);
      document.getElementById('current-page').textContent = 'Unable to detect page';
    }
  }

  async loadLog() {
    chrome.storage.local.get({ fdLog: [] }, (data) => {
      const logList = document.getElementById('log-list');
      logList.innerHTML = '';
      if (!data.fdLog.length) {
        logList.innerHTML = '<em>No detections yet.</em>';
        return;
      }
      data.fdLog.slice(-50).reverse().forEach(entry => {
        const div = document.createElement('div');
        div.className = 'log-list-entry';
        div.textContent = `[${entry.time}] ${entry.flightNumber || ''} ${entry.manufacturer} ${entry.model}`;
        logList.appendChild(div);
      });
    });
  }

  setupLogExport() {
    document.getElementById('export-log').addEventListener('click', () => {
      chrome.storage.local.get({ fdLog: [] }, (data) => {
        const logText = data.fdLog.map(e => `${e.time},${e.flightNumber},${e.manufacturer},${e.model}`).join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flight-detector.log';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  }

  async exportMissingFlights() {
    try {
      console.log('🔍 Starting missing flights export...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      console.log('Current tab:', tab.url);
      
      if (!tab.url || !tab.url.includes('cleartrip.com')) {
        alert('Please navigate to a Cleartrip page to export missing flights.');
        return;
      }

      console.log('✅ On Cleartrip page, sending message to content script...');

      // Send message to content script to get missing flights
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'getMissingFlights' 
      });

      console.log('📡 Response from content script:', response);

      if (response && response.missingFlights && response.missingFlights.length > 0) {
        console.log(`✅ Found ${response.missingFlights.length} missing flights:`, response.missingFlights);
        const content = response.missingFlights.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `missing-flights-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Update the count display
        document.getElementById('missing-flights-count').textContent = 
          `${response.missingFlights.length} missing flights found`;
      } else {
        console.log('ℹ️ No missing flights found in response');
        document.getElementById('missing-flights-count').textContent = 
          'No missing flights found';
      }
    } catch (error) {
      console.error('❌ Error exporting missing flights:', error);
      document.getElementById('missing-flights-count').textContent = 
        'Error: Could not export missing flights';
    }
  }

  async clearCache() {
    try {
      console.log('🗑️ Starting cache clear...');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      console.log('Current tab:', tab.url);
      
      if (!tab.url || !tab.url.includes('cleartrip.com')) {
        alert('Please navigate to a Cleartrip page to clear the cache.');
        return;
      }

      console.log('✅ On Cleartrip page, sending clear cache message...');

      // Send message to content script to clear cache
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'clearCache' 
      });

      console.log('📡 Response from content script:', response);

      if (response && response.success) {
        console.log('✅ Cache cleared successfully');
        alert('Cache cleared successfully! Please refresh the page to rebuild the cache with fresh data from the API.');
        
        // Update the missing flights count
        await this.updateMissingFlightsCount();
      } else {
        console.log('❌ Failed to clear cache');
        alert('Failed to clear cache. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      alert('Error clearing cache. Please try again.');
    }
  }

  async updateMissingFlightsCount() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('cleartrip.com')) {
        document.getElementById('missing-flights-count').textContent = 
          'Not on Cleartrip page';
        return;
      }

      // Send message to content script to get missing flights count
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'getMissingFlightsCount' 
      });

      if (response && response.count !== undefined) {
        document.getElementById('missing-flights-count').textContent = 
          `${response.count} missing flights found`;
      } else {
        document.getElementById('missing-flights-count').textContent = 
          'No missing flights found';
      }
    } catch (error) {
      console.error('Error updating missing flights count:', error);
      document.getElementById('missing-flights-count').textContent = 
        'Error: Could not update missing flights count';
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 