export class SVGCityMarkers {
  constructor() {
    this.markersGroup = null;
    this.cities = [];
  }

  init(svgElement) {
    // Create a group for city markers within the SVG
    this.markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.markersGroup.setAttribute('class', 'city-markers-group');
    svgElement.appendChild(this.markersGroup);
  }

  showMarkers(cities, stateName) {
    // Clear existing markers and don't show any new ones
    this.clear();
    // Removed city marker creation to eliminate all circular elements
  }

  createCityMarker(city) {
    if (!this.markersGroup) return;

    // Convert lat/lon to SVG coordinates (simplified projection)
    const x = (city.lon + 180) * (1000 / 360);
    const y = (90 - city.lat) * (600 / 180);

    // Create marker circle
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('cx', x);
    marker.setAttribute('cy', y);
    marker.setAttribute('r', '3');
    marker.setAttribute('class', 'city-marker');

    // Different colors based on service availability
    const color = city.service ? '#00ff88' : '#ff4444';
    marker.setAttribute('fill', color);
    marker.setAttribute('stroke', '#ffffff');
    marker.setAttribute('stroke-width', '1');
    marker.setAttribute('opacity', '0.8');

    // Add hover effects
    marker.addEventListener('mouseenter', () => {
      marker.setAttribute('r', '5');
      marker.setAttribute('opacity', '1');
    });

    marker.addEventListener('mouseleave', () => {
      marker.setAttribute('r', '3');
      marker.setAttribute('opacity', '0.8');
    });

    // Add city name tooltip (optional)
    if (city.name) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = city.name;
      marker.appendChild(title);
    }

    this.markersGroup.appendChild(marker);
  }

  clear() {
    if (this.markersGroup) {
      this.markersGroup.innerHTML = '';
    }
  }

  destroy() {
    if (this.markersGroup && this.markersGroup.parentNode) {
      this.markersGroup.parentNode.removeChild(this.markersGroup);
    }
  }
}