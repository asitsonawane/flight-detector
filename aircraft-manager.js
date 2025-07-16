// Main aircraft manager for API-based approach
class AircraftManager {
  constructor() {
    this.aircraftCache = {};
    this.missingFlights = new Set();
    this.vercelApiConnected = false;
    this.cleartripApiData = null;
    this.platform = null;
    this.isFetchingFromApi = false; // Flag to prevent duplicate API calls
  }

  // Load missing flights from storage
  async loadMissingFlightsFromStorage() {
    try {
      const result = await chrome.storage.local.get({ missingFlights: [] });
      const storedFlights = result.missingFlights;
      
      console.log('📥 Loading missing flights from storage:', storedFlights.length, 'flights');
      
      // Add stored flights to the Set
      storedFlights.forEach(flight => {
        this.missingFlights.add(flight);
      });
      
      console.log('📊 Total missing flights loaded:', this.missingFlights.size);
    } catch (error) {
      console.error('❌ Error loading missing flights from storage:', error);
    }
  }

  // Save missing flights to storage
  async saveMissingFlightsToStorage() {
    try {
      const missingFlightsArray = Array.from(this.missingFlights);
      await chrome.storage.local.set({ missingFlights: missingFlightsArray });
      console.log('💾 Saved missing flights to storage:', missingFlightsArray.length, 'flights');
    } catch (error) {
      console.error('❌ Error saving missing flights to storage:', error);
    }
  }

  // Track missing flight and save to storage
  async trackMissingFlight(flightNumber) {
    if (!this.missingFlights.has(flightNumber)) {
      console.log('📝 Tracked missing flight:', flightNumber);
      this.missingFlights.add(flightNumber);
      console.log('📊 Total missing flights tracked:', this.missingFlights.size);
      
      // Save to storage immediately
      await this.saveMissingFlightsToStorage();
    }
  }

  // Setup interceptor for Cleartrip API calls
  setupCleartripApiInterceptor() {
    console.log('🔧 Setting up Cleartrip API interceptor...');
    
    // Intercept fetch calls to Cleartrip API
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Check if this is a Cleartrip API call
      if (args[0] && typeof args[0] === 'string' && args[0].includes('cleartrip.com/flight/search')) {
        console.log('🔍 Intercepted Cleartrip API call:', args[0]);
        
        try {
          // Clone the response to read it
          const responseClone = response.clone();
          const data = await responseClone.json();
          
          // Store the API data for later use
          this.cleartripApiData = data;
          console.log('📡 Stored Cleartrip API data:', data);
          
          // Extract aircraft data from the response
          this.extractAircraftFromCleartripApi(data);
        } catch (error) {
          console.error('❌ Error intercepting Cleartrip API:', error);
        }
      }
      
      return response;
    };
    
