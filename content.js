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
    this.processingQueue = new Set();
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
    this.lastFlightCount = 0;
    this.stableCount = 0;
    this.stableThreshold = 3; // Number of consecutive stable counts before processing
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
    
    // Wait for page to load and then process flights with retry mechanism
    await this.waitForPageLoad();
    
    // Set up mutation observer for dynamic content
    this.setupObserver();
    
    console.log('Flight Detector initialized successfully');
  }

  // Wait for page to be more fully loaded
  async waitForPageLoad() {
    console.log('⏳ Waiting for page to load...');
    
    // Wait for initial load
    await this.delay(1000);
    
    // Start monitoring for flight cards
    await this.monitorFlightCards();
  }

  // Monitor flight cards and wait for stable count
  async monitorFlightCards() {
    let attempts = 0;
    const maxAttempts = 15; // 15 seconds max wait
    
    while (attempts < maxAttempts) {
      const currentFlightCount = this.getCurrentFlightCount();
      
      console.log(`📊 Flight count: ${currentFlightCount} (attempt ${attempts + 1}/${maxAttempts})`);
      
      // Check if page is still loading
      const isLoading = this.isPageStillLoading();
      if (isLoading) {
        console.log('⏳ Page still loading, waiting...');
        this.stableCount = 0; // Reset stability counter
        await this.delay(1000);
        attempts++;
        continue;
      }
      
      if (currentFlightCount === this.lastFlightCount) {
        this.stableCount++;
        console.log(`✅ Stable count: ${this.stableCount}/${this.stableThreshold}`);
        
        if (this.stableCount >= this.stableThreshold) {
          console.log('🎯 Flight count stabilized, processing flights...');
          await this.processFlights();
          return;
        }
      } else {
        this.stableCount = 0;
        console.log('🔄 Flight count changed, resetting stability counter');
      }
      
      this.lastFlightCount = currentFlightCount;
      await this.delay(1000);
      attempts++;
    }
    
    // If we reach max attempts, process anyway
    console.log('⏰ Max attempts reached, processing flights anyway...');
    await this.processFlights();
  }

  // Check if the page is still loading flights
  isPageStillLoading() {
    // Look for basic loading indicators
    const loadingIndicators = document.querySelectorAll([
      '.loading',
      '.spinner',
      '.loader',
      '[data-testid="loading"]'
    ].join(','));
    
    if (loadingIndicators.length > 0) {
      console.log('🔄 Found loading indicators:', loadingIndicators.length);
      return true;
    }
    
    // Check if there are any network requests in progress (basic check)
    const performanceEntries = performance.getEntriesByType('resource');
    const recentRequests = performanceEntries.filter(entry => 
      entry.name.includes('cleartrip.com') && 
      Date.now() - entry.startTime < 5000
    );
    
    if (recentRequests.length > 5) {
      console.log('🌐 Detected recent network activity:', recentRequests.length);
      return true;
    }
    
    // Check for Cleartrip-specific flight container loading states
    const flightContainers = document.querySelectorAll('.sc-aXZVg.dczbns.mb-2.bg-white');
    const emptyContainers = Array.from(flightContainers).filter(container => {
      // Check if container has flight number elements
      const flightNumberElement = container.querySelector('.sc-eqUAAy.fkahrI');
      return !flightNumberElement || !flightNumberElement.textContent.trim();
    });
    
    if (emptyContainers.length > 0) {
      console.log('📦 Found empty flight containers:', emptyContainers.length);
      return true;
    }
    
    // Check if we have a reasonable number of flights (at least 5 for a typical search)
    const flightCount = flightContainers.length;
    if (flightCount < 5) {
      console.log(`📊 Low flight count (${flightCount}), might still be loading...`);
      return true;
    }
    
    return false;
  }

  // Get current number of flight cards
  getCurrentFlightCount() {
    const flightCards = document.querySelectorAll('.sc-aXZVg.dczbns.mb-2.bg-white');
    return flightCards.length;
  }

  // Process flights on the page with retry mechanism
  async processFlights() {
    if (!this.aircraftManager) {
      console.error('Aircraft manager not initialized');
      return;
    }

    // Check if already processing
    if (this.processingQueue.has('processFlights')) {
      console.log('⏳ Flight processing already in progress, skipping...');
      return;
    }

    this.processingQueue.add('processFlights');

    try {
      console.log('🚀 Starting flight processing...');
      await this.aircraftManager.processFlights();
      
      // Log statistics
      const stats = this.aircraftManager.getStats();
      console.log('Flight processing stats:', stats);
      
      // Check if we need to retry for missing flights
      const missingFlights = this.aircraftManager.getMissingFlightsForExport();
      const currentFlightCount = this.getCurrentFlightCount();
      
      // Only retry if we have missing flights and haven't exceeded max retries
      if (missingFlights.length > 0 && this.retryCount < this.maxRetries) {
        console.log(`🔄 ${missingFlights.length} flights still missing, retrying in ${this.retryDelay}ms...`);
        console.log(`📊 Current flight count: ${currentFlightCount}, Retry count: ${this.retryCount}`);
        this.retryCount++;
        setTimeout(() => {
          this.processingQueue.delete('processFlights');
          this.processFlights();
        }, this.retryDelay);
        return;
      }
      
      this.retryCount = 0; // Reset retry count on success
      
    } catch (error) {
      console.error('Error processing flights:', error);
    } finally {
      this.processingQueue.delete('processFlights');
    }
  }

  // Set up mutation observer for dynamic content
  setupObserver() {
    if (!this.aircraftManager) return;

    this.observer = new MutationObserver(mutations => {
      let shouldReprocess = false;
      let newFlightCards = 0;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if new flight cards were added
            if (node.matches && node.matches('.sc-aXZVg.dczbns.mb-2.bg-white')) {
              shouldReprocess = true;
              newFlightCards++;
            } else if (node.querySelectorAll) {
              const flightCards = node.querySelectorAll('.sc-aXZVg.dczbns.mb-2.bg-white');
              if (flightCards.length > 0) {
                shouldReprocess = true;
                newFlightCards += flightCards.length;
              }
            }
          }
        });
      });
      
      if (shouldReprocess) {
        console.log(`🆕 ${newFlightCards} new flight cards detected, reprocessing...`);
        // Add delay to let more flights load
        setTimeout(() => {
          this.processFlights();
        }, 500);
      }
    });
    
    this.observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
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