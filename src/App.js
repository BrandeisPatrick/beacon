import * as TWEEN from '@tweenjs/tween.js';
import { Scene } from './components/Scene.js';
import { MapRenderer } from './components/MapRenderer.js';
import { CityMarkers } from './components/CityMarkers.js';
import { InteractionHandler } from './components/InteractionHandler.js';
import { Navigation } from './components/Navigation.js';
import { DataLoader } from './data/DataLoader.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';

export class App {
  constructor() {
    this.scene = null;
    this.mapRenderer = null;
    this.cityMarkers = null;
    this.interactionHandler = null;
    this.navigation = null;
    this.loadingIndicator = null;
    this.animationId = null;
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
      // Initialize components
      this.scene = new Scene();
      this.scene.init(container);

      this.mapRenderer = new MapRenderer();
      this.cityMarkers = new CityMarkers();
      this.interactionHandler = new InteractionHandler(this.scene, this.mapRenderer, this.cityMarkers);

      // Add city markers group to scene
      this.scene.add(this.cityMarkers.getGroup());

      // Load data and render map
      const { states, cities } = await DataLoader.loadMapData();
      
      const mapGroup = this.mapRenderer.renderStates(states);
      this.scene.add(mapGroup);

      this.interactionHandler.setCities(cities);
      this.interactionHandler.init(this.scene.renderer);

      // Setup event listeners
      window.addEventListener('resize', this.onWindowResize.bind(this), false);

      // Hide loading indicator
      this.loadingIndicator.hide();

      // Start animation loop
      this.animate();

    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.loadingIndicator.showError('Failed to load map data. Please try refreshing the page.');
    }
  }

  onWindowResize() {
    this.scene.onWindowResize();
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    TWEEN.update();
    this.scene.render();
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onWindowResize);
  }
}