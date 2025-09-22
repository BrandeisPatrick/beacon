export class DataLoader {
  static async loadMapData() {
    try {
      const [statesResponse, citiesResponse] = await Promise.all([
        fetch('/data/us-states.json'),
        fetch('/data/us-cities.json')
      ]);

      if (!statesResponse.ok || !citiesResponse.ok) {
        throw new Error(`HTTP error! States: ${statesResponse.status}, Cities: ${citiesResponse.status}`);
      }

      const statesData = await statesResponse.json();
      const citiesData = await citiesResponse.json();

      // Filter out cities from Alaska and Hawaii to focus on contiguous US
      const excludedStates = ['Alaska', 'Hawaii'];
      const filteredCities = citiesData.cities.filter(city =>
        !excludedStates.includes(city.state)
      );

      return {
        states: statesData,
        cities: filteredCities
      };
    } catch (error) {
      console.error('Error loading map data:', error);
      throw error;
    }
  }

  static async loadCoffeeShopData() {
    try {
      const response = await fetch('/data/coffeeShops.json');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const coffeeShopData = await response.json();
      return coffeeShopData;
    } catch (error) {
      console.error('Error loading coffee shop data:', error);
      throw error;
    }
  }

  static async loadBusinessData(city = 'atlanta') {
    try {
      // Try to fetch enriched data from API first
      try {
        const response = await fetch(`/api/businesses?city=${city}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.length > 0) {
            console.log(`Loaded ${result.data.length} enriched businesses from API`);
            return result.data;
          }
        }
      } catch (apiError) {
        console.warn('API not available, falling back to static data:', apiError.message);
      }

      // Fallback to static JSON data
      const coffeeShopData = await this.loadCoffeeShopData();

      // Return data for the specified city, defaulting to atlanta
      if (coffeeShopData[city]) {
        return coffeeShopData[city];
      } else {
        console.warn(`No data found for city: ${city}, falling back to atlanta`);
        return coffeeShopData.atlanta || [];
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      throw error;
    }
  }
}