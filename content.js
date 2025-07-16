// Inject custom CSS for banners
const style = document.createElement('style');
style.textContent = `
  .aircraft-banner-flight {
    position: relative !important;
    padding-top: 20px !important; /* Add padding to accommodate banner */
    margin-top: 5px !important; /* Add margin for better spacing */
  }
  .aircraft-banner-flight::before {
    content: attr(data-aircraft-banner);
    position: absolute;
    top: -1px;
    left: -1px;
    background: linear-gradient(135deg, #2563eb, #60a5fa);
    color: white;
    font-size: 11px;
    font-weight: bold;
    padding: 4px 8px;
    border-radius: 4px 0 4px 0;
    z-index: 10;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    animation: pulse-banner 2s infinite;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .aircraft-banner-flight.boeing::before {
    background: linear-gradient(135deg, #dc2626, #ef4444);
  }
  .aircraft-banner-flight.airbus::before {
    background: linear-gradient(135deg, #16a34a, #4ade80);
  }
  .aircraft-banner-flight.other::before {
    background: linear-gradient(135deg, #16a34a, #4ade80);
  }
  .aircraft-banner-flight.unknown::before {
    background: linear-gradient(135deg, #ff9800, #ffb74d);
  }
  /* Fix label alignment for one-way cards */
  .sc-aXZVg.dczbns.mb-2.bg-white.aircraft-banner-flight::before {
    top: 8px;
    left: 8px;
    border-radius: 6px 0 6px 0;
    z-index: 20;
  }
  @keyframes pulse-banner {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  /* Ensure proper spacing for Cleartrip's UI elements */
  .aircraft-banner-flight .sc-aXZVg.bqBeXl {
    margin-top: 5px !important;
  }
  
  /* Add hover effect for better UX */
  .aircraft-banner-flight:hover::before {
    animation: none;
    opacity: 1;
  }
`;
document.head.appendChild(style);

// Main content script
class FlightDetectorContent {
  constructor() {
    this.aircraftManager = null;
    this.platform = null;
    this.observer = null;
    this.processingQueue = new Set();
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  // Initialize the detector based on current website
  async initialize() {
    const hostname = window.location.hostname;
    if (hostname.includes('cleartrip.com')) {
      this.platform = new CleartripPlatform();
    } else {
      console.log('Unsupported platform:', hostname);
      return;
    }
    this.aircraftManager = new AircraftManager();
    await this.aircraftManager.initialize(this.platform);
    this.setupObserver();
    console.log('Flight Detector initialized successfully');
  }

  // Process flights on the page with retry mechanism
  async processFlights() {
    if (!this.aircraftManager) {
      console.error('Aircraft manager not initialized');
      return;
    }
    if (this.processingQueue.has('processFlights')) {
      console.log('⏳ Flight processing already in progress, skipping...');
      return;
    }
    this.processingQueue.add('processFlights');
    try {
      console.log('🚀 Starting flight processing...');
      await this.aircraftManager.processFlights();
      const stats = this.aircraftManager.getStats();
      console.log('Flight processing stats:', stats);
      const missingFlights = this.aircraftManager.getMissingFlightsForExport();
      if (missingFlights.length > 0 && this.retryCount < this.maxRetries) {
        console.log(`🔄 ${missingFlights.length} flights still missing, retrying in ${this.retryDelay}ms...`);
        this.retryCount++;
        setTimeout(() => {
          this.processingQueue.delete('processFlights');
          this.processFlights();
        }, this.retryDelay);
        return;
      }
      this.retryCount = 0;
    } catch (error) {
      console.error('Error processing flights:', error);
    } finally {
      this.processingQueue.delete('processFlights');
    }
  }

  // Set up mutation observer for dynamic content (one-way and round trip)
  setupObserver() {
    if (!this.aircraftManager) return;
    this.observer = new MutationObserver(() => {
      // Check for one-way or round trip flight cards
      const oneWayCards = document.querySelectorAll('.sc-aXZVg.dczbns.mb-2.bg-white');
      const roundTripParent = document.querySelector('.boGMsB.boeCrd.flex-1.flex.mt-6');
      let roundTripCards = [];
      if (roundTripParent) {
        roundTripCards = roundTripParent.querySelectorAll('.br-4.c-pointer');
      }
      if (oneWayCards.length > 0 || roundTripCards.length > 0) {
        console.log(`🛫 Detected ${oneWayCards.length} one-way cards, ${roundTripCards.length} round trip cards. Processing...`);
        this.processFlights();
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
    // Initial check in case flights are already present
    setTimeout(() => {
      const oneWayCards = document.querySelectorAll('.sc-aXZVg.dczbns.mb-2.bg-white');
      const roundTripParent = document.querySelector('.boGMsB.boeCrd.flex-1.flex.mt-6');
      let roundTripCards = [];
      if (roundTripParent) {
        roundTripCards = roundTripParent.querySelectorAll('.br-4.c-pointer');
      }
      if (oneWayCards.length > 0 || roundTripCards.length > 0) {
        console.log(`🛫 Initial check: Detected ${oneWayCards.length} one-way cards, ${roundTripCards.length} round trip cards. Processing...`);
        this.processFlights();
      }
    }, 500);
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.detector = new FlightDetectorContent();
    window.detector.initialize();
  });
} else {
  window.detector = new FlightDetectorContent();
  window.detector.initialize();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Received message in content script:', request);
  
  if (request.action === 'getMissingFlights') {
    console.log('🔍 Getting missing flights...');
    
    // Get missing flights from the aircraft manager
    if (window.detector && window.detector.aircraftManager) {
      console.log('✅ Aircraft manager found');
      const missingFlights = window.detector.aircraftManager.getMissingFlightsForExport();
      console.log('📋 Missing flights:', missingFlights);
      sendResponse({ missingFlights: missingFlights });
    } else {
      console.log('❌ Aircraft manager not found');
      sendResponse({ missingFlights: [] });
    }
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'getMissingFlightsCount') {
    console.log('🔍 Getting missing flights count...');
    
    // Get missing flights count from the aircraft manager
    if (window.detector && window.detector.aircraftManager) {
      console.log('✅ Aircraft manager found');
      const count = window.detector.aircraftManager.missingFlights.size;
      console.log('📊 Missing flights count:', count);
      sendResponse({ count: count });
    } else {
      console.log('❌ Aircraft manager not found');
      sendResponse({ count: 0 });
    }
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'clearCache') {
    console.log('🗑️ Clearing cache...');
    
    // Clear cache from the aircraft manager
    if (window.detector && window.detector.aircraftManager) {
      console.log('✅ Aircraft manager found, clearing cache...');
      window.detector.aircraftManager.clearCache();
      console.log('✅ Cache cleared successfully');
      sendResponse({ success: true });
    } else {
      console.log('❌ Aircraft manager not found');
      sendResponse({ success: false, error: 'Aircraft manager not initialized' });
    }
    return true; // Keep the message channel open for async response
  }
}); 