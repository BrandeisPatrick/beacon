import { BASE_COLOR, SELECTED_COLOR, BORDER_COLOR } from '../utils/constants.js';

export class SVGMapRenderer {
  constructor() {
    this.states = new Map();
    this.selectedState = null;
    this.hoveredState = null;
    this.svg = null;
    this.mapGroup = null;
    this.onStateClick = null;
    this.onStateHover = null;
  }

  async init(container) {
    // Create SVG element
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', '0 0 1000 600');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.classList.add('us-map-svg');

    // Create defs for filters and gradients
    this.createSVGFilters();

    // Create main map group
    this.mapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.mapGroup.setAttribute('class', 'map-group');
    this.svg.appendChild(this.mapGroup);

    container.appendChild(this.svg);
  }

  createSVGFilters() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Simple gradient for states
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'state-gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#404047');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#2d2d30');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);

    // Subtle glow effect for selected states
    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowFilter.setAttribute('id', 'subtle-glow');
    glowFilter.setAttribute('x', '-20%');
    glowFilter.setAttribute('y', '-20%');
    glowFilter.setAttribute('width', '140%');
    glowFilter.setAttribute('height', '140%');

    // Create a subtle inner glow
    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '1');
    blur.setAttribute('result', 'coloredBlur');

    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mergeNode1.setAttribute('in', 'coloredBlur');
    const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mergeNode2.setAttribute('in', 'SourceGraphic');

    merge.appendChild(mergeNode1);
    merge.appendChild(mergeNode2);

    glowFilter.appendChild(blur);
    glowFilter.appendChild(merge);

    defs.appendChild(gradient);
    defs.appendChild(glowFilter);
    this.svg.appendChild(defs);
  }

  renderStates(statesData) {
    // Clear existing states
    this.mapGroup.innerHTML = '';
    this.states.clear();

    const excludedStates = ['Alaska', 'Hawaii'];

    statesData.features.forEach(feature => {
      if (excludedStates.includes(feature.properties.name)) {
        return;
      }

      const stateElement = this.createStateElement(feature);
      if (stateElement) {
        this.mapGroup.appendChild(stateElement);
        this.states.set(feature.properties.name, {
          element: stateElement,
          feature: feature
        });
      }
    });

    // Center the map
    this.centerMap();
  }

  createStateElement(feature) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'state-group');
    group.setAttribute('data-state', feature.properties.name);

    const path = this.createPathFromGeometry(feature.geometry);
    if (!path) return null;

    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('class', 'state-path');
    pathElement.setAttribute('fill', 'url(#state-gradient)');
    pathElement.setAttribute('stroke', '#505055');
    pathElement.setAttribute('stroke-width', '0.3');

    // Add interaction event listeners
    pathElement.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleStateClick(feature.properties.name);
    });

    pathElement.addEventListener('mouseenter', () => {
      this.handleStateHover(feature.properties.name, true);
    });

    pathElement.addEventListener('mouseleave', () => {
      this.handleStateHover(feature.properties.name, false);
    });

    group.appendChild(pathElement);
    return group;
  }

  createPathFromGeometry(geometry) {
    let pathData = '';

    const processCoordinates = (coordinates) => {
      return coordinates.map(coord => {
        // Convert longitude/latitude to SVG coordinates
        const x = (coord[0] + 180) * (1000 / 360);
        const y = (90 - coord[1]) * (600 / 180);
        return [x, y];
      });
    };

    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((ring, ringIndex) => {
        const points = processCoordinates(ring);
        points.forEach((point, pointIndex) => {
          if (pointIndex === 0) {
            pathData += `M ${point[0]} ${point[1]} `;
          } else {
            pathData += `L ${point[0]} ${point[1]} `;
          }
        });
        pathData += 'Z ';
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => {
        polygon.forEach((ring, ringIndex) => {
          const points = processCoordinates(ring);
          points.forEach((point, pointIndex) => {
            if (pointIndex === 0) {
              pathData += `M ${point[0]} ${point[1]} `;
            } else {
              pathData += `L ${point[0]} ${point[1]} `;
            }
          });
          pathData += 'Z ';
        });
      });
    }

    return pathData;
  }

  centerMap() {
    // Get bounding box of all states
    const bbox = this.mapGroup.getBBox();

    // Calculate scale and translate to center the map
    const scale = Math.min(900 / bbox.width, 500 / bbox.height);
    const translateX = (1000 - bbox.width * scale) / 2 - bbox.x * scale;
    const translateY = (600 - bbox.height * scale) / 2 - bbox.y * scale;

    this.mapGroup.setAttribute('transform',
      `translate(${translateX}, ${translateY}) scale(${scale})`
    );
  }

  handleStateClick(stateName) {
    // Deselect previous state
    if (this.selectedState && this.selectedState !== stateName) {
      this.deselectState(this.selectedState);
    }

    // Select new state
    this.selectedState = stateName;
    this.selectState(stateName);

    // Call external click handler
    if (this.onStateClick) {
      this.onStateClick(stateName);
    }
  }

  handleStateHover(stateName, isHovering) {
    if (isHovering && stateName !== this.selectedState) {
      this.hoverState(stateName);
      this.hoveredState = stateName;
    } else if (!isHovering && this.hoveredState === stateName) {
      this.unhoverState(stateName);
      this.hoveredState = null;
    }

    // Call external hover handler
    if (this.onStateHover) {
      this.onStateHover(stateName, isHovering);
    }
  }

  selectState(stateName) {
    const state = this.states.get(stateName);
    if (!state) return;

    const pathElement = state.element.querySelector('.state-path');
    pathElement.setAttribute('fill', '#4a4a55');
    pathElement.setAttribute('stroke', '#6a6a75');
    pathElement.setAttribute('stroke-width', '1.2');
    pathElement.setAttribute('filter', 'url(#subtle-glow)');
    pathElement.style.transition = 'all 0.3s ease';
  }

  deselectState(stateName) {
    const state = this.states.get(stateName);
    if (!state) return;

    const pathElement = state.element.querySelector('.state-path');
    pathElement.setAttribute('fill', 'url(#state-gradient)');
    pathElement.setAttribute('stroke', '#505055');
    pathElement.setAttribute('stroke-width', '0.3');
    pathElement.removeAttribute('filter');
  }

  hoverState(stateName) {
    // Removed hover effects
  }

  unhoverState(stateName) {
    // Removed hover effects
  }

  getStates() {
    return Array.from(this.states.keys());
  }

  onResize() {
    // SVG will automatically resize with viewBox
    // No additional handling needed
  }
}