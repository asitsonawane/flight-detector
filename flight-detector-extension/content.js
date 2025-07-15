// Inject custom CSS for banners
const style = document.createElement('style');
style.textContent = `
  .aircraft-banner-flight {
    border: 2px solid #2563eb !important;
    box-shadow: 0 0 8px rgba(37, 99, 235, 0.2);
    background-color: #eff6ff !important;
    position: relative !important;
    padding-top: 25px !important; /* Add padding to accommodate banner */
    margin-top: 5px !important; /* Add margin for better spacing */
  }
  .aircraft-banner-flight.boeing {
    border-color: #dc2626 !important;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.3);
    background-color: #fef2f2 !important;
  }
  .aircraft-banner-flight.airbus {
    border-color: #16a34a !important;
    box-shadow: 0 0 8px rgba(22, 163, 74, 0.3);
    background-color: #f0fdf4 !important;
  }
  .aircraft-banner-flight.other {
    border-color: #16a34a !important;
    box-shadow: 0 0 8px rgba(22, 163, 74, 0.3);
    background-color: #f0fdf4 !important;
  }
  .aircraft-banner-flight.unknown {
    border-color: #ff9800 !important;
    box-shadow: 0 0 8px rgba(255, 152, 0, 0.3);
    background-color: #fff4e5 !important;
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
  }

  // Initialize the detector based on current website
  async initialize() {
    const hostname = window.location.hostname;
    
    // Determine platform based on hostname
    if (hostname.includes('cleartrip.com')) {
      this.platform = new CleartripPlatform();
    } else {
      console.log('Unsupported platform:', hostname);
      return;
    }

    // Initialize aircraft manager
    this.aircraftManager = new AircraftManager();
    await this.aircraftManager.initialize(this.platform);
    
    // Process flights
    await this.processFlights();
    
    // Set up mutation observer for dynamic content
    this.setupObserver();
    
    console.log('Flight Detector initialized successfully');
  }

  // Process flights on the page
  async processFlights() {
    if (!this.aircraftManager) {
      console.error('Aircraft manager not initialized');
      return;
    }

    try {
      await this.aircraftManager.processFlights();
      
      // Log statistics
      const stats = this.aircraftManager.getStats();
      console.log('Flight processing stats:', stats);
      
    } catch (error) {
      console.error('Error processing flights:', error);
    }
  }

  // Set up mutation observer for dynamic content
  setupObserver() {
    if (!this.aircraftManager) return;

    this.observer = new MutationObserver(mutations => {
      let shouldReprocess = false;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if new flight cards were added
            if (node.matches && node.matches('.sc-aXZVg.dczbns.mb-2.bg-white')) {
              shouldReprocess = true;
            } else if (node.querySelectorAll) {
              const flightCards = node.querySelectorAll('.sc-aXZVg.dczbns.mb-2.bg-white');
              if (flightCards.length > 0) {
                shouldReprocess = true;
              }
            }
          }
        });
      });
      
      if (shouldReprocess) {
        console.log('New flight cards detected, reprocessing...');
        this.processFlights();
      }
    });
    
    this.observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
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