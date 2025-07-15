// Cleartrip platform-specific implementation
class CleartripPlatform {
  constructor() {
    this.apiBaseUrl = 'https://www.cleartrip.com/flight/search/v2';
  }

  // Extract search parameters from Cleartrip URL
  getSearchParams(url) {
    const params = new URL(url).searchParams;
    return {
      from: params.get('from'),
      to: params.get('to'),
      departDate: params.get('depart_date'),
      travelClass: params.get('class') || 'Economy',
      adults: params.get('adults') || '1',
      childs: params.get('childs') || '0',
      infants: params.get('infants') || '0',
      isIntl: params.get('intl') || 'n',
      isMultiFare: params.get('isMultiFare') || 'true',
      isFFSC: params.get('isFFSC') || 'false'
    };
  }

  // Build API URL for Cleartrip
  buildApiUrl(searchParams) {
    const params = new URLSearchParams({
      from: searchParams.from,
      source_header: searchParams.from,
      to: searchParams.to,
      destination_header: searchParams.to,
      depart_date: searchParams.departDate,
      class: searchParams.travelClass,
      adults: searchParams.adults,
      childs: searchParams.childs,
      infants: searchParams.infants,
      mobileApp: 'true',
      intl: searchParams.isIntl,
      responseType: 'jsonV3',
      source: 'DESKTOP',
      utm_currency: 'INR',
      sft: '',
      return_date: '',
      carrier: '',
      cfw: 'false',
      multiFare: searchParams.isMultiFare,
      isFFSC: searchParams.isFFSC
    });
    
    return `${this.apiBaseUrl}?${params.toString()}`;
  }

  // Fetch aircraft data from Cleartrip API
  async fetchAircraftData() {
    try {
      const pageUrl = window.location.href;
      const searchParams = this.getSearchParams(pageUrl);
      const apiUrl = this.buildApiUrl(searchParams);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'app-agent': 'DESKTOP' }
      });

      if (!response.ok) {
        console.error(`Error fetching aircraft data: HTTP status ${response.status}`);
        return {};
      }

      const data = await response.json();
      return this.parseApiResponse(data);
    } catch (error) {
      console.error('Error fetching aircraft data from Cleartrip:', error);
      return {};
    }
  }

  // Parse Cleartrip API response
  parseApiResponse(data) {
    const aircraftMap = {};
    
    console.log('Parsing Cleartrip API response:', data);
    
    // Handle the cards structure (new API format)
    if (data && data.cards) {
      for (const journeyId in data.cards) {
        const cards = data.cards[journeyId];
        
        for (const card of cards) {
          if (card.summary && card.summary.flights) {
            for (const flight of card.summary.flights) {
              const normalizedFlightNumber = this.normalizeFlightNumber(flight.airlineCode + flight.flightNumber);
              
              // Try to get aircraft type from the flights object if available
              let aircraftType = null;
              if (data.flights) {
                const flightKey = `${flight.airlineCode}-${flight.flightNumber}`;
                // Look for matching flight in the flights object
                for (const key in data.flights) {
                  if (key.includes(flightKey)) {
                    aircraftType = data.flights[key].aircraftType;
                    break;
                  }
                }
              }
              
              aircraftMap[normalizedFlightNumber] = {
                aircraftType: aircraftType || 'Unknown',
                airlineCode: flight.airlineCode,
                flightNumber: flight.flightNumber,
                source: 'cleartrip_api'
              };
              
              console.log(`Mapped flight ${normalizedFlightNumber}: ${aircraftType || 'Unknown'}`);
            }
          }
        }
      }
    }
    
    // Fallback: Handle the old flights structure if available
    if (data && typeof data.flights === 'object' && data.flights !== null) {
      for (const flightKey of Object.keys(data.flights)) {
        const flightObj = data.flights[flightKey];
        const normalizedFlightNumber = this.normalizeFlightNumber(flightObj.airlineCode + flightObj.fltNo);
        
        aircraftMap[normalizedFlightNumber] = {
          aircraftType: flightObj.aircraftType || 'Unknown',
          airlineCode: flightObj.airlineCode,
          flightNumber: flightObj.fltNo,
          source: 'cleartrip_api'
        };
        
        console.log(`Mapped flight ${normalizedFlightNumber}: ${flightObj.aircraftType || 'Unknown'}`);
      }
    }
    
    console.log('Final aircraft map:', aircraftMap);
    return aircraftMap;
  }

  // Normalize flight number (remove spaces/dashes, uppercase)
  normalizeFlightNumber(flightNumber) {
    return flightNumber.replace(/[-\s]/g, '').toUpperCase();
  }

  // Extract flight numbers from Cleartrip DOM
  extractFlightNumbers() {
    const flightNumbers = [];
    const flightCards = document.querySelectorAll('.sc-aXZVg.dczbns.mb-2.bg-white');
    
    console.log(`Found ${flightCards.length} flight cards in DOM`);
    
    flightCards.forEach((card, index) => {
      const flightNumberElement = card.querySelector('.sc-eqUAAy.fkahrI');
      if (flightNumberElement) {
        const rawFlightNumber = flightNumberElement.textContent.trim();
        const normalizedFlightNumber = this.normalizeFlightNumber(rawFlightNumber);
        
        console.log(`Flight ${index + 1}: Raw="${rawFlightNumber}", Normalized="${normalizedFlightNumber}"`);
        
        flightNumbers.push({
          element: card,
          flightNumber: normalizedFlightNumber,
          rawFlightNumber: rawFlightNumber
        });
      } else {
        console.warn(`No flight number element found in card ${index + 1}`);
      }
    });
    
    console.log('Extracted flight numbers:', flightNumbers.map(f => f.flightNumber));
    return flightNumbers;
  }

  // Get platform name
  getPlatformName() {
    return 'cleartrip';
  }
}

// Export for use in main content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CleartripPlatform;
} else {
  window.CleartripPlatform = CleartripPlatform;
} 