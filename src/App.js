import { SVGMapRenderer } from './components/SVGMapRenderer.js';
import { SVGCityMarkers } from './components/SVGCityMarkers.js';
import { SVGInteractionHandler } from './components/SVGInteractionHandler.js';
import { Navigation } from './components/Navigation.js';
import { DataLoader } from './data/DataLoader.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';

export class App {
  constructor() {
    this.mapRenderer = null;
    this.cityMarkers = null;
    this.interactionHandler = null;
    this.navigation = null;
    this.loadingIndicator = null;
  }

  async init() {
    const app = document.getElementById('app');
    const container = document.getElementById('container');
    if (!app || !container) {
      throw new Error('Required elements not found');
    }

    // Initialize navigation first
    this.navigation = new Navigation();
    this.navigation.init(app);

    this.loadingIndicator = new LoadingIndicator();
    this.loadingIndicator.show(container);

    try {
      // Initialize SVG-based components
      this.mapRenderer = new SVGMapRenderer();
      await this.mapRenderer.init(container);

      this.cityMarkers = new SVGCityMarkers();
      this.cityMarkers.init(this.mapRenderer.svg);

      this.interactionHandler = new SVGInteractionHandler(this.mapRenderer, this.cityMarkers);

      // Load data and render map
      const { states, cities } = await DataLoader.loadMapData();

      this.mapRenderer.renderStates(states);
      this.interactionHandler.setCities(cities);

      // Setup event listeners
      window.addEventListener('resize', this.onWindowResize.bind(this), false);

      // Hide loading indicator
      this.loadingIndicator.hide();

    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.loadingIndicator.showError('Failed to load map data. Please try refreshing the page.');
    }
  }

  onWindowResize() {
    if (this.mapRenderer) {
      this.mapRenderer.onResize();
    }
  }

  destroy() {
    window.removeEventListener('resize', this.onWindowResize);
  }
}