    console.log('✅ Cleartrip API interceptor setup complete');
  }

  // Manually trigger Cleartrip API data extraction
  triggerCleartripDataExtraction() {
    if (this.cleartripApiData) {
      console.log('🔄 Manually triggering Cleartrip API data extraction...');
      this.extractAircraftFromCleartripApi(this.cleartripApiData);
    } else {
      console.log('ℹ️ No Cleartrip API data available for extraction');
    }
  }

  // Extract aircraft data from Cleartrip API response
  extractAircraftFromCleartripApi(data) {
    if (!data) return;
    
    console.log('🔍 Extracting aircraft data from Cleartrip API...');
    
    try {
      // Handle the cards structure (new API format)
      if (data && data.cards) {
        for (const journeyId in data.cards) {
          const cards = data.cards[journeyId];
          
          for (const card of cards) {
            if (card.summary && card.summary.flights) {
              for (const flight of card.summary.flights) {
                const flightKey = `${flight.airlineCode}-${flight.flightNumber}`;
                
                // Try to get aircraft type from the flights object if available
                let aircraftType = null;
                if (data.flights) {
                  for (const key in data.flights) {
                    if (key.includes(flightKey)) {
                      aircraftType = data.flights[key].aircraftType;
                      break;
                    }
                  }
                }
                
                if (aircraftType && aircraftType.trim() !== '') {
                  const flightNumber = `${flight.airlineCode}${flight.flightNumber}`;
                  const displayName = this.getDisplayName(aircraftType);
                  const manufacturer = this.getManufacturer(aircraftType);
                  
                  this.aircraftCache[flightNumber] = {
                    aircraftType: aircraftType,
                    displayName: displayName,
                    manufacturer: manufacturer,
                    source: 'cleartrip_api'
                  };
                  
                  console.log(`✅ Added from Cleartrip API: ${flightNumber} -> ${displayName} (${manufacturer})`);
                }
              }
            }
          }
        }
      }
      
      // Fallback: Handle the old flights structure if available
      if (data && typeof data.flights === 'object' && data.flights !== null) {
        for (const flightKey of Object.keys(data.flights)) {
          const flightObj = data.flights[flightKey];
          if (flightObj.aircraftType && flightObj.aircraftType.trim() !== '') {
            const flightNumber = `${flightObj.airlineCode}${flightObj.fltNo}`;
            const displayName = this.getDisplayName(flightObj.aircraftType);
            const manufacturer = this.getManufacturer(flightObj.aircraftType);
            
            this.aircraftCache[flightNumber] = {
              aircraftType: flightObj.aircraftType,
              displayName: displayName,
              manufacturer: manufacturer,
              source: 'cleartrip_api'
            };
            
            console.log(`✅ Added from Cleartrip API: ${flightNumber} -> ${displayName} (${manufacturer})`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error extracting aircraft from Cleartrip API:', error);
    }
  }

  // Initialize with platform-specific implementation
  async initialize(platform) {
    this.platform = platform;
    console.log(`Aircraft Manager initialized for ${platform.getPlatformName()}`);
    
    // Load missing flights from storage
    await this.loadMissingFlightsFromStorage();

    // Test API connectivity
    const apiConnected = await this.testApiConnection();
    if (!apiConnected) {
      console.warn('⚠️ API connectivity test failed - aircraft data may not be available');
    }
  }

  // Get missing flights for export
  getMissingFlightsForExport() {
    if (!this.missingFlights) {
      console.log('ℹ️ No missing flights tracked yet');
      return [];
    }
    const flights = Array.from(this.missingFlights).sort();
    console.log(`📋 Returning ${flights.length} missing flights:`, flights);
    return flights;
  }

  // Export missing flights as downloadable text
  exportMissingFlights() {
    const missingFlights = this.getMissingFlightsForExport();
    if (missingFlights.length === 0) {
      return null;
    }

    const content = missingFlights.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `missing-flights-${new Date().toISOString().split('T')[0]}.txt`;
    a.textContent = `Download Missing Flights (${missingFlights.length})`;
    a.style.cssText = `
      display: inline-block;
      padding: 8px 16px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
      margin: 8px;
    `;
    
    return a;
  }

  // Get aircraft info for a flight number from API
  async getAircraftInfo(flightNumber) {
    const normalizedFlightNumber = this.normalizeFlightNumber(flightNumber);
    
    console.log(`Looking up aircraft info for flight: ${flightNumber} (normalized: ${normalizedFlightNumber})`);
    
    // Check cache first
    if (this.aircraftCache[normalizedFlightNumber]) {
      console.log(`Found in cache: ${normalizedFlightNumber} -> ${this.aircraftCache[normalizedFlightNumber].displayName}`);
      return this.aircraftCache[normalizedFlightNumber];
    }

    // If not cached, return null (don't mark as missing yet - wait for API call)
    console.log(`Flight not found in cache: ${normalizedFlightNumber}`);
    return null;
  }

  // Test API connectivity
  async testApiConnection() {
    console.log('🧪 Testing API connectivity...');
    
    try {
      console.log('📡 Making test API request...');
      const testResponse = await fetch('https://flights-database.vercel.app/api/aircraft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          flightCodes: ['TEST123']
        })
      });
      
      console.log('✅ API test successful:', testResponse.status);
      console.log('📡 Test response headers:', Object.fromEntries(testResponse.headers.entries()));
      
      const testData = await testResponse.json();
      console.log('📡 Test response data:', testData);
      
      this.vercelApiConnected = true;
      return true;
    } catch (error) {
      console.error('❌ API test failed:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        console.error('❌ This appears to be a CORS error');
      }
      
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.error('❌ This appears to be a network connectivity error');
      }
      
      this.vercelApiConnected = false;
      return false;
    }
  }

  // Fetch missing aircraft data from API
  async fetchMissingAircraftData(currentMissingFlights = null) {
    if (!this.platform) {
      console.error('Platform not initialized');
      return;
    }

    // Prevent duplicate API calls
    if (this.isFetchingFromApi) {
      console.log('⏳ API call already in progress, skipping...');
      return;
    }

    // Use current missing flights if provided, otherwise use persistent missing flights
    let missingFlights;
    if (currentMissingFlights) {
      // Use the current missing flights from the page
      missingFlights = currentMissingFlights.map(flight => flight.flightNumber).filter(flight => !this.aircraftCache[flight]);
      console.log(`📋 Processing ${currentMissingFlights.length} current missing flights, ${missingFlights.length} not in cache`);
    } else {
      // Use persistent missing flights (for backward compatibility)
      missingFlights = Array.from(this.missingFlights).filter(flight => !this.aircraftCache[flight]);
      console.log(`📋 Processing ${this.missingFlights.size} persistent missing flights, ${missingFlights.length} not in cache`);
    }
    
    if (missingFlights.length === 0) {
      console.log('ℹ️ No missing flights to fetch');
      return;
    }

    console.log(`🔍 Fetching ${missingFlights.length} missing flights from API`);
    console.log('Missing flights:', missingFlights);

    try {
      this.isFetchingFromApi = true; // Set flag to prevent duplicate calls
      
      // First, try Vercel API
      const vercelResults = await this.fetchFromVercelApi(missingFlights);
      
      // Track flights that were not found in Vercel API
      const vercelMissingFlights = missingFlights.filter(flight => !vercelResults[flight]);
      
      if (vercelMissingFlights.length > 0) {
        console.log(`📡 ${vercelMissingFlights.length} flights not found in Vercel API, trying Cleartrip API...`);
        
        // Try Cleartrip API for flights not found in Vercel
        const cleartripResults = await this.fetchFromCleartripApi(vercelMissingFlights);
        
        // Add Cleartrip results to cache
        for (const [flight, aircraftInfo] of Object.entries(cleartripResults)) {
          if (aircraftInfo && aircraftInfo.aircraftType) {
            this.aircraftCache[flight] = aircraftInfo;
            console.log(`✅ Added from Cleartrip API: ${flight} -> ${aircraftInfo.displayName}`);
          }
        }
        
        // Note: Flights that are still missing after both API calls are already tracked
        // when the Vercel API returns them in the missingFlights array
        const stillMissingFlights = vercelMissingFlights.filter(flight => !cleartripResults[flight]);
        for (const flight of stillMissingFlights) {
          console.log(`❌ Flight ${flight} not found in either API`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching missing aircraft data:', error);
      this.showApiErrorMessage();
    } finally {
      this.isFetchingFromApi = false; // Reset flag
    }
  }

  // Fetch from Vercel API
  async fetchFromVercelApi(missingFlights) {
    console.log(`🔍 Fetching ${missingFlights.length} missing flights from Vercel API`);
    console.log('Missing flights:', missingFlights);
    
    try {
      const response = await fetch('https://flights-database.vercel.app/api/aircraft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightCodes: missingFlights
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 API response received:', data);

      const results = {};
      
      // Process found flights
      if (data.results) {
        for (const [flightCode, aircraftInfo] of Object.entries(data.results)) {
          if (aircraftInfo && aircraftInfo.aircraftType) {
            const displayName = this.getDisplayName(aircraftInfo.aircraftType);
            const manufacturer = this.getManufacturer(aircraftInfo.aircraftType);
            
            results[flightCode] = {
              aircraftType: aircraftInfo.aircraftType,
              displayName: displayName,
              manufacturer: manufacturer,
              source: 'vercel_api'
            };
            
            this.aircraftCache[flightCode] = results[flightCode];
            console.log(`✅ Added to cache: ${flightCode} -> ${displayName} (${manufacturer})`);
          }
        }
      }

      // Track flights not found in Vercel API
      if (data.missingFlights) {
        console.log(`📊 Found ${Object.keys(data.results || {}).length} flights in Vercel API response`);
        console.log(`📊 ${data.missingFlights.length} flights missing from Vercel API`);
        
        for (const missingFlight of data.missingFlights) {
          console.log(`❌ Flight not found in Vercel API: ${missingFlight.flightCode}`);
          // Only track flights that are specifically returned as missing by the Vercel API
          await this.trackMissingFlight(missingFlight.flightCode);
        }
      }

      return results;
      
    } catch (error) {
      console.error('❌ Error fetching from Vercel API:', error);
      return {};
    }
  }

  // Fetch from Cleartrip API
  async fetchFromCleartripApi(missingFlights) {
    console.log(`🔍 Fetching ${missingFlights.length} missing flights from Cleartrip API`);
    
    try {
      // Use the platform to fetch Cleartrip API data
      const cleartripData = await this.platform.fetchAircraftData();
      console.log('📡 Cleartrip API data received:', cleartripData);
      
      const results = {};
      
      // Check if any of the missing flights are in the Cleartrip data
      for (const flight of missingFlights) {
        if (cleartripData[flight] && cleartripData[flight].aircraftType) {
          const aircraftInfo = cleartripData[flight];
          const displayName = this.getDisplayName(aircraftInfo.aircraftType);
          const manufacturer = this.getManufacturer(aircraftInfo.aircraftType);
          
          results[flight] = {
            aircraftType: aircraftInfo.aircraftType,
            displayName: displayName,
            manufacturer: manufacturer,
            source: 'cleartrip_api'
          };
          
          console.log(`✅ Found in Cleartrip API: ${flight} -> ${displayName} (${manufacturer})`);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Error fetching from Cleartrip API:', error);
      return {};
    }
  }

  // Get aircraft make (Boeing, Airbus, etc.) from API data
  getAircraftMake(aircraftType) {
    if (!aircraftType) return 'unknown';
    
    const type = aircraftType.toLowerCase();
    
    // Check Boeing aircraft codes
    if (type.includes('boeing') || /^(7\d{2}|7m\d|7l\d|b\d{3})/i.test(aircraftType)) {
      return 'boeing';
    }
    
    // Check Airbus aircraft codes
    if (type.includes('airbus') || /^(a\d{3}|a3\d{2}|a35\d|a38\d|a22\d)/i.test(aircraftType)) {
      return 'airbus';
    }
    
    if (type === 'unknown aircraft' || type === 'unknown') return 'unknown';
    return 'other';
  }

  // Get display name from API data
  getDisplayName(aircraftType) {
    if (!aircraftType) return 'Unknown Aircraft';
    return aircraftType; // API provides proper display names
  }

  // Get manufacturer from API data
  getManufacturer(aircraftType) {
    if (!aircraftType) return 'Unknown';
    
    const type = aircraftType.toLowerCase();
    
    // Check Boeing aircraft codes
    if (type.includes('boeing') || /^(7\d{2}|7m\d|7l\d|b\d{3})/i.test(aircraftType)) {
      return 'Boeing';
    }
    
    // Check Airbus aircraft codes
    if (type.includes('airbus') || /^(a\d{3}|a3\d{2}|a35\d|a38\d|a22\d)/i.test(aircraftType)) {
      return 'Airbus';
    }
    
    return 'Other';
  }

  // Normalize flight number
  normalizeFlightNumber(flightNumber) {
    return flightNumber.replace(/[-\s]/g, '').toUpperCase();
  }

  // Process all flights on the page
  async processFlights() {
    if (!this.platform) {
      console.error('Platform not initialized');
      return;
    }

    console.log('=== Starting flight processing ===');

    // Extract flight numbers from DOM
    const flightNumbers = this.platform.extractFlightNumbers();
    console.log('Extracted flight numbers from DOM:', flightNumbers);
    
    if (flightNumbers.length === 0) {
      console.log('ℹ️ No flights found on page');
      return;
    }

    // Show loading states for all flights immediately
    for (const flight of flightNumbers) {
      this.markFlightWithLoadingBanner(flight.element);
    }

    // Check each flight against cache and collect missing flights
    const missingFlights = [];
    const flightsWithInfo = [];
    
    for (const flight of flightNumbers) {
      console.log(`\n--- Processing flight: ${flight.rawFlightNumber} ---`);
      const aircraftInfo = await this.getAircraftInfo(flight.flightNumber);
      
      if (aircraftInfo) {
        console.log(`✅ Found aircraft info: ${aircraftInfo.displayName} (${aircraftInfo.manufacturer})`);
        flightsWithInfo.push({ flight, aircraftInfo });
      } else {
        console.log(`❌ No aircraft info found for: ${flight.flightNumber}`);
        missingFlights.push(flight);
      }
    }

    // Update banners for flights found in cache
    for (const { flight, aircraftInfo } of flightsWithInfo) {
      this.updateFlightBanner(flight.element, aircraftInfo);
    }

    console.log(`\nMissing flights (${missingFlights.length}):`, missingFlights.map(f => f.flightNumber));

    // If there are missing flights, fetch from API once
    if (missingFlights.length > 0) {
      console.log('Fetching missing flights from API...');
      await this.fetchMissingAircraftData(missingFlights);
      
      // Process missing flights again with updated cache
      for (const flight of missingFlights) {
        const aircraftInfo = this.aircraftCache[flight.flightNumber];
        if (aircraftInfo) {
          console.log(`✅ Found in API cache: ${flight.flightNumber} -> ${aircraftInfo.displayName}`);
          this.updateFlightBanner(flight.element, aircraftInfo);
        } else {
          console.log(`❌ Still not found after API call: ${flight.flightNumber}`);
          this.markFlightWithUnknownBanner(flight.element);
          
          // Note: Missing flights are now tracked in fetchFromVercelApi when the API returns them
          // No need to track here as it would be redundant
        }
      }
    }
    
    console.log('=== Flight processing complete ===');
  }

  // Mark flight with loading banner (initial state)
  markFlightWithLoadingBanner(flightDiv) {
    let targetDiv = flightDiv;
    if (flightDiv.classList.contains('sc-aXZVg') && flightDiv.classList.contains('dczbns') && flightDiv.classList.contains('mb-2') && flightDiv.classList.contains('bg-white')) {
      const inner = flightDiv.querySelector('div');
      if (inner) targetDiv = inner;
    }
    if (targetDiv && targetDiv.nodeType === Node.ELEMENT_NODE && !targetDiv.classList.contains('aircraft-banner-flight')) {
      targetDiv.classList.add('aircraft-banner-flight', 'loading');
      targetDiv.setAttribute('data-aircraft-banner', '');
      // Remove any previous label content
      let label = targetDiv.querySelector('.aircraft-label-content');
      if (label) label.remove();
      // Inject spinner and loading text
      const span = document.createElement('span');
      span.className = 'aircraft-label-content';
      span.innerHTML = '<span class="spinner"></span>Loading...';
      targetDiv.appendChild(span);
    }
  }

  // Update flight banner with actual aircraft data
  updateFlightBanner(flightDiv, aircraftInfo) {
    let targetDiv = flightDiv;
    if (flightDiv.classList.contains('sc-aXZVg') && flightDiv.classList.contains('dczbns') && flightDiv.classList.contains('mb-2') && flightDiv.classList.contains('bg-white')) {
      const inner = flightDiv.querySelector('div');
      if (inner) targetDiv = inner;
    }
    if (targetDiv && targetDiv.nodeType === Node.ELEMENT_NODE && targetDiv.classList.contains('aircraft-banner-flight')) {
      const make = this.getAircraftMake(aircraftInfo.aircraftType);
      let bannerText = '';
      if (make === 'boeing') {
        bannerText = `✈️ BOEING (${aircraftInfo.displayName})`;
      } else if (make === 'airbus') {
        bannerText = `✈️ AIRBUS (${aircraftInfo.displayName})`;
      } else if (make === 'other') {
        bannerText = `✈️ ${aircraftInfo.displayName}`;
      } else if (make === 'unknown') {
        bannerText = `✈️ AIRCRAFT: Unknown`;
      }
      // Remove all possible manufacturer classes and loading
      const manufacturerClasses = ['boeing', 'airbus', 'other', 'unknown', 'loading'];
      targetDiv.classList.remove(...manufacturerClasses);
      targetDiv.classList.add(make);
      targetDiv.setAttribute('data-aircraft-banner', bannerText);
      // Remove spinner/label content if present
      let label = targetDiv.querySelector('.aircraft-label-content');
      if (label) label.remove();
    }
  }

  // Mark flight with unknown banner (when no aircraft info is available)
  markFlightWithUnknownBanner(flightDiv) {
    let targetDiv = flightDiv;
    if (flightDiv.classList.contains('sc-aXZVg') && flightDiv.classList.contains('dczbns') && flightDiv.classList.contains('mb-2') && flightDiv.classList.contains('bg-white')) {
      const inner = flightDiv.querySelector('div');
      if (inner) targetDiv = inner;
    }
    if (targetDiv && targetDiv.nodeType === Node.ELEMENT_NODE && targetDiv.classList.contains('aircraft-banner-flight')) {
      const bannerText = `✈️ AIRCRAFT: Unknown`;
      // Remove all possible manufacturer classes and loading
      const manufacturerClasses = ['boeing', 'airbus', 'other', 'unknown', 'loading'];
      targetDiv.classList.remove(...manufacturerClasses);
      targetDiv.classList.add('unknown');
      targetDiv.setAttribute('data-aircraft-banner', bannerText);
      // Remove spinner/label content if present
      let label = targetDiv.querySelector('.aircraft-label-content');
      if (label) label.remove();
    }
  }

  // Show API error message to user
  showApiErrorMessage() {
    console.log('💬 Showing API error message to user');
    
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      max-width: 300px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="color: #dc2626; font-size: 16px; margin-right: 8px;">⚠️</span>
        <strong style="color: #dc2626;">Flight Detector API Error</strong>
      </div>
      <p style="margin: 0; color: #374151; line-height: 1.4;">
        Unable to fetch aircraft data. Please check your internet connection and try refreshing the page.
      </p>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 8px;
        background: #dc2626;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">Dismiss</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Get statistics
  getStats() {
    const cacheCount = Object.keys(this.aircraftCache).length;
    const missingCount = this.missingFlights.size;
    
    return {
      apiCache: cacheCount,
      missingFlights: missingCount,
      totalProcessed: cacheCount
    };
  }

  // Get API status information
  getApiStatus() {
    return {
      vercelApiConnected: this.vercelApiConnected || false,
      cleartripApiDataAvailable: !!this.cleartripApiData,
      cacheSize: Object.keys(this.aircraftCache).length,
      missingFlightsCount: this.missingFlights.size,
      cleartripApiDataKeys: this.cleartripApiData ? Object.keys(this.cleartripApiData) : []
    };
  }

  // Clear cache (for debugging/testing)
  async clearCache() {
    console.log('🗑️ Clearing aircraft cache...');
    this.aircraftCache = {};
    this.missingFlights.clear();
    this.cleartripApiData = null;
    
    // Also clear stored missing flights
    try {
      await chrome.storage.local.remove('missingFlights');
      console.log('🗑️ Cleared missing flights from storage');
    } catch (error) {
      console.error('❌ Error clearing missing flights from storage:', error);
    }
    
    console.log('🔄 Cache cleared');
  }
}

// Export for use in main content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AircraftManager;
} else {
  window.AircraftManager = AircraftManager;
} 