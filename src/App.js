import { SVGMapRenderer } from './components/SVGMapRenderer.js';
import { SVGCityMarkers } from './components/SVGCityMarkers.js';
import { SVGInteractionHandler } from './components/SVGInteractionHandler.js';
import { Navigation } from './components/Navigation.js';
import { DatabaseTable } from './components/DatabaseTable.js';
import { RadarLogs } from './components/RadarLogs.js';
import { DataLoader } from './data/DataLoader.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';

export class App {
  constructor() {
    this.mapRenderer = null;
    this.cityMarkers = null;
    this.interactionHandler = null;
    this.navigation = null;
    this.databaseTable = null;
    this.radarLogs = null;
    this.loadingIndicator = null;
    this.mapContainer = null;
    this.currentTab = 'map';
  }

  async init() {
    const app = document.getElementById('app');
    const container = document.getElementById('container');
    if (!app || !container) {
      throw new Error('Required elements not found');
    }

    // Store reference to main container
    this.mapContainer = container;

    // Initialize navigation first
    this.navigation = new Navigation();
    this.navigation.init(app);
    this.navigation.setTabChangeHandler(this.handleTabChange.bind(this));

    // Initialize database table
    this.databaseTable = new DatabaseTable();
    this.databaseTable.init(container);

    // Initialize radar logs
    this.radarLogs = new RadarLogs();
    this.radarLogs.init(container);

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

      // Load coffee shop data for database table
      const coffeeShopData = await DataLoader.loadBusinessData('atlanta');
      this.databaseTable.setData(coffeeShopData);

      // Setup event listeners
      window.addEventListener('resize', this.onWindowResize.bind(this), false);

      // Show initial tab (map by default)
      this.showTab(this.currentTab);

      // Hide loading indicator
      this.loadingIndicator.hide();

    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.loadingIndicator.showError('Failed to load map data. Please try refreshing the page.');
    }
  }

  handleTabChange(tabName) {
    this.currentTab = tabName;
    this.showTab(tabName);
  }

  showTab(tabName) {
    // Hide all content first
    if (this.mapRenderer && this.mapRenderer.svg) {
      this.mapRenderer.svg.style.display = 'none';
    }
    if (this.databaseTable) {
      this.databaseTable.hide();
    }
    if (this.radarLogs) {
      this.radarLogs.hide();
    }

    // Show the selected tab content
    switch (tabName) {
      case 'map':
        if (this.mapRenderer && this.mapRenderer.svg) {
          this.mapRenderer.svg.style.display = 'block';
        }
        break;
      case 'database':
        if (this.databaseTable) {
          this.databaseTable.show();
        }
        break;
      case 'batch-logs':
        if (this.radarLogs) {
          this.radarLogs.show();
        }
        break;
      case 'contact':
        // TODO: Implement contact tab
        console.log('Contact tab not implemented yet');
        break;
      default:
        console.warn(`Unknown tab: ${tabName}`);
    }
  }

  onWindowResize() {
    if (this.mapRenderer) {
      this.mapRenderer.onResize();
    }
  }

  destroy() {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.databaseTable) {
      this.databaseTable.destroy();
    }
    if (this.radarLogs) {
      this.radarLogs.destroy();
    }
  }
}