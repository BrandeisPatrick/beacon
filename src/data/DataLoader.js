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
}