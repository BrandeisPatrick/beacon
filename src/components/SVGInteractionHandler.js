export class SVGInteractionHandler {
  constructor(mapRenderer, cityMarkers) {
    this.mapRenderer = mapRenderer;
    this.cityMarkers = cityMarkers;
    this.selectedState = null;
    this.cities = [];

    // Bind event handlers
    this.mapRenderer.onStateClick = this.onStateClick.bind(this);
    this.mapRenderer.onStateHover = this.onStateHover.bind(this);
  }

  setCities(cities) {
    this.cities = cities;
  }

  onStateClick(stateName) {
    console.log('State clicked:', stateName);

    // Handle state selection
    if (this.selectedState === stateName) {
      // Deselect if clicking the same state
      this.deselectAll();
    } else {
      // Select new state
      this.selectState(stateName);
    }
  }

  onStateHover(stateName, isHovering) {
    if (isHovering) {
      // Change cursor to pointer
      document.body.style.cursor = 'pointer';
    } else {
      // Reset cursor
      document.body.style.cursor = 'default';
    }
  }

  selectState(stateName) {
    // Deselect previous state
    if (this.selectedState) {
      this.deselectState(this.selectedState);
    }

    this.selectedState = stateName;

    // Add visual selection state
    const state = this.mapRenderer.states.get(stateName);
    if (state) {
      state.element.classList.add('selected');

      // Add brief click animation
      const pathElement = state.element.querySelector('.state-path');

      // Subtle press animation
      pathElement.style.opacity = '0.9';
      pathElement.style.transform = 'scale(0.995)';
      pathElement.style.transformOrigin = 'center';

      // Reset to selected state appearance
      setTimeout(() => {
        pathElement.style.opacity = '1';
        pathElement.style.transform = 'scale(1)';
        if (this.selectedState === stateName) {
          // Apply selection styling through SVGMapRenderer
          this.mapRenderer.selectState(stateName);
        }
      }, 150);
    }

    // Show city markers for the selected state
    if (this.cityMarkers) {
      this.cityMarkers.showMarkers(this.cities, stateName);
    }

    // Dispatch custom event for external listeners
    const event = new CustomEvent('stateSelected', {
      detail: { stateName, cities: this.cities.filter(city =>
        city.state === stateName || city.state_name === stateName
      )}
    });
    document.dispatchEvent(event);
  }

  deselectState(stateName) {
    const state = this.mapRenderer.states.get(stateName);
    if (state) {
      state.element.classList.remove('selected');
    }
  }

  deselectAll() {
    if (this.selectedState) {
      this.deselectState(this.selectedState);
      this.selectedState = null;

      // Hide city markers
      if (this.cityMarkers) {
        this.cityMarkers.clear();
      }

      // Dispatch deselection event
      const event = new CustomEvent('stateDeselected');
      document.dispatchEvent(event);
    }
  }

  // Animation helpers with CSS transitions instead of TWEEN.js
  animateElement(element, properties, duration = 300) {
    return new Promise(resolve => {
      const originalTransition = element.style.transition;
      element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

      Object.keys(properties).forEach(prop => {
        element.style[prop] = properties[prop];
      });

      setTimeout(() => {
        element.style.transition = originalTransition;
        resolve();
      }, duration);
    });
  }

  // Smooth state highlighting with CSS
  highlightState(stateName, highlight = true) {
    const state = this.mapRenderer.states.get(stateName);
    if (!state) return;

    const pathElement = state.element.querySelector('.state-path');
    if (highlight) {
      pathElement.style.filter = 'brightness(1.15)';
      pathElement.style.transform = 'scale(1.01)';
    } else {
      pathElement.style.filter = 'none';
      pathElement.style.transform = 'scale(1)';
    }
  }

  // Get state information
  getStateInfo(stateName) {
    const state = this.mapRenderer.states.get(stateName);
    if (!state) return null;

    const stateCities = this.cities.filter(city =>
      city.state === stateName || city.state_name === stateName
    );

    return {
      name: stateName,
      cities: stateCities,
      cityCount: stateCities.length,
      feature: state.feature
    };
  }

  // Public API methods
  programmaticallySelectState(stateName) {
    this.selectState(stateName);
  }

  getSelectedState() {
    return this.selectedState;
  }

  getAllStates() {
    return this.mapRenderer.getStates();
  }
